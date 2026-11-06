export type StockSymbol =
  | "BHARTIARTL.NS"
  | "HDFCBANK.NS"
  | "ICICIBANK.NS"
  | "INFY.NS"
  | "ITC.NS"
  | "RELIANCE.NS"
  | "SBIN.NS"
  | "TCS.NS";

export type ModelId = "logistic_regression" | "lightgbm" | "random_forest" | "lstm" | "gru";

export type SignalType = "BUY / LONG" | "SELL / HEDGE" | "WAIT / CHOP" | "CASH (Regime Guard)";

export interface StockQuote {
  symbol: StockSymbol;
  name: string;
  price: number;
  change1D: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  rsi14: number;
  volatility20d: number;
  sma20Dist: number;
  sma50Dist: number;
}

export interface PredictionResult {
  symbol: StockSymbol;
  model: ModelId;
  signal: SignalType;
  p_up: number;
  p_hold: number;
  p_down: number;
  conviction: number;
  latestDate: string;
}

export interface MarketTick {
  symbol: StockSymbol;
  price: number;
  change_pct: number;
  bid: number;
  ask: number;
  volume_delta: number;
  timestamp: string;
}

export interface MarketRegime {
  breadth_pct: number;
  stocks_above_sma20: number;
  total_stocks: number;
  status: "BULLISH_EXPANSION" | "NEUTRAL_CHOP" | "BEARISH_CONTRACTION";
  guidance: string;
  action: string;
}

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ShapAttribution {
  feature: string;
  importance: number;
  direction: "positive" | "negative";
}

export interface ConfidenceBandPoint {
  day: number;
  median: number;
  upper90: number;
  lower90: number;
  upper50: number;
  lower50: number;
}

export interface BlotterTrade {
  trade_id?: string;
  Date: string;
  Symbol: StockSymbol;
  Direction: "LONG" | "SHORT";
  Entry_Price: number;
  Exit_Price?: number;
  Return_Pct: number;
  PnL: number;
  Status?: "OPEN" | "CLOSED";
}

export interface WalkForwardEquityPoint {
  session: number;
  date: string;
  strategy_equity: number;
  benchmark_equity: number;
  cash_equity: number;
}

export interface BacktestLeaderboardEntry {
  model_id: ModelId;
  model_name: string;
  final_equity: number;
  total_return_pct: number;
  alpha_vs_bench_pct: number;
  sharpe_ratio: number;
  win_rate_pct: number;
  max_drawdown_pct: number;
  total_trades: number;
  profit_factor: number;
}

export interface WalkForwardBacktestData {
  model: ModelId;
  model_label: string;
  parameters: {
    starting_capital: number;
    max_positions: number;
    max_hold_sessions: number;
    round_trip_friction_pct: number;
    start_date: string;
    end_date: string;
    total_trading_sessions: number;
  };
  metrics: {
    initial_equity: number;
    final_equity: number;
    total_return_pct: number;
    cagr_pct: number;
    max_drawdown_pct: number;
    annualized_volatility_pct: number;
    sharpe_ratio: number;
    total_trades_completed: number;
    win_rate_pct: number;
    profit_factor: number;
    strategy_alpha_pct: number;
    benchmark_return_pct: number;
    cash_benchmark_return_pct: number;
    total_commissions_paid: number;
    total_dividends_received: number;
  };
  benchmark_metrics: {
    final_equity: number;
    total_return_pct: number;
    max_drawdown_pct: number;
    sharpe_ratio: number;
  };
  equity_curve: WalkForwardEquityPoint[];
  leaderboard: BacktestLeaderboardEntry[];
}

