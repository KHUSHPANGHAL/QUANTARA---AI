"""
Quantara AI — Predictive Performance Evaluator
Evaluates machine learning models (Random Forest, Logistic Regression, LightGBM)
strictly on out-of-sample predictive accuracy, balanced accuracy, and Macro F1.
Completely independent of trading profitability, portfolio returns, or cash allocation.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, precision_score, recall_score

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models" / "horizon_5d"
DATA_DIR = ROOT / "data" / "splits" / "horizon_5d"

_EVALUATION_CACHE: Dict[str, Dict[str, Any]] = {}

def get_out_of_sample_data(split: str = "test"):
    """
    Load validated, leakage-free dataset split.
    Options: 'test' (243 sessions), 'validation' (242 sessions), 'combined' (485 sessions).
    """
    if split == "combined":
        X_v = pd.read_csv(DATA_DIR / "X_validation.csv")
        y_v_raw = pd.read_csv(DATA_DIR / "y_validation.csv")
        meta_v = pd.read_csv(DATA_DIR / "metadata_validation.csv")

        X_t = pd.read_csv(DATA_DIR / "X_test.csv")
        y_t_raw = pd.read_csv(DATA_DIR / "y_test.csv")
        meta_t = pd.read_csv(DATA_DIR / "metadata_test.csv")

        X = pd.concat([X_v, X_t], ignore_index=True)
        y_raw = pd.concat([y_v_raw, y_t_raw], ignore_index=True)
        meta = pd.concat([meta_v, meta_t], ignore_index=True)
    else:
        file_suffix = "validation" if split in ("val", "validation") else "test"
        X = pd.read_csv(DATA_DIR / f"X_{file_suffix}.csv")
        y_raw = pd.read_csv(DATA_DIR / f"y_{file_suffix}.csv")
        meta = pd.read_csv(DATA_DIR / f"metadata_{file_suffix}.csv")

    y = y_raw["Target_5d"].map({"DOWN": 0, "HOLD": 1, "UP": 2}).values
    fwd_ret = y_raw["forward_return_5d"].values
    bin_true = (fwd_ret > 0).astype(int)

    return X, y, bin_true, meta


def compute_all_models_predictive_metrics(split: str = "test") -> Dict[str, Any]:
    """
    Dynamically compute predictive metrics for all models across each stock.
    Returns per-stock evaluation metrics and dynamic recommendations.
    """
    global _EVALUATION_CACHE
    if split in _EVALUATION_CACHE:
        return _EVALUATION_CACHE[split]

    try:
        X, y, bin_true, meta = get_out_of_sample_data(split)
        lr = joblib.load(MODELS_DIR / "logistic_regression_baseline.joblib")
        rf = joblib.load(MODELS_DIR / "random_forest_baseline.joblib")
        lgb = joblib.load(MODELS_DIR / "lightgbm_5d_classifier.joblib")
    except Exception as e:
        print(f"Error loading evaluation artifacts: {e}")
        return {}

    models = {
        "random_forest": ("Random Forest", rf),
        "logistic_regression": ("Logistic Regression", lr),
        "lightgbm": ("LightGBM", lgb),
    }

    symbols = sorted(meta["Symbol"].unique())
    stock_metrics = {}

    for sym in symbols:
        mask = (meta["Symbol"] == sym).values
        n_samples = int(mask.sum())
        if n_samples < 5:
            stock_metrics[sym] = {
                "sample_count": n_samples,
                "models": {},
                "recommendation": {
                    "winner": "Insufficient evaluation data",
                    "status": "INSUFFICIENT_DATA",
                    "badge_text": "Insufficient Data",
                    "margin_pct": 0.0,
                    "tooltip": "Sample count is too small to provide a statistically valid recommendation."
                }
            }
            continue

        Xs = X.iloc[mask]
        ys = y[mask]
        bins = bin_true[mask]

        model_evals = {}
        for m_key, (m_label, m_obj) in models.items():
            probs = m_obj.predict_proba(Xs)
            preds = m_obj.predict(Xs)

            pred_dir = (probs[:, 2] > probs[:, 0]).astype(int)
            dir_acc = float((pred_dir == bins).mean() * 100.0)
            acc = float(accuracy_score(ys, preds) * 100.0)
            bal_acc = float(balanced_accuracy_score(ys, preds) * 100.0)
            f1 = float(f1_score(ys, preds, average="macro", zero_division=0) * 100.0)

            # UP class precision & recall
            p_up = float(precision_score(ys, preds, labels=[2], average="micro", zero_division=0) * 100.0)
            r_up = float(recall_score(ys, preds, labels=[2], average="micro", zero_division=0) * 100.0)

            model_evals[m_key] = {
                "name": m_label,
                "directional_accuracy_pct": round(dir_acc, 1),
                "accuracy_pct": round(acc, 1),
                "balanced_accuracy_pct": round(bal_acc, 1),
                "macro_f1_pct": round(f1, 1),
                "precision_up_pct": round(p_up, 1),
                "recall_up_pct": round(r_up, 1),
            }

        # Ranking by directional accuracy (primary), followed by macro F1
        sorted_by_perf = sorted(
            model_evals.items(),
            key=lambda item: (item[1]["directional_accuracy_pct"], item[1]["macro_f1_pct"]),
            reverse=True
        )

        top_key, top_m = sorted_by_perf[0]
        second_key, second_m = sorted_by_perf[1]
        diff = top_m["directional_accuracy_pct"] - second_m["directional_accuracy_pct"]

        # Recommendation rules:
        # If difference < 1.5% between top 2 models, indicate similar performance
        if diff < 1.5:
            rec = {
                "winner": "Similar Performance",
                "badge_text": "Similar Performance",
                "status": "TIED",
                "top_model": top_m["name"],
                "runner_up": second_m["name"],
                "top_score": top_m["directional_accuracy_pct"],
                "runner_up_score": second_m["directional_accuracy_pct"],
                "margin_pct": round(diff, 1),
                "tooltip": f"Top models ({top_m['name']} at {top_m['directional_accuracy_pct']}% and {second_m['name']} at {second_m['directional_accuracy_pct']}%) perform similarly (margin < 1.5%). Validated on {n_samples} unseen out-of-sample sessions."
            }
        else:
            rec = {
                "winner": top_m["name"],
                "badge_text": top_m["name"],
                "status": "RECOMMENDED",
                "top_model": top_m["name"],
                "runner_up": second_m["name"],
                "top_score": top_m["directional_accuracy_pct"],
                "runner_up_score": second_m["directional_accuracy_pct"],
                "margin_pct": round(diff, 1),
                "tooltip": f"Dynamically recommended based solely on highest validated predictive accuracy ({top_m['directional_accuracy_pct']}% vs {second_m['directional_accuracy_pct']}%, +{round(diff, 1)}% lead) over {n_samples} unseen sessions. Independent of trading profitability."
            }

        stock_metrics[sym] = {
            "symbol": sym,
            "sample_count": n_samples,
            "evaluation_split": split,
            "models": model_evals,
            "recommendation": rec,
        }

    payload = {
        "split": split,
        "sample_count_per_stock": len(y) // len(symbols) if symbols else 0,
        "primary_metric": "Directional Accuracy (Out-of-Sample)",
        "supporting_metrics": ["3-Class Accuracy", "Balanced Accuracy", "Macro F1"],
        "stocks": stock_metrics,
    }

    _EVALUATION_CACHE[split] = payload
    return payload

