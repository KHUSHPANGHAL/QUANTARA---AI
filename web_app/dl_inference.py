"""
Quantara AI — PyTorch Deep Learning Real-Time Inference Engine
Supports Recurrent Neural Networks (LSTM and GRU) for 3-class stock trend prediction.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn

ROOT = Path(__file__).resolve().parents[1]

FEATURE_COLS = [
    "daily_return_1d", "return_5d", "return_10d", "return_20d",
    "adj_close_vs_sma20", "adj_close_vs_sma50", "adj_close_vs_ema12",
    "adj_close_vs_ema20", "adj_close_vs_ema26", "rsi_14",
    "macd_pct", "macd_signal_pct", "macd_histogram_pct",
    "bollinger_percent_b", "bollinger_width_pct"
]

SEQ_LEN = 60


class StockLSTMClassifier3Class(nn.Module):
    def __init__(self, input_size=15, hidden_size=64, num_layers=2, dropout=0.2, num_classes=3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0.0,
            batch_first=True
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        out, (hn, cn) = self.lstm(x)
        last_hidden = out[:, -1, :]
        logits = self.fc(last_hidden)
        return logits


class StockGRUClassifier3Class(nn.Module):
    def __init__(self, input_size=15, hidden_size=64, num_layers=2, dropout=0.2, num_classes=3):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0.0,
            batch_first=True
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        out, hn = self.gru(x)
        last_hidden = out[:, -1, :]
        logits = self.fc(last_hidden)
        return logits


# Singleton in-memory model instances
_LOADED_MODELS: Dict[str, nn.Module] = {}
_SCALER = None


def get_scaler():
    global _SCALER
    if _SCALER is None:
        p_scaler = ROOT / "models" / "phase27" / "scaler_3class_fold4.joblib"
        if not p_scaler.exists():
            p_scaler = ROOT / "models" / "phase24" / "scaler.joblib"
        if p_scaler.exists():
            _SCALER = joblib.load(p_scaler)
    return _SCALER


def get_dl_model(model_name: str) -> Optional[nn.Module]:
    """Retrieve or load PyTorch model weights."""
    global _LOADED_MODELS
    if model_name in _LOADED_MODELS:
        return _LOADED_MODELS[model_name]

    if model_name == "lstm":
        model = StockLSTMClassifier3Class(input_size=15, hidden_size=64, num_layers=2, num_classes=3)
        ckpt = ROOT / "models" / "phase27" / "lstm_3class_fold4.pt"
        if not ckpt.exists():
            ckpt = ROOT / "models" / "phase24" / "lstm_model.pt"
    elif model_name == "gru":
        model = StockGRUClassifier3Class(input_size=15, hidden_size=64, num_layers=2, num_classes=3)
        ckpt = ROOT / "models" / "phase27" / "gru_3class_fold3.pt"
        if not ckpt.exists():
            ckpt = ROOT / "models" / "phase24" / "gru_model.pt"
    else:
        return None

    if ckpt.exists():
        state_dict = torch.load(ckpt, map_location="cpu", weights_only=False)
        model.load_state_dict(state_dict)
        model.eval()
        _LOADED_MODELS[model_name] = model
        return model

    return None


def extract_dl_features(df_history: pd.DataFrame) -> pd.DataFrame:
    """Computes the 15 sequence features for DL input."""
    df = df_history.copy()
    p = df["Adj Close"] if "Adj Close" in df else df["Close"]
    close = df["Close"]

    daily_ret = p.pct_change()
    ret_5d = p.pct_change(5)
    ret_10d = p.pct_change(10)
    ret_20d = p.pct_change(20)

    sma20 = p.rolling(20, min_periods=20).mean()
    sma50 = p.rolling(50, min_periods=50).mean()
    ema12 = p.ewm(span=12, adjust=False, min_periods=12).mean()
    ema20 = p.ewm(span=20, adjust=False, min_periods=20).mean()
    ema26 = p.ewm(span=26, adjust=False, min_periods=26).mean()

    # Wilder's 14-period RSI
    delta = p.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1.0 / 14, min_periods=14, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / 14, min_periods=14, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi_14 = 100.0 - (100.0 / (1.0 + rs))
    rsi_14.loc[avg_loss == 0] = 100.0
    rsi_14.loc[(avg_gain == 0) & (avg_loss == 0)] = 50.0

    # MACD (12, 26, 9)
    macd = ema12 - ema26
    macd_signal = macd.ewm(span=9, adjust=False, min_periods=9).mean()
    macd_hist = macd - macd_signal

    # Bollinger Bands
    std20 = p.rolling(20, min_periods=20).std()
    upper = sma20 + 2.0 * std20
    lower = sma20 - 2.0 * std20
    band_range = (upper - lower).replace(0, np.nan)
    pct_b = (p - lower) / band_range
    bw_pct = band_range / sma20

    feat_df = pd.DataFrame({
        "daily_return_1d": daily_ret,
        "return_5d": ret_5d,
        "return_10d": ret_10d,
        "return_20d": ret_20d,
        "adj_close_vs_sma20": (p - sma20) / sma20,
        "adj_close_vs_sma50": (p - sma50) / sma50,
        "adj_close_vs_ema12": (p - ema12) / ema12,
        "adj_close_vs_ema20": (p - ema20) / ema20,
        "adj_close_vs_ema26": (p - ema26) / ema26,
        "rsi_14": rsi_14,
        "macd_pct": macd / p,
        "macd_signal_pct": macd_signal / p,
        "macd_histogram_pct": macd_hist / p,
        "bollinger_percent_b": pct_b,
        "bollinger_width_pct": bw_pct,
    })

    return feat_df[FEATURE_COLS].dropna()


def run_dl_inference(model_name: str, df_history: pd.DataFrame) -> Dict[str, Any]:
    """Execute PyTorch forward inference on rolling historical sequence."""
    model = get_dl_model(model_name)
    scaler = get_scaler()

    if model is None:
        raise ValueError(f"DL Model {model_name} could not be loaded")

    feats = extract_dl_features(df_history)
    if len(feats) < 20:
        raise ValueError(f"Insufficient feature bars ({len(feats)}) for sequence inference")

    # Take the latest SEQ_LEN bars (pad if needed)
    window_feats = feats.iloc[-SEQ_LEN:].copy()
    if len(window_feats) < SEQ_LEN:
        pad_len = SEQ_LEN - len(window_feats)
        first_row = window_feats.iloc[[0]]
        pad_df = pd.concat([first_row] * pad_len, ignore_index=True)
        window_feats = pd.concat([pad_df, window_feats], ignore_index=True)

    if scaler is not None:
        scaled_vals = scaler.transform(window_feats[FEATURE_COLS])
    else:
        scaled_vals = window_feats[FEATURE_COLS].values

    tensor_input = torch.tensor(scaled_vals, dtype=torch.float32).unsqueeze(0)  # Shape (1, 60, 15)

    with torch.no_grad():
        logits = model(tensor_input)
        probs = torch.softmax(logits, dim=-1).numpy()[0]

    p_down, p_hold, p_up = float(probs[0]), float(probs[1]), float(probs[2])
    conviction = float(p_up - p_down)
    pred_class = int(np.argmax(probs))

    if pred_class == 2 and p_up >= 0.38:
        signal = "BUY / LONG"
    elif pred_class == 0 and p_down >= 0.38:
        signal = "SELL / HEDGE"
    else:
        signal = "WAIT / CHOP"

    arch_name = (
        "PyTorch LSTM (2-Layer Recurrent, 64-Hidden)"
        if model_name == "lstm"
        else "PyTorch GRU (2-Layer Gated, 64-Hidden)"
    )

    return {
        "p_down": round(p_down, 4),
        "p_hold": round(p_hold, 4),
        "p_up": round(p_up, 4),
        "conviction": round(conviction, 4),
        "pred_class": pred_class,
        "signal": signal,
        "architecture": arch_name,
        "framework": f"PyTorch {torch.__version__}",
    }
