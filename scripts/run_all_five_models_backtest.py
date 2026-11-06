"""
Quantara AI — Comprehensive Multi-Model Walk-Forward Backtesting & Capital Simulation
Evaluates ALL 5 Models under identical, institutional-grade cash-equity execution:
  1. Logistic Regression (L2 Standardized Baseline)
  2. Random Forest (100 Decision Trees Ensemble)
  3. LightGBM (Gradient Boosted Trees Classifier)
  4. LSTM (2-Layer Recurrent Neural Network, 60-Day Sequence)
  5. GRU (2-Layer Gated Recurrent Unit, 60-Day Sequence)
Plus:
  - Equal-Weighted Buy-and-Hold Benchmark
  - Cash Yield Benchmark (6.5% Annual Assumed Risk-Free Rate)

Strict Guarantees:
  - Zero fabricated returns or synthetic Math.sin curves
  - Same starting capital: INR 100,000.00
  - Same universe: 8 NSE Blue-Chip Equities
  - Same out-of-sample test window: 248 trading sessions (2025-10-23 to 2026-10-23)
  - Full Indian equity statutory fee schedule + slippage (0.3937% round-trip)
  - Genuine dividend ex-date cash credits
  - Daily mark-to-market NAV and equity curves
"""

import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from web_app.dl_inference import (
    get_dl_model,
    get_scaler,
    extract_dl_features,
    FEATURE_COLS,
    SEQ_LEN,
)

DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models" / "horizon_5d"

STARTING_CAPITAL = 100000.0
MAX_POSITIONS = 3
MAX_HOLD_SESSIONS = 5
CASH_YIELD_ANNUAL = 0.065

# NSE Delivery Fee Schedule
FEE_SCHEDULE = {
    "brokerage_pct": 0.00030,
    "stt_buy_pct": 0.00100,
    "stt_sell_pct": 0.00100,
    "exchange_turnover_pct": 0.0000325,
    "sebi_turnover_pct": 0.000001,
    "stamp_duty_buy_pct": 0.00015,
    "gst_rate": 0.18,
    "slippage_pct": 0.00050,
}

_gst_base_buy = FEE_SCHEDULE["brokerage_pct"] + FEE_SCHEDULE["exchange_turnover_pct"] + FEE_SCHEDULE["sebi_turnover_pct"]
_gst_buy = FEE_SCHEDULE["gst_rate"] * _gst_base_buy
BUY_STATUTORY_FEE = (
    FEE_SCHEDULE["brokerage_pct"]
    + FEE_SCHEDULE["stt_buy_pct"]
    + FEE_SCHEDULE["exchange_turnover_pct"]
    + FEE_SCHEDULE["sebi_turnover_pct"]
    + FEE_SCHEDULE["stamp_duty_buy_pct"]
    + _gst_buy
)

_gst_base_sell = FEE_SCHEDULE["brokerage_pct"] + FEE_SCHEDULE["exchange_turnover_pct"] + FEE_SCHEDULE["sebi_turnover_pct"]
_gst_sell = FEE_SCHEDULE["gst_rate"] * _gst_base_sell
SELL_STATUTORY_FEE = (
    FEE_SCHEDULE["brokerage_pct"]
    + FEE_SCHEDULE["stt_sell_pct"]
    + FEE_SCHEDULE["exchange_turnover_pct"]
    + FEE_SCHEDULE["sebi_turnover_pct"]
    + _gst_sell
)

SLIPPAGE = FEE_SCHEDULE["slippage_pct"]


def extract_dividends(raw_df):
    df = raw_df.sort_values(["Symbol", "Date"]).copy().reset_index(drop=True)
    df["adj_ratio"] = df["Adj Close"] / df["Close"]
    
    div_records = []
    for sym, grp in df.groupby("Symbol"):
        grp = grp.sort_values("Date").reset_index(drop=True)
        grp["ratio_diff"] = grp["adj_ratio"] - grp["adj_ratio"].shift(1)
        events = grp[grp["ratio_diff"] > 1e-4]
        for idx, r in events.iterrows():
            if idx == 0:
                continue
            prev_row = grp.loc[idx - 1]
            div_yield = 1.0 - (prev_row["adj_ratio"] / r["adj_ratio"])
            div_amt = div_yield * prev_row["Close"]
            div_records.append({
                "Symbol": sym,
                "Ex_Date": r["Date"],
                "div_per_share": round(float(div_amt), 4),
                "div_yield_pct": round(float(div_yield * 100.0), 3),
            })
            
    return pd.DataFrame(div_records)


def load_market_data():
    raw = pd.read_csv(DATA_DIR / "raw" / "multi_stock_historical.csv")
    raw["Date"] = pd.to_datetime(raw["Date"])
    
    X_test = pd.read_csv(DATA_DIR / "splits" / "horizon_5d" / "X_test.csv")
    y_test = pd.read_csv(DATA_DIR / "splits" / "horizon_5d" / "y_test.csv")
    meta_test = pd.read_csv(DATA_DIR / "splits" / "horizon_5d" / "metadata_test.csv")
    meta_test["Date"] = pd.to_datetime(meta_test["Date"])
    
    test_dates = sorted(meta_test["Date"].unique())
    start_date = test_dates[0]
    
    raw_test = raw[raw["Date"] >= start_date].sort_values(["Date", "Symbol"]).reset_index(drop=True)
    all_trading_dates = sorted(raw_test["Date"].unique())
    
    open_prices = raw_test.pivot(index="Date", columns="Symbol", values="Open")
    close_prices = raw_test.pivot(index="Date", columns="Symbol", values="Close")
    
    div_df = extract_dividends(raw)
    test_divs = div_df[(div_df["Ex_Date"] >= start_date) & (div_df["Ex_Date"] <= all_trading_dates[-1])].copy()
    
    dividend_lookup = {}
    for _, row in test_divs.iterrows():
        dividend_lookup[(row["Ex_Date"], row["Symbol"])] = row["div_per_share"]
        
    return {
        "raw": raw,
        "raw_test": raw_test,
        "all_trading_dates": all_trading_dates,
        "test_signal_dates": test_dates,
        "open_prices": open_prices,
        "close_prices": close_prices,
        "X_test": X_test,
        "y_test": y_test,
        "meta_test": meta_test,
        "symbols": sorted(raw["Symbol"].unique()),
        "dividend_lookup": dividend_lookup,
        "dividend_events": test_divs,
    }


def compute_portfolio_metrics(equity_series, daily_returns, trade_blotter, is_cash_benchmark=False):
    initial_val = STARTING_CAPITAL
    final_val = float(equity_series.iloc[-1])
    n_days = len(equity_series)
    
    total_return = (final_val - initial_val) / initial_val
    cagr = (final_val / initial_val) ** (252.0 / n_days) - 1.0 if final_val > 0 else -1.0
    
    peaks = equity_series.cummax()
    drawdowns = (peaks - equity_series) / peaks
    max_drawdown = float(drawdowns.max())
    
    rf_daily = (1.0 + CASH_YIELD_ANNUAL) ** (1.0 / 252.0) - 1.0
    excess_returns = daily_returns - rf_daily
    ret_std = float(daily_returns.std())
    
    if is_cash_benchmark or ret_std < 1e-6:
        sharpe = 0.0
    else:
        sharpe = float(np.sqrt(252.0) * (excess_returns.mean() / ret_std))
        
    closed_trades = [t for t in trade_blotter if t["action"] == "SELL"]
    profitable_trades = [t for t in closed_trades if t["net_pnl"] > 0]
    win_rate = len(profitable_trades) / len(closed_trades) if closed_trades else 0.0
    
    gross_gains = sum(t["net_pnl"] for t in closed_trades if t["net_pnl"] > 0)
    gross_losses = abs(sum(t["net_pnl"] for t in closed_trades if t["net_pnl"] < 0))
    profit_factor = float(gross_gains / gross_losses) if gross_losses > 0 else (999.0 if gross_gains > 0 else 0.0)
    
    total_dividends = sum(t["net_pnl"] for t in trade_blotter if t["action"] == "DIVIDEND")
    total_commissions = sum(t["commission"] for t in trade_blotter)
    
    return {
        "initial_equity": float(initial_val),
        "final_equity": float(round(final_val, 2)),
        "total_return_pct": float(round(total_return * 100.0, 2)),
        "cagr_pct": float(round(cagr * 100.0, 2)),
        "max_drawdown_pct": float(round(max_drawdown * 100.0, 2)),
        "annualized_volatility_pct": float(round(ret_std * np.sqrt(252.0) * 100.0, 2)),
        "sharpe_ratio": float(round(sharpe, 2)),
        "total_trades_completed": int(len(closed_trades)),
        "win_rate_pct": float(round(win_rate * 100.0, 2)),
        "profit_factor": float(round(profit_factor, 2)),
        "total_commissions_paid": float(round(total_commissions, 2)),
        "total_dividends_received": float(round(total_dividends, 2)),
    }


def generate_dl_signals(model_name, market):
    print(f"Generating chronological walk-forward signals for {model_name.upper()}...")
    raw = market["raw"]
    meta = market["meta_test"]
    scaler = get_scaler()
    model = get_dl_model(model_name)
    assert model is not None, f"Failed to load DL model {model_name}"
    
    daily_signals = {}
    
    # Pre-extract features per symbol
    symbol_data = {}
    for sym in market["symbols"]:
        df_sym = raw[raw["Symbol"] == sym].sort_values("Date").reset_index(drop=True)
        feats = extract_dl_features(df_sym)
        scaled_mat = scaler.transform(feats[FEATURE_COLS].values)
        symbol_data[sym] = {
            "df": df_sym,
            "scaled": scaled_mat,
            "date_to_idx": {d: idx for idx, d in enumerate(df_sym["Date"])},
        }
        
    for _, row in meta.iterrows():
        d = row["Date"]
        sym = row["Symbol"]
        s_info = symbol_data[sym]
        if d not in s_info["date_to_idx"]:
            continue
        idx = s_info["date_to_idx"][d]
        if idx < SEQ_LEN - 1:
            continue
            
        seq = s_info["scaled"][idx - SEQ_LEN + 1 : idx + 1]
        t = torch.tensor(seq, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            logits = model(t)
            probs = F.softmax(logits, dim=1).numpy()[0]
            pred = int(np.argmax(probs))
            
        if d not in daily_signals:
            daily_signals[d] = {}
        daily_signals[d][sym] = {
            "pred": pred,
            "p_down": float(probs[0]),
            "p_hold": float(probs[1]),
            "p_up": float(probs[2]),
        }
        
    return daily_signals


def run_portfolio_simulation(model_name, daily_signals, market):
    dates = market["all_trading_dates"]
    signal_dates = set(market["test_signal_dates"])
    opens = market["open_prices"]
    closes = market["close_prices"]
    div_lookup = market["dividend_lookup"]
    
    cash = STARTING_CAPITAL
    open_positions = {}
    pending_buys = []
    pending_exits = set()
    
    trade_blotter = []
    daily_records = []
    
    for i, current_date in enumerate(dates):
        # 1. MORNING (Market Open): Process Pending Exits first
        exits_to_process = list(pending_exits)
        for sym in exits_to_process:
            if sym in open_positions:
                pos = open_positions[sym]
                
                div_key = (current_date, sym)
                if div_key in div_lookup and pos["entry_date"] < current_date:
                    credited = pos.get("dividend_credited_dates", set())
                    if current_date not in credited:
                        div_per_share = div_lookup[div_key]
                        div_payout = pos["shares"] * div_per_share
                        cash += div_payout
                        trade_blotter.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "symbol": sym,
                            "action": "DIVIDEND",
                            "shares": pos["shares"],
                            "exec_price": float(div_per_share),
                            "commission": 0.0,
                            "net_pnl": float(div_payout),
                            "reason": f"EX_DIVIDEND_PAYOUT_RS_{div_per_share:.2f}",
                            "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                            "exit_date": current_date.strftime("%Y-%m-%d"),
                            "sessions_held": pos["sessions_held"],
                            "cash_after": float(cash),
                        })
                        pos["dividend_credited_dates"] = credited | {current_date}
                
                raw_open = opens.loc[current_date, sym]
                exec_price = raw_open * (1.0 - SLIPPAGE)
                gross_proceeds = pos["shares"] * exec_price
                fee = gross_proceeds * SELL_STATUTORY_FEE
                net_proceeds = gross_proceeds - fee
                
                cash += net_proceeds
                total_cost = pos["shares"] * pos["entry_price"] * (1.0 + BUY_STATUTORY_FEE)
                net_pnl = net_proceeds - total_cost
                
                trade_blotter.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "symbol": sym,
                    "action": "SELL",
                    "shares": pos["shares"],
                    "exec_price": float(exec_price),
                    "commission": float(fee),
                    "net_pnl": float(net_pnl),
                    "reason": pos.get("exit_reason", "SCHEDULED_EXIT"),
                    "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                    "exit_date": current_date.strftime("%Y-%m-%d"),
                    "sessions_held": pos["sessions_held"],
                    "cash_after": float(cash),
                })
                del open_positions[sym]
        pending_exits.clear()
        
        # 2. MORNING: Process Pending Buys
        pending_buys.sort(key=lambda x: x[1], reverse=True)
        for sym, p_up in pending_buys:
            if len(open_positions) < MAX_POSITIONS and sym not in open_positions:
                avail_slots = MAX_POSITIONS - len(open_positions)
                slot_budget = cash / avail_slots
                raw_open = opens.loc[current_date, sym]
                exec_price = raw_open * (1.0 + SLIPPAGE)
                cost_per_share = exec_price * (1.0 + BUY_STATUTORY_FEE)
                
                shares = int(np.floor(slot_budget / cost_per_share))
                if shares > 0:
                    gross_cost = shares * exec_price
                    fee = gross_cost * BUY_STATUTORY_FEE
                    total_outflow = gross_cost + fee
                    
                    if cash >= total_outflow:
                        cash -= total_outflow
                        open_positions[sym] = {
                            "shares": shares,
                            "entry_price": float(exec_price),
                            "entry_date": current_date,
                            "sessions_held": 0,
                            "exit_reason": "SCHEDULED_EXIT",
                        }
                        trade_blotter.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "symbol": sym,
                            "action": "BUY",
                            "shares": shares,
                            "exec_price": float(exec_price),
                            "commission": float(fee),
                            "net_pnl": 0.0,
                            "reason": f"BUY_SIGNAL_P_UP_{p_up:.3f}",
                            "entry_date": current_date.strftime("%Y-%m-%d"),
                            "exit_date": "",
                            "sessions_held": 0,
                            "cash_after": float(cash),
                        })
        pending_buys.clear()
        
        # 3. INTRADAY: Age active positions
        for sym in open_positions:
            open_positions[sym]["sessions_held"] += 1
            
        # 4. DIVIDENDS: Continuing positions
        for sym, pos in list(open_positions.items()):
            div_key = (current_date, sym)
            if div_key in div_lookup and pos["entry_date"] < current_date:
                credited = pos.get("dividend_credited_dates", set())
                if current_date not in credited:
                    div_per_share = div_lookup[div_key]
                    div_payout = pos["shares"] * div_per_share
                    cash += div_payout
                    trade_blotter.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "symbol": sym,
                        "action": "DIVIDEND",
                        "shares": pos["shares"],
                        "exec_price": float(div_per_share),
                        "commission": 0.0,
                        "net_pnl": float(div_payout),
                        "reason": f"EX_DIVIDEND_PAYOUT_RS_{div_per_share:.2f}",
                        "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                        "exit_date": "",
                        "sessions_held": pos["sessions_held"],
                        "cash_after": float(cash),
                    })
                    pos["dividend_credited_dates"] = credited | {current_date}
                    
        # 5. POST-MARKET: Mark to market
        positions_value = sum(
            pos["shares"] * closes.loc[current_date, sym]
            for sym, pos in open_positions.items()
        )
        total_equity = cash + positions_value
        
        # Final day liquidation
        if i == len(dates) - 1:
            for sym, pos in list(open_positions.items()):
                raw_close = closes.loc[current_date, sym]
                exec_price = raw_close * (1.0 - SLIPPAGE)
                gross_proceeds = pos["shares"] * exec_price
                fee = gross_proceeds * SELL_STATUTORY_FEE
                net_proceeds = gross_proceeds - fee
                cash += net_proceeds
                total_cost = pos["shares"] * pos["entry_price"] * (1.0 + BUY_STATUTORY_FEE)
                trade_blotter.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "symbol": sym,
                    "action": "SELL",
                    "shares": pos["shares"],
                    "exec_price": float(exec_price),
                    "commission": float(fee),
                    "net_pnl": float(net_proceeds - total_cost),
                    "reason": "END_OF_TEST_LIQUIDATION",
                    "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                    "exit_date": current_date.strftime("%Y-%m-%d"),
                    "sessions_held": pos["sessions_held"],
                    "cash_after": float(cash),
                })
            open_positions.clear()
            positions_value = 0.0
            total_equity = cash
            
        daily_records.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "cash": float(cash),
            "positions_value": float(positions_value),
            "total_equity": float(total_equity),
            "open_positions_count": len(open_positions),
        })
        
        # Plan orders for next session
        if i < len(dates) - 1:
            has_signals = current_date in signal_dates
            sigs = daily_signals.get(current_date, {})
            
            for sym, pos in open_positions.items():
                if has_signals and sym in sigs and sigs[sym]["pred"] == 0:
                    pos["exit_reason"] = "DOWN_RISK_EXIT"
                    pending_exits.add(sym)
                elif pos["sessions_held"] >= MAX_HOLD_SESSIONS:
                    pos["exit_reason"] = "MAX_HOLD_5D_EXIT"
                    pending_exits.add(sym)
                    
            if has_signals:
                for sym, s_data in sigs.items():
                    if s_data["pred"] == 2:
                        if sym not in open_positions and sym not in pending_exits:
                            pending_buys.append((sym, s_data["p_up"]))
                            
    df_equity = pd.DataFrame(daily_records)
    df_equity["daily_return"] = df_equity["total_equity"].pct_change().fillna(0.0)
    metrics = compute_portfolio_metrics(df_equity["total_equity"], df_equity["daily_return"], trade_blotter)
    return df_equity, trade_blotter, metrics


def run_buy_and_hold_benchmark(market):
    dates = market["all_trading_dates"]
    opens = market["open_prices"]
    closes = market["close_prices"]
    symbols = market["symbols"]
    div_lookup = market["dividend_lookup"]
    
    cash = STARTING_CAPITAL
    slot_budget = cash / len(symbols)
    positions = {}
    trade_blotter = []
    
    start_date = dates[0]
    for sym in symbols:
        raw_open = opens.loc[start_date, sym]
        exec_price = raw_open * (1.0 + SLIPPAGE)
        cost_per_share = exec_price * (1.0 + BUY_STATUTORY_FEE)
        shares = int(np.floor(slot_budget / cost_per_share))
        
        gross_cost = shares * exec_price
        fee = gross_cost * BUY_STATUTORY_FEE
        total_outflow = gross_cost + fee
        cash -= total_outflow
        
        positions[sym] = {
            "shares": shares,
            "entry_price": float(exec_price),
            "entry_date": start_date,
            "sessions_held": 0,
        }
        trade_blotter.append({
            "date": start_date.strftime("%Y-%m-%d"),
            "symbol": sym,
            "action": "BUY",
            "shares": shares,
            "exec_price": float(exec_price),
            "commission": float(fee),
            "net_pnl": 0.0,
            "reason": "BENCHMARK_BUY",
            "entry_date": start_date.strftime("%Y-%m-%d"),
            "exit_date": "",
            "sessions_held": 0,
            "cash_after": float(cash),
        })
        
    daily_records = []
    for i, d in enumerate(dates):
        for sym in positions:
            positions[sym]["sessions_held"] += 1
            
        for sym, pos in positions.items():
            div_key = (d, sym)
            if div_key in div_lookup and pos["entry_date"] < d:
                credited = pos.get("dividend_credited_dates", set())
                if d not in credited:
                    div_per_share = div_lookup[div_key]
                    div_payout = pos["shares"] * div_per_share
                    cash += div_payout
                    trade_blotter.append({
                        "date": d.strftime("%Y-%m-%d"),
                        "symbol": sym,
                        "action": "DIVIDEND",
                        "shares": pos["shares"],
                        "exec_price": float(div_per_share),
                        "commission": 0.0,
                        "net_pnl": float(div_payout),
                        "reason": f"EX_DIVIDEND_PAYOUT_RS_{div_per_share:.2f}",
                        "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                        "exit_date": "",
                        "sessions_held": pos["sessions_held"],
                        "cash_after": float(cash),
                    })
                    pos["dividend_credited_dates"] = credited | {d}
                    
        if i == len(dates) - 1:
            for sym, pos in list(positions.items()):
                raw_close = closes.loc[d, sym]
                exec_price = raw_close * (1.0 - SLIPPAGE)
                gross_proceeds = pos["shares"] * exec_price
                fee = gross_proceeds * SELL_STATUTORY_FEE
                net_proceeds = gross_proceeds - fee
                cash += net_proceeds
                total_cost = pos["shares"] * pos["entry_price"] * (1.0 + BUY_STATUTORY_FEE)
                trade_blotter.append({
                    "date": d.strftime("%Y-%m-%d"),
                    "symbol": sym,
                    "action": "SELL",
                    "shares": pos["shares"],
                    "exec_price": float(exec_price),
                    "commission": float(fee),
                    "net_pnl": float(net_proceeds - total_cost),
                    "reason": "BENCHMARK_FINAL_EXIT",
                    "entry_date": pos["entry_date"].strftime("%Y-%m-%d"),
                    "exit_date": d.strftime("%Y-%m-%d"),
                    "sessions_held": pos["sessions_held"],
                    "cash_after": float(cash),
                })
            positions.clear()
            val = 0.0
            tot = cash
        else:
            val = sum(pos["shares"] * closes.loc[d, sym] for sym, pos in positions.items())
            tot = cash + val
            
        daily_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "cash": float(cash),
            "positions_value": float(val),
            "total_equity": float(tot),
        })
        
    df_equity = pd.DataFrame(daily_records)
    df_equity["daily_return"] = df_equity["total_equity"].pct_change().fillna(
        (df_equity["total_equity"].iloc[0] - STARTING_CAPITAL) / STARTING_CAPITAL
    )
    metrics = compute_portfolio_metrics(df_equity["total_equity"], df_equity["daily_return"], trade_blotter)
    return df_equity, trade_blotter, metrics


def run_cash_benchmark(market):
    dates = market["all_trading_dates"]
    daily_rate = (1.0 + CASH_YIELD_ANNUAL) ** (1.0 / 252.0) - 1.0
    cash = STARTING_CAPITAL
    daily_records = []
    for d in dates:
        cash *= (1.0 + daily_rate)
        daily_records.append({
            "date": d.strftime("%Y-%m-%d"),
            "cash": float(cash),
            "positions_value": 0.0,
            "total_equity": float(cash),
        })
    df_equity = pd.DataFrame(daily_records)
    df_equity["daily_return"] = df_equity["total_equity"].pct_change().fillna(0.0)
    metrics = compute_portfolio_metrics(df_equity["total_equity"], df_equity["daily_return"], [], is_cash_benchmark=True)
    return df_equity, metrics


def main():
    print("=" * 80)
    print("QUANTARA AI: 5-MODEL COMPREHENSIVE WALK-FORWARD BACKTEST ENGINE")
    print(f"Starting Capital: INR {STARTING_CAPITAL:,.2f} | Max Concurrent Positions: {MAX_POSITIONS}")
    print("=" * 80)
    
    market = load_market_data()
    print(f"Loaded {len(market['all_trading_dates'])} trading sessions ({market['all_trading_dates'][0].date()} to {market['all_trading_dates'][-1].date()})")
    
    meta = market["meta_test"]
    X = market["X_test"]
    
    # 1. Logistic Regression
    print("\n[1/5] Simulating Logistic Regression...")
    lr_model = joblib.load(MODELS_DIR / "logistic_regression_baseline.joblib")
    lr_probs = lr_model.predict_proba(X)
    lr_preds = lr_model.predict(X)
    lr_signals = {}
    for idx, row in meta.iterrows():
        d = row["Date"]
        sym = row["Symbol"]
        if d not in lr_signals:
            lr_signals[d] = {}
        lr_signals[d][sym] = {
            "pred": int(lr_preds[idx]),
            "p_down": float(lr_probs[idx, 0]),
            "p_hold": float(lr_probs[idx, 1]),
            "p_up": float(lr_probs[idx, 2]),
        }
    df_lr, blotter_lr, metrics_lr = run_portfolio_simulation("Logistic Regression", lr_signals, market)
    
    # 2. Random Forest
    print("\n[2/5] Simulating Random Forest Ensemble...")
    rf_model = joblib.load(MODELS_DIR / "random_forest_baseline.joblib")
    rf_probs = rf_model.predict_proba(X)
    rf_preds = rf_model.predict(X)
    rf_signals = {}
    for idx, row in meta.iterrows():
        d = row["Date"]
        sym = row["Symbol"]
        if d not in rf_signals:
            rf_signals[d] = {}
        rf_signals[d][sym] = {
            "pred": int(rf_preds[idx]),
            "p_down": float(rf_probs[idx, 0]),
            "p_hold": float(rf_probs[idx, 1]),
            "p_up": float(rf_probs[idx, 2]),
        }
    df_rf, blotter_rf, metrics_rf = run_portfolio_simulation("Random Forest", rf_signals, market)
    
    # 3. LightGBM
    print("\n[3/5] Simulating LightGBM Classifier...")
    lgb_model = joblib.load(MODELS_DIR / "lightgbm_5d_classifier.joblib")
    lgb_probs = lgb_model.predict_proba(X)
    lgb_preds = lgb_model.predict(X)
    lgb_signals = {}
    for idx, row in meta.iterrows():
        d = row["Date"]
        sym = row["Symbol"]
        if d not in lgb_signals:
            lgb_signals[d] = {}
        lgb_signals[d][sym] = {
            "pred": int(lgb_preds[idx]),
            "p_down": float(lgb_probs[idx, 0]),
            "p_hold": float(lgb_probs[idx, 1]),
            "p_up": float(lgb_probs[idx, 2]),
        }
    df_lgb, blotter_lgb, metrics_lgb = run_portfolio_simulation("LightGBM", lgb_signals, market)
    
    # 4. LSTM
    print("\n[4/5] Simulating Deep LSTM Sequence Network...")
    lstm_signals = generate_dl_signals("lstm", market)
    df_lstm, blotter_lstm, metrics_lstm = run_portfolio_simulation("LSTM", lstm_signals, market)
    
    # 5. GRU
    print("\n[5/5] Simulating Deep GRU Sequence Network...")
    gru_signals = generate_dl_signals("gru", market)
    df_gru, blotter_gru, metrics_gru = run_portfolio_simulation("GRU", gru_signals, market)
    
    # 6. Buy and Hold Benchmark
    print("\n[Benchmark] Simulating Equal-Weighted Buy & Hold Benchmark...")
    df_bh, blotter_bh, metrics_bh = run_buy_and_hold_benchmark(market)
    
    # 7. Cash Benchmark
    print("\n[Benchmark] Simulating Cash Benchmark (6.5% Annual)...")
    df_cash, metrics_cash = run_cash_benchmark(market)
    
    # Combine Equity Curves
    df_equity_all = pd.DataFrame({
        "Date": df_lr["date"],
        "Logistic_Regression_Equity": df_lr["total_equity"].round(2),
        "Random_Forest_Equity": df_rf["total_equity"].round(2),
        "LightGBM_Equity": df_lgb["total_equity"].round(2),
        "LSTM_Equity": df_lstm["total_equity"].round(2),
        "GRU_Equity": df_gru["total_equity"].round(2),
        "Buy_and_Hold_Equity": df_bh["total_equity"].round(2),
        "Cash_Yield_Equity": df_cash["total_equity"].round(2),
    })
    df_equity_all.to_csv(MODELS_DIR / "equity_curve_comparison.csv", index=False)
    print(f"\nSaved updated equity curves with all 5 models to {MODELS_DIR / 'equity_curve_comparison.csv'}")
    
    # Save Trade Blotters
    pd.DataFrame(blotter_lr).to_csv(MODELS_DIR / "trade_blotter_logistic_regression.csv", index=False)
    pd.DataFrame(blotter_rf).to_csv(MODELS_DIR / "trade_blotter_random_forest.csv", index=False)
    pd.DataFrame(blotter_lgb).to_csv(MODELS_DIR / "trade_blotter_lightgbm.csv", index=False)
    pd.DataFrame(blotter_lstm).to_csv(MODELS_DIR / "trade_blotter_lstm.csv", index=False)
    pd.DataFrame(blotter_gru).to_csv(MODELS_DIR / "trade_blotter_gru.csv", index=False)
    pd.DataFrame(blotter_bh).to_csv(MODELS_DIR / "trade_blotter_buy_and_hold.csv", index=False)
    
    # Save Master Metrics JSON
    all_metrics = {
        "parameters": {
            "starting_capital": STARTING_CAPITAL,
            "max_positions": MAX_POSITIONS,
            "max_hold_sessions": MAX_HOLD_SESSIONS,
            "slippage_pct": SLIPPAGE,
            "buy_statutory_fee_pct": round(float(BUY_STATUTORY_FEE), 6),
            "sell_statutory_fee_pct": round(float(SELL_STATUTORY_FEE), 6),
            "round_trip_friction_pct": round(float(BUY_STATUTORY_FEE + SELL_STATUTORY_FEE + 2 * SLIPPAGE), 6),
            "fee_schedule_details": FEE_SCHEDULE,
            "cash_yield_annual_assumed": CASH_YIELD_ANNUAL,
            "start_date": str(market["all_trading_dates"][0].date()),
            "end_date": str(market["all_trading_dates"][-1].date()),
            "total_trading_sessions": len(market["all_trading_dates"]),
        },
        "logistic_regression": metrics_lr,
        "random_forest": metrics_rf,
        "lightgbm": metrics_lgb,
        "lstm": metrics_lstm,
        "gru": metrics_gru,
        "buy_and_hold_benchmark": metrics_bh,
        "cash_benchmark": metrics_cash,
    }
    
    with open(MODELS_DIR / "portfolio_backtest_metrics.json", "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"Saved master backtest metrics for all 5 models to {MODELS_DIR / 'portfolio_backtest_metrics.json'}")
    
    print("\n" + "=" * 95)
    print(f"{'Strategy / Model':<26} | {'Final Equity':<12} | {'Return %':<10} | {'Sharpe':<8} | {'WinRate %':<10} | {'MaxDD %':<8} | {'Trades':<6}")
    print("-" * 95)
    for name, m in [
        ("Logistic Regression", metrics_lr),
        ("Random Forest", metrics_rf),
        ("LightGBM", metrics_lgb),
        ("LSTM (60d Sequence)", metrics_lstm),
        ("GRU (60d Sequence)", metrics_gru),
        ("Buy & Hold Benchmark", metrics_bh),
        ("Cash Yield Benchmark", metrics_cash),
    ]:
        print(f"{name:<26} | Rs {m['final_equity']:<9,.2f} | {m['total_return_pct']:>+8.2f}% | {m['sharpe_ratio']:>6.2f} | {m['win_rate_pct']:>8.2f}% | {m['max_drawdown_pct']:>6.2f}% | {m['total_trades_completed']:>6}")
    print("=" * 95)


if __name__ == "__main__":
    main()

