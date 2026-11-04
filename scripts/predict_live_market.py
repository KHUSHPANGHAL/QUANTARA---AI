"""
Quantara AI — Live Market Ingestion, Prediction & Analysis Engine
================================================================
Fetches real-time / latest daily OHLCV market data for Indian Equities (NSE),
computes the exact 20 Quantara technical features, applies trained models
(Logistic Regression Pipeline, LightGBM, Random Forest), evaluates current
Market Regime (breadth), and generates actionable swing forecasts.

Usage:
  python scripts/predict_live_market.py
  python scripts/predict_live_market.py --model lightgbm
  python scripts/predict_live_market.py --symbol TCS.NS
  python scripts/predict_live_market.py --top-k 2 --save-report
"""

import sys
import os
import argparse
import warnings
from datetime import datetime
from pathlib import Path
import json

# Suppress external library warnings for clean terminal presentation
os.environ["PYTHONWARNINGS"] = "ignore"
warnings.simplefilter("ignore")
warnings.filterwarnings("ignore")
try:
    from pandas.errors import Pandas4Warning
    warnings.simplefilter("ignore", category=Pandas4Warning)
except Exception:
    pass

import numpy as np
import pandas as pd
import joblib

try:
    import yfinance as yf
except ImportError:
    raise ImportError("yfinance is required for live market data. Install with: pip install yfinance")

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models" / "horizon_5d"
CONFIG_PATH = ROOT / "config" / "data_config.json"
REPORTS_DIR = ROOT / "reports" / "live_predictions"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Audited 8 NSE Blue-Chip Universe
DEFAULT_UNIVERSE = [
    "BHARTIARTL.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "INFY.NS",
    "ITC.NS",
    "RELIANCE.NS",
    "SBIN.NS",
    "TCS.NS",
]

# Exact 20 Audited Features
FEATURE_COLS = [
    "daily_return_1d",
    "return_5d",
    "return_20d",
    "adj_close_vs_sma20",
    "adj_close_vs_sma50",
    "adj_close_vs_ema12",
    "adj_close_vs_ema20",
    "adj_close_vs_ema26",
    "rsi_14",
    "macd_pct",
    "macd_signal_pct",
    "macd_histogram_pct",
    "bollinger_percent_b",
    "bollinger_width_pct",
    "volatility_20d_annualized",
    "log_volume_change",
    "volume_vs_sma20",
    "intraday_range_pct",
    "open_gap_pct",
    "close_location_in_range",
]


def fetch_symbol_history(symbol: str, lookback_period: str = "6mo") -> pd.DataFrame:
    """Fetch daily OHLCV history with sufficient lookback to calculate 50-day SMA."""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=lookback_period, auto_adjust=False)
    if not df.empty:
        df = df.dropna(subset=["Close", "Open", "High", "Low"])
    if df.empty or len(df) < 55:
        raise ValueError(f"Insufficient historical data retrieved for {symbol} ({len(df)} sessions).")
    return df


def compute_quantara_features(df_sym: pd.DataFrame) -> pd.DataFrame:
    """
    Computes the exact 20 numerical features in strict adherence
    to Quantara AI's TRAINING_DATA_CONTRACT.md and build_datasets.py.
    """
    df = df_sym.copy()
    p = df["Adj Close"]
    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    op = df["Open"]
    vol = df["Volume"]

    daily = p.pct_change()
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
    rsi = 100.0 - (100.0 / (1.0 + rs))
    rsi.loc[avg_loss == 0] = 100.0
    rsi.loc[(avg_gain == 0) & (avg_loss == 0)] = 50.0

    # MACD (12, 26, 9)
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False, min_periods=9).mean()
    
    # Bollinger Bands (20, 2)
    std20 = p.rolling(20, min_periods=20).std()
    upper = sma20 + 2.0 * std20
    lower = sma20 - 2.0 * std20
    band_range = (upper - lower).replace(0, np.nan)

    vol_sma = vol.rolling(20, min_periods=20).mean()
    prev_close = close.shift(1)
    day_range = high - low

    feats = pd.DataFrame(
        {
            "daily_return_1d": daily,
            "return_5d": p.pct_change(5),
            "return_20d": p.pct_change(20),
            "adj_close_vs_sma20": p / sma20 - 1.0,
            "adj_close_vs_sma50": p / sma50 - 1.0,
            "adj_close_vs_ema12": p / ema12 - 1.0,
            "adj_close_vs_ema20": p / ema20 - 1.0,
            "adj_close_vs_ema26": p / ema26 - 1.0,
            "rsi_14": rsi,
            "macd_pct": macd / p,
            "macd_signal_pct": signal / p,
            "macd_histogram_pct": (macd - signal) / p,
            "bollinger_percent_b": (p - lower) / band_range,
            "bollinger_width_pct": band_range / sma20,
            "volatility_20d_annualized": daily.rolling(20, min_periods=20).std() * np.sqrt(252),
            "log_volume_change": np.log1p(vol).diff(),
            "volume_vs_sma20": vol / vol_sma - 1.0,
            "intraday_range_pct": (high - low) / close,
            "open_gap_pct": op / prev_close - 1.0,
            "close_location_in_range": np.where(day_range > 0, (close - low) / day_range, 0.5),
        },
        index=df.index,
    )

    return feats[FEATURE_COLS]


def load_model_suite(model_name: str):
    """Load serialized trained Quantara model pipeline."""
    if model_name == "logistic_regression":
        file_path = MODELS_DIR / "logistic_regression_baseline.joblib"
    elif model_name == "lightgbm":
        file_path = MODELS_DIR / "lightgbm_5d_classifier.joblib"
    elif model_name == "random_forest":
        file_path = MODELS_DIR / "random_forest_baseline.joblib"
    else:
        raise ValueError(f"Unknown model: {model_name}")

    if not file_path.exists():
        raise FileNotFoundError(f"Trained model not found at: {file_path}")

    return joblib.load(file_path)


def run_live_pipeline(symbols, model_name="logistic_regression", top_k=2, save_report=True):
    print("=" * 95)
    print("QUANTARA AI — LIVE MARKET INGESTION & REAL-TIME PREDICTOR")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} IST | Horizon: 5 Trading Sessions (~1 Week)")
    print(f"Model Engine: {model_name.upper()} | Universe: {len(symbols)} stocks")
    print("=" * 95)

    print("\n[Step 1/4] Fetching latest market bars from NSE via Yahoo Finance...")
    market_data = {}
    feature_data = {}
    above_sma20_count = 0

    for sym in symbols:
        try:
            df = fetch_symbol_history(sym)
            feats = compute_quantara_features(df)
            latest_feats = feats.iloc[[-1]]
            
            # Check for NaN in latest feature row
            if latest_feats.isna().any().any():
                nan_cols = latest_feats.columns[latest_feats.isna().any()].tolist()
                print(f"  [WARN] {sym}: Skipping due to NaN in features: {nan_cols}")
                continue

            market_data[sym] = df
            feature_data[sym] = latest_feats

            # Check market regime indicator (Close > SMA20)
            if latest_feats["adj_close_vs_sma20"].iloc[0] > 0:
                above_sma20_count += 1

            print(f"  [OK] {sym.ljust(15)}: Latest Close: Rs {df['Close'].iloc[-1]:,.2f} (Bar: {df.index[-1].strftime('%Y-%m-%d')})")
        except Exception as e:
            print(f"  [ERROR] Failed to fetch/process {sym}: {e}")

    if not feature_data:
        print("\n[ERROR] No symbols could be successfully processed. Check your network connection.")
        return

    # [Step 2/4] Compute Market Regime (Breadth Filter)
    total_valid = len(feature_data)
    breadth_pct = (above_sma20_count / total_valid) * 100.0

    print("\n[Step 2/4] Market Regime Analysis (Breadth Filter):")
    print(f"  Stocks Above 20-Day SMA: {above_sma20_count} / {total_valid} ({breadth_pct:.1f}%)")
    
    if breadth_pct >= 62.5:
        regime_status = "BULLISH_EXPANSION"
        regime_advice = "Favorable market breadth. Standard swing sizing permitted."
        regime_action = "ACTIVE_TRADING"
    elif breadth_pct >= 37.5:
        regime_status = "NEUTRAL_CHOP"
        regime_advice = "Mixed market breadth. High selectivity recommended; tight stop-loss advised."
        regime_action = "CAUTION_SELECTIVE"
    else:
        regime_status = "BEARISH_CONTRACTION"
        regime_advice = "Unfavorable market regime! Quantara Rule F advises holding up to 100% Cash."
        regime_action = "DEFENSIVE_CASH"

    print(f"  Regime State:  [{regime_status}]")
    print(f"  Guidance:      {regime_advice}")

    # [Step 3/4] Generate Model Forecasts
    print(f"\n[Step 3/4] Running inference using {model_name}...")
    model = load_model_suite(model_name)

    results = []
    for sym, feat_row in feature_data.items():
        probs = model.predict_proba(feat_row)[0]  # [P(DOWN), P(HOLD), P(UP)]
        pred_class = int(np.argmax(probs))
        p_down, p_hold, p_up = probs[0], probs[1], probs[2]

        # Conviction score: P(UP) - P(DOWN)
        conviction_score = p_up - p_down

        df_sym = market_data[sym]
        last_close = df_sym["Close"].iloc[-1]
        prev_close = df_sym["Close"].iloc[-2]
        change_1d = (last_close - prev_close) / prev_close * 100.0

        # Actionable classification label
        if regime_action == "DEFENSIVE_CASH" and p_up < 0.65:
            action_signal = "CASH (Regime Guard)"
        elif pred_class == 2 and p_up >= 0.40:
            action_signal = "BUY / LONG"
        elif pred_class == 0 and p_down >= 0.40:
            action_signal = "SELL / HEDGE"
        else:
            action_signal = "WAIT / CHOP"

        results.append({
            "Symbol": sym,
            "Latest Close": f"Rs {last_close:,.2f}",
            "1D %": f"{change_1d:+.2f}%",
            "RSI-14": f"{feat_row['rsi_14'].iloc[0]:.1f}",
            "Vol 20d": f"{feat_row['volatility_20d_annualized'].iloc[0]*100:.1f}%",
            "P(DOWN)": f"{p_down*100:.1f}%",
            "P(HOLD)": f"{p_hold*100:.1f}%",
            "P(UP)": f"{p_up*100:.1f}%",
            "Conviction": round(conviction_score, 4),
            "Forecast Signal": action_signal,
            "raw_close": last_close,
            "raw_p_up": p_up,
            "raw_p_down": p_down,
            "raw_conviction": conviction_score,
            "latest_bar_date": df_sym.index[-1].strftime("%Y-%m-%d"),
        })

    # Sort results by Conviction (P(UP) relative to P(DOWN))
    results_sorted = sorted(results, key=lambda x: x["raw_conviction"], reverse=True)

    # Format display table
    display_cols = [
        "Symbol", "Latest Close", "1D %", "RSI-14", "Vol 20d",
        "P(DOWN)", "P(HOLD)", "P(UP)", "Forecast Signal"
    ]
    df_display = pd.DataFrame(results_sorted)[display_cols]

    print("\n" + "=" * 95)
    print("LIVE MARKET PREDICTION MATRIX (5-DAY HORIZON)")
    print("=" * 95)
    print(df_display.to_string(index=False))

    # [Step 4/4] Selective Allocation (Top-K Conviction Strategy)
    print("\n" + "=" * 95)
    print(f"TOP CONVICTION ALLOCATION PICKS (Phase 14 Top-{top_k} Policy)")
    print("=" * 95)

    top_picks = [r for r in results_sorted if "BUY" in r["Forecast Signal"]][:top_k]
    if top_picks:
        for idx, pick in enumerate(top_picks, 1):
            print(f"  Pick #{idx}: {pick['Symbol']} (Close: {pick['Latest Close']})")
            print(f"    Conviction: P(UP) = {pick['P(UP)']} vs P(DOWN) = {pick['P(DOWN)']}")
            print(f"    Suggested Allocation: {100.0/top_k:.1f}% max portfolio equity")
            print(f"    Execution: Buy at next Market Open, Hold for 5 sessions, apply 5% stop-loss.")
    else:
        print("  NO BUYS QUALIFY: Market regime or probability distribution does not justify active equity risk.")
        print("  Recommendation: Hold 100% Cash / Liquid Fund.")

    # Save timestamped report
    if save_report:
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file = REPORTS_DIR / f"live_prediction_{stamp}.csv"
        json_file = REPORTS_DIR / f"live_prediction_{stamp}.json"

        pd.DataFrame(results_sorted).to_csv(csv_file, index=False)
        report_payload = {
            "timestamp": datetime.now().isoformat(),
            "model": model_name,
            "market_regime": {
                "breadth_pct": breadth_pct,
                "status": regime_status,
                "guidance": regime_advice,
            },
            "predictions": results_sorted,
        }
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(report_payload, f, indent=2)

        print(f"\nAudit report saved to:\n  {csv_file}\n  {json_file}")

    print("\n" + "-" * 95)
    print("OPERATIONAL REMINDER:")
    print("All signals are probabilistic swing forecasts from research models.")
    print("Past performance does not guarantee future returns. Always maintain strict risk controls.")
    print("-" * 95)


def main():
    parser = argparse.ArgumentParser(description="Quantara AI Live Market Predictor")
    parser.add_argument("--symbol", type=str, default=None, help="Specific NSE symbol (e.g. TCS.NS)")
    parser.add_argument(
        "--model",
        type=str,
        choices=["logistic_regression", "lightgbm", "random_forest"],
        default="logistic_regression",
        help="Model engine to use (default: logistic_regression)",
    )
    parser.add_argument("--top-k", type=int, default=2, help="Number of top conviction picks (default: 2)")
    parser.add_argument("--no-save", action="store_true", help="Disable saving timestamped audit report")
    args = parser.parse_args()

    symbols = [args.symbol] if args.symbol else DEFAULT_UNIVERSE
    run_live_pipeline(
        symbols=symbols,
        model_name=args.model,
        top_k=args.top_k,
        save_report=not args.no_save,
    )


if __name__ == "__main__":
    main()
