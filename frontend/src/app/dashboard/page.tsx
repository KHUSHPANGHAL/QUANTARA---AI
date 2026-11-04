"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useMarketStore, DEFAULT_PRICES } from "@/store/useMarketStore";
import { LiveTickerRibbon } from "@/components/dashboard/LiveTickerRibbon";
import {
  fetchLivePredictions,
  fetchStockHistory,
  generateConfidenceBands,
  getShapAttributions,
  fetchTradeBlotter,
  UNIVERSE,
} from "@/lib/api";
import { ModelId, CandleBar, BlotterTrade } from "@/lib/types";

import dynamic from "next/dynamic";

// Components with dynamic client loading
const TradingViewCandleChart = dynamic(
  () => import("@/components/charts/TradingViewCandleChart").then((m) => m.TradingViewCandleChart),
  { ssr: false, loading: () => <div className="h-[380px] flex items-center justify-center font-mono text-xs text-text-muted">Loading Candlestick Engine...</div> }
);
const ModelForecastTrajectoryChart = dynamic(
  () => import("@/components/charts/ModelForecastTrajectoryChart").then((m) => m.ModelForecastTrajectoryChart),
  { ssr: false, loading: () => <div className="h-[380px] flex items-center justify-center font-mono text-xs text-text-muted">Loading Forecast Trajectory...</div> }
);
const D3ConfidenceBands = dynamic(
  () => import("@/components/charts/D3ConfidenceBands").then((m) => m.D3ConfidenceBands),
  { ssr: false }
);
const D3ShapWaterfall = dynamic(
  () => import("@/components/charts/D3ShapWaterfall").then((m) => m.D3ShapWaterfall),
  { ssr: false }
);
const D3ReturnHeatmap = dynamic(
  () => import("@/components/charts/D3ReturnHeatmap").then((m) => m.D3ReturnHeatmap),
  { ssr: false }
);
const MultiTickerCompare = dynamic(
  () => import("@/features/compare/MultiTickerCompare").then((m) => m.MultiTickerCompare),
  { ssr: false }
);
import { WhatIfSimulationPanel } from "@/features/prediction/WhatIfSimulationPanel";
import { ModelComparisonGrid } from "@/features/models/ModelComparisonGrid";
import { BacktestSection } from "@/features/backtest/BacktestSection";
import { WatchlistPanel } from "@/features/watchlist/WatchlistPanel";
import { MarketOverviewSection } from "@/features/market/MarketOverviewSection";
import { ModelConsensusMatrix } from "@/components/dashboard/ModelConsensusMatrix";
import { OrderBlotterTable } from "@/components/dashboard/OrderBlotterTable";
import { CommandPalette } from "@/components/command/CommandPalette";
import { ShortcutsModal } from "@/components/ui/ShortcutsModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Icons
import {
  Search,
  ArrowLeft,
  Command,
  Download,
  Share2,
  HelpCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Sliders,
  Layers,
  LineChart,
  BarChart2,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Check,
} from "lucide-react";

export default function CoreDashboardPage() {
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedModel,
    setSelectedModel,
    liveTicks,
    connectionStatus,
    initTickStream,
  } = useMarketStore();

  // Active Real-Time WebSocket & Ticker Feed on Dashboard
  useEffect(() => {
    const cleanup = initTickStream();
    return cleanup;
  }, [initTickStream]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const [candles, setCandles] = useState<CandleBar[]>([]);
  const [sma20, setSma20] = useState<[number, number][]>([]);
  const [sma50, setSma50] = useState<[number, number][]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [trades, setTrades] = useState<BlotterTrade[]>([]);

  const [timeframe, setTimeframe] = useState("6mo");
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [chartViewMode, setChartViewMode] = useState<"candlestick" | "forecast">("candlestick");
  const [horizon, setHorizon] = useState("5d");
  const [indicators, setIndicators] = useState({ sma: true, ema: false, bb: true, rsi: true, macd: true });
  const [currentTime, setCurrentTime] = useState("");

  const [simulatedSignal, setSimulatedSignal] = useState("BULLISH");
  const [simulatedConfidence, setSimulatedConfidence] = useState(0.78);
  const [simulatedConviction, setSimulatedConviction] = useState(0.44);

  const curTick = liveTicks[selectedSymbol];
  const curPrice = curTick?.price || candles[candles.length - 1]?.close || DEFAULT_PRICES[selectedSymbol] || 1000;
  const prevPriceRef = useRef<number>(curPrice);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);

  // Dynamic visual tick flash on live price updates
  useEffect(() => {
    if (curPrice > prevPriceRef.current) {
      setPriceFlash("up");
      const t = setTimeout(() => setPriceFlash(null), 600);
      prevPriceRef.current = curPrice;
      return () => clearTimeout(t);
    } else if (curPrice < prevPriceRef.current) {
      setPriceFlash("down");
      const t = setTimeout(() => setPriceFlash(null), 600);
      prevPriceRef.current = curPrice;
      return () => clearTimeout(t);
    }
  }, [curPrice]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "?" && !commandPaletteOpen) {
        setShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen]);

  // Load predictions and blotter data
  useEffect(() => {
    async function loadData() {
      const predData = await fetchLivePredictions(selectedModel);
      setPredictions(predData.predictions || []);
      const blotterData = await fetchTradeBlotter();
      setTrades(blotterData);
    }
    loadData();
  }, [selectedModel]);

  // Load historical stock candles
  useEffect(() => {
    async function loadHistory() {
      const hist = await fetchStockHistory(selectedSymbol, timeframe);
      setCandles(hist.candles);
      setSma20(hist.sma20);
      setSma50(hist.sma50);
    }
    loadHistory();
  }, [selectedSymbol, timeframe]);

  // Real-time IST clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const curPred = predictions.find((p) => (p.Symbol || p.symbol) === selectedSymbol) || { conviction: 0.35, signal: "BUY / LONG" };

  const confidencePoints = generateConfidenceBands(curPrice, simulatedConviction);
  const shapFeatures = getShapAttributions();

  // Handle What-If simulation re-computation
  const handleRunSimulation = (overrides: { volatility: number; volume_shift: number; sentiment_score: number }) => {
    const bias = overrides.sentiment_score * 0.3 + overrides.volume_shift * 0.2;
    const newConv = Math.min(0.9, Math.max(-0.9, (curPred.conviction || 0.3) + bias));
    setSimulatedConviction(newConv);
    if (newConv > 0.15) {
      setSimulatedSignal("BULLISH");
      setSimulatedConfidence(0.65 + newConv * 0.25);
    } else if (newConv < -0.15) {
      setSimulatedSignal("BEARISH");
      setSimulatedConfidence(0.62 + Math.abs(newConv) * 0.25);
    } else {
      setSimulatedSignal("NEUTRAL");
      setSimulatedConfidence(0.52);
    }
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = "Time,Open,High,Low,Close,Volume\n";
    const rows = candles.map((c) => `${c.time},${c.open},${c.high},${c.low},${c.close},${c.volume || 0}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSymbol}_historical_${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* ── Command Palette & Shortcuts Modal ── */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />

      {/* ── Collapsible Left Sidebar ── */}
      <aside
        className={`border-r border-border bg-surface transition-all duration-300 flex flex-col justify-between shrink-0 z-40 ${
          sidebarCollapsed ? "w-14" : "w-64"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-3">
            {!sidebarCollapsed ? (
              <Link href="/" className="flex items-baseline gap-1.5 font-mono">
                <span className="font-extrabold text-sm text-accent tracking-tight">QUANTARA</span>
                <span className="text-[10px] text-text-muted uppercase">// CORE</span>
              </Link>
            ) : (
              <span className="font-mono font-bold text-accent mx-auto">Q</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-elevated"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <div className="p-2 space-y-4 font-mono text-xs overflow-y-auto max-h-[calc(100vh-140px)]">
            {!sidebarCollapsed && <WatchlistPanel />}

            {/* Quick Universe Selector */}
            <div>
              {!sidebarCollapsed && (
                <div className="text-[10px] uppercase font-bold text-text-muted px-2 mb-1.5">
                  Universe Equities
                </div>
              )}
              <div className="space-y-0.5">
                {UNIVERSE.map((u) => {
                  const isSel = selectedSymbol === u.symbol;
                  return (
                    <button
                      key={u.symbol}
                      onClick={() => setSelectedSymbol(u.symbol)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-all text-left ${
                        isSel
                          ? "bg-accent/15 text-accent font-bold border border-accent/30"
                          : "text-text-secondary hover:bg-elevated hover:text-text-primary"
                      }`}
                    >
                      <span className="truncate">{u.symbol.replace(".NS", "")}</span>
                      {!sidebarCollapsed && (
                        <span className="text-[10px] text-text-muted font-normal">{u.sector}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-elevated/30 flex items-center justify-between text-xs font-mono text-text-muted">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />
              <span>{connectionStatus}</span>
            </div>
          )}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 rounded hover:bg-elevated text-text-muted hover:text-text-primary"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Direct Link back to Landing */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-elevated/70 hover:bg-elevated border border-border text-xs text-text-secondary hover:text-text-primary transition-all font-mono"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Landing</span>
            </Link>

            {/* Quick Command Palette trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-elevated border border-border text-xs text-text-muted hover:text-text-primary hover:border-text-secondary transition-all font-mono"
            >
              <Search className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Search tickers, models, actions...</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-background border border-border text-[10px]">
                Cmd+K
              </kbd>
            </button>

            {/* Current Active Symbol & Live Price Pill */}
            <div
              className={`flex items-center gap-2 border-l border-border pl-3 font-mono px-2 py-0.5 rounded transition-all duration-300 ${
                priceFlash === "up"
                  ? "bg-gain/20 text-gain shadow-[0_0_12px_rgba(0,230,118,0.25)]"
                  : priceFlash === "down"
                  ? "bg-loss/20 text-loss shadow-[0_0_12px_rgba(255,51,75,0.25)]"
                  : ""
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gain animate-ping" />
              <span className="font-bold text-sm text-text-primary">{selectedSymbol.replace(".NS", "")}</span>
              <span
                className={`text-sm font-semibold tabular-nums transition-colors duration-200 ${
                  priceFlash === "up" ? "text-gain font-bold" : priceFlash === "down" ? "text-loss font-bold" : "text-text-primary"
                }`}
              >
                ₹{curPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${(curTick?.change_pct || 0) >= 0 ? "text-gain" : "text-loss"}`}
              >
                {(curTick?.change_pct || 0) >= 0 ? "+" : ""}
                {(curTick?.change_pct || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Cpu className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                className="bg-elevated border border-border text-xs px-2 py-1 rounded text-text-primary outline-none focus:border-accent font-mono cursor-pointer"
              >
                <option value="logistic_regression">Logistic Regression</option>
                <option value="lightgbm">LightGBM (5D)</option>
                <option value="random_forest">Random Forest</option>
              </select>
            </div>

            {/* Export Actions */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-elevated border border-border text-xs text-text-secondary hover:text-text-primary transition-colors font-mono"
              title="Download OHLCV CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* IST Clock */}
            <span className="hidden md:inline text-xs font-mono tabular-nums text-text-muted">
              {currentTime}
            </span>

            {/* Theme Switcher */}
            <ThemeToggle />
          </div>
        </header>

        {/* Live Real-Time Ticker Ribbon Stream */}
        <div className="shrink-0">
          <LiveTickerRibbon />
        </div>

        {/* Scrollable Dashboard Panels Container */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Main Chart + Controls Panel */}
          <div className="bg-surface border border-border rounded p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                  {chartViewMode === "candlestick" ? "TradingView Technical Studio" : "Model Prediction Trajectory"} · {selectedSymbol.replace(".NS", "")}
                </h3>
              </div>

              {/* In-Place View Switcher (Clean, Zero Clutter) */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-elevated p-0.5 rounded border border-border font-mono text-xs">
                  <button
                    onClick={() => setChartViewMode("candlestick")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all font-semibold ${
                      chartViewMode === "candlestick"
                        ? "bg-accent/20 text-accent font-bold border border-accent/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Real-Time Candlesticks</span>
                  </button>

                  <button
                    onClick={() => setChartViewMode("forecast")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all font-semibold ${
                      chartViewMode === "forecast"
                        ? "bg-accent/20 text-accent font-bold border border-accent/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Forecast Trajectory</span>
                  </button>
                </div>

                {/* Sub-controls depending on view mode */}
                {chartViewMode === "candlestick" ? (
                  <div className="flex items-center gap-2 flex-wrap font-mono">
                    {/* Timeframe Bar */}
                    <div className="flex items-center bg-elevated p-0.5 rounded border border-border">
                      {["1mo", "3mo", "6mo", "1y"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTimeframe(t)}
                          className={`px-2 py-0.5 rounded text-[11px] uppercase transition-colors ${
                            timeframe === t ? "bg-accent/20 text-accent font-bold" : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          {t.replace("mo", "M")}
                        </button>
                      ))}
                    </div>

                    {/* Overlays */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        onClick={() => setIndicators((prev) => ({ ...prev, sma: !prev.sma }))}
                        className={`px-2 py-0.5 rounded border ${
                          indicators.sma ? "bg-accent/20 border-accent text-accent font-bold" : "bg-elevated border-border text-text-muted"
                        }`}
                      >
                        SMA 20/50
                      </button>
                      <button
                        onClick={() => setIndicators((prev) => ({ ...prev, bb: !prev.bb }))}
                        className={`px-2 py-0.5 rounded border ${
                          indicators.bb ? "bg-warning/20 border-warning text-warning font-bold" : "bg-elevated border-border text-text-muted"
                        }`}
                      >
                        Bollinger
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Forecast Horizon Selector */
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Horizon:</span>
                    <div className="flex items-center bg-elevated p-0.5 rounded border border-border">
                      {["1d", "5d", "30d"].map((h) => (
                        <button
                          key={h}
                          onClick={() => setHorizon(h)}
                          className={`px-2 py-0.5 rounded text-[11px] uppercase transition-colors font-bold ${
                            horizon === h ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          {h.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* In-Place Chart Swap (Same 380px height - No Layout Shift) */}
            {chartViewMode === "candlestick" ? (
              <TradingViewCandleChart
                candles={candles}
                sma20={indicators.sma ? sma20 : undefined}
                sma50={indicators.sma ? sma50 : undefined}
                height={380}
              />
            ) : (
              <ModelForecastTrajectoryChart
                symbol={selectedSymbol}
                model={selectedModel}
                horizon={horizon}
                currentPrice={curPrice}
                candles={candles}
                height={380}
              />
            )}
          </div>

          {/* Quantitative Inference: What-If Simulator + Confidence Bands */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Live Interactive What-If Simulation Panel & Kelly Sizer */}
            <WhatIfSimulationPanel
              symbol={selectedSymbol}
              model={selectedModel}
              horizon={horizon}
              onHorizonChange={setHorizon}
              onRunSimulation={handleRunSimulation}
              signal={simulatedSignal}
              confidence={simulatedConfidence}
              currentPrice={curPrice}
            />

            {/* D3 5-Day Prediction Fan Chart */}
            <div className="bg-surface border border-border rounded p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <LineChart className="w-3.5 h-3.5 text-accent" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Dynamic Prediction Envelope (T+{horizon})
                  </h4>
                </div>
                <p className="text-[10px] text-text-muted mb-2">
                  Median forward price drift with 50% (inner) &amp; 90% (outer) confidence bands
                </p>
              </div>
              <D3ConfidenceBands points={confidencePoints} height={240} />
            </div>
          </div>

          {/* Walk-Forward Backtest & Strategy Capital Simulation */}
          <BacktestSection model={selectedModel} />

          {/* Model Comparison & SHAP Waterfall Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <ModelComparisonGrid />
            <div className="bg-surface border border-border rounded p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-border pb-2">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Feature Importance Attribution (SHAP)
                </h4>
              </div>
              <D3ShapWaterfall attributions={shapFeatures} height={220} />
            </div>
          </div>

          {/* Multi-Ticker Normalized Comparison (% Return) */}
          <MultiTickerCompare />

          {/* Market Overview (Sector Treemap & Sentiment News Stream) */}
          <MarketOverviewSection />

          {/* Model Consensus Agreement Matrix Across Stocks */}
          <ModelConsensusMatrix predictions={predictions} />

          {/* Real-Time Order Execution Blotter */}
          <OrderBlotterTable trades={trades} />
        </div>
      </div>
    </div>
  );
}

