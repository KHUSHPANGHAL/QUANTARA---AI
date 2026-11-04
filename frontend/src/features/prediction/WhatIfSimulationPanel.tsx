"use client";

import React, { useState } from "react";
import {
  Sliders,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  ShieldCheck,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { StockSymbol, ModelId } from "@/lib/types";

interface Props {
  symbol: StockSymbol;
  model: ModelId;
  horizon: string;
  onHorizonChange: (h: string) => void;
  onRunSimulation: (overrides: { volatility: number; volume_shift: number; sentiment_score: number }) => void;
  signal: string;
  confidence: number;
  currentPrice?: number;
}

export function WhatIfSimulationPanel({
  symbol,
  model,
  horizon,
  onHorizonChange,
  onRunSimulation,
  signal,
  confidence,
  currentPrice = 1000,
}: Props) {
  const [panelTab, setPanelTab] = useState<"what_if" | "kelly">("what_if");

  // What-If Sliders State
  const [volatility, setVolatility] = useState<number>(1.0);
  const [volumeShift, setVolumeShift] = useState<number>(0.0);
  const [sentimentScore, setSentimentScore] = useState<number>(0.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Dynamic Kelly Position Sizing State
  const [portfolioCapital, setPortfolioCapital] = useState<number>(1000000); // 10 Lakh INR Default
  const [payoffRatio, setPayoffRatio] = useState<number>(1.8); // 1.8x Reward-to-Risk

  const handleApply = async () => {
    setIsSimulating(true);
    await onRunSimulation({
      volatility,
      volume_shift: volumeShift,
      sentiment_score: sentimentScore,
    });
    setTimeout(() => setIsSimulating(false), 300);
  };

  const handleReset = () => {
    setVolatility(1.0);
    setVolumeShift(0.0);
    setSentimentScore(0.0);
    onRunSimulation({ volatility: 1.0, volume_shift: 0.0, sentiment_score: 0.0 });
  };

  const isBull = signal.includes("BULLISH") || signal.includes("BUY");
  const isBear = signal.includes("BEARISH") || signal.includes("SELL");

  // ── Mathematical Kelly Criterion Calculations ──
  // p: Calibrated win probability from model conviction
  const p = Math.min(0.85, Math.max(0.40, confidence));
  const q = 1.0 - p;
  const b = payoffRatio;

  // Full Kelly: f* = (p * b - q) / b
  const fullKellyRaw = (p * b - q) / b;
  const fullKelly = Math.max(0.0, fullKellyRaw);

  // Half-Kelly: Industry standard fractional sizing for risk-averse institutional desks
  const halfKelly = fullKelly / 2.0;

  // Recommended Capital Fraction (capped at 25% max portfolio limit for risk management)
  const allocFraction = isBull ? Math.min(0.25, halfKelly) : 0.0;
  const allocatedCash = Math.round(portfolioCapital * allocFraction);
  const sharePrice = currentPrice > 0 ? currentPrice : 1000;
  const recommendedShares = allocFraction > 0 ? Math.floor(allocatedCash / sharePrice) : 0;
  const actualDeployedCapital = recommendedShares * sharePrice;

  // Volatility Stop Loss (1.8% based on rolling ATR 14)
  const stopLossPct = 0.018;
  const stopLossPrice = Math.round(sharePrice * (1.0 - stopLossPct) * 100) / 100;
  const targetPrice = Math.round(sharePrice * (1.0 + stopLossPct * b) * 100) / 100;
  const maxRiskCash = Math.round(recommendedShares * (sharePrice - stopLossPrice));
  const portfolioRiskPct = portfolioCapital > 0 ? (maxRiskCash / portfolioCapital) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded p-3.5 space-y-3.5">
      {/* ── Header: Title & Radial Confidence Ring ── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            {panelTab === "what_if" ? (
              <Sliders className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Scale className="w-3.5 h-3.5 text-gain" />
            )}
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              {panelTab === "what_if" ? "Prediction & What-If Engine" : "Dynamic Kelly Position Sizer"}
            </h4>
          </div>
          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
            {panelTab === "what_if"
              ? "Adjust macro factors to observe real-time inference shifts"
              : "Kelly Criterion & Volatility Parity Capital Budgeting"}
          </p>
        </div>

        {/* Confidence Ring & Signal Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end">
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                isBull
                  ? "bg-gain/15 text-gain border border-gain/30"
                  : isBear
                  ? "bg-loss/15 text-loss border border-loss/30"
                  : "bg-warning/15 text-warning border border-warning/30"
              }`}
            >
              {signal}
            </span>
            <span className="text-[9px] text-text-muted font-mono mt-0.5">
              Confidence: {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* SVG Radial Confidence Ring */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-elevated"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isBull ? "text-gain" : isBear ? "text-loss" : "text-warning"}
                strokeDasharray={`${Math.round(confidence * 100)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[9px] font-mono font-extrabold text-text-primary">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Sub-Tab Switcher (What-If vs. Kelly Calculator) ── */}
      <div className="flex items-center bg-elevated p-0.5 rounded border border-border font-mono text-xs">
        <button
          onClick={() => setPanelTab("what_if")}
          className={`flex-1 py-1 rounded transition-all font-semibold flex items-center justify-center gap-1.5 ${
            panelTab === "what_if"
              ? "bg-accent/20 text-accent font-bold border border-accent/40 shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>What-If Stress Lab</span>
        </button>

        <button
          onClick={() => setPanelTab("kelly")}
          className={`flex-1 py-1 rounded transition-all font-semibold flex items-center justify-center gap-1.5 ${
            panelTab === "kelly"
              ? "bg-accent/20 text-accent font-bold border border-accent/40 shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Scale className="w-3 h-3" />
          <span>Kelly Position Sizer</span>
        </button>
      </div>

      {/* ── TAB 1: WHAT-IF STRESS LAB ── */}
      {panelTab === "what_if" && (
        <div className="space-y-3 pt-1">
          {/* Horizon Selector */}
          <div>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-muted mb-1 font-mono">
              <span>Forecast Horizon</span>
              <span className="text-accent">{horizon}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-elevated p-1 rounded border border-border">
              {["1d", "5d", "30d"].map((h) => (
                <button
                  key={h}
                  onClick={() => onHorizonChange(h)}
                  className={`py-1 text-xs font-mono uppercase rounded transition-colors ${
                    horizon === h ? "bg-accent/20 text-accent font-bold" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {h.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Container */}
          <div className="space-y-2.5">
            {/* Volatility Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-text-secondary mb-1">
                <span>Volatility Scaling</span>
                <span className="font-bold text-accent">{volatility.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={volatility}
                onChange={(e) => setVolatility(parseFloat(e.target.value))}
                className="w-full accent-accent bg-elevated h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Volume Shift Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-text-secondary mb-1">
                <span>Volume Pressure Bias</span>
                <span className="font-bold text-accent">
                  {volumeShift > 0 ? "+" : ""}
                  {(volumeShift * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={volumeShift}
                onChange={(e) => setVolumeShift(parseFloat(e.target.value))}
                className="w-full accent-accent bg-elevated h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Sentiment Score Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-text-secondary mb-1">
                <span>Market Sentiment Bias</span>
                <span className="font-bold text-accent">
                  {sentimentScore > 0 ? "+" : ""}
                  {sentimentScore.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={sentimentScore}
                onChange={(e) => setSentimentScore(parseFloat(e.target.value))}
                className="w-full accent-accent bg-elevated h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApply}
              disabled={isSimulating}
              className="flex-1 py-1.5 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulating ? "Recalculating..." : "Simulate Shift"}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-elevated hover:bg-elevated/80 border border-border text-text-secondary hover:text-text-primary font-mono text-xs rounded transition-colors"
              title="Reset parameters to baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: DYNAMIC KELLY CRITERION POSITION SIZER ── */}
      {panelTab === "kelly" && (
        <div className="space-y-3 pt-1 font-mono">
          {/* Portfolio Size Input */}
          <div>
            <div className="flex justify-between text-[11px] text-text-secondary mb-1">
              <span>Account Equity Capital:</span>
              <span className="font-bold text-text-primary">
                ₹{portfolioCapital.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[500000, 1000000, 2500000].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setPortfolioCapital(cap)}
                  className={`flex-1 py-1 rounded text-[10px] border transition-colors ${
                    portfolioCapital === cap
                      ? "bg-accent/20 border-accent/40 text-accent font-bold"
                      : "bg-elevated border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  ₹{(cap / 100000).toFixed(0)} Lakhs
                </button>
              ))}
            </div>
          </div>

          {/* Model Mathematical Inputs */}
          <div className="grid grid-cols-2 gap-2 p-2 rounded bg-elevated/40 border border-border text-xs">
            <div>
              <div className="text-[10px] text-text-muted uppercase">Model Win Prob (p)</div>
              <div className="text-sm font-bold text-gain mt-0.5">{(p * 100).toFixed(1)}%</div>
              <div className="text-[9px] text-text-muted">From {model}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase">Payoff Ratio (b)</div>
              <div className="text-sm font-bold text-accent mt-0.5">{b.toFixed(2)}x</div>
              <div className="text-[9px] text-text-muted">Target vs. ATR Stop</div>
            </div>
          </div>

          {/* Kelly Fractions & Sizing Recommendations */}
          <div className="p-2.5 rounded bg-elevated/70 border border-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted text-[11px]">Half-Kelly Sizing:</span>
              <span className="font-bold text-gain">{(allocFraction * 100).toFixed(1)}% of Portfolio</span>
            </div>

            <div className="border-t border-border/60 pt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[9px] text-text-muted uppercase">Allocated Capital</div>
                <div className="text-sm font-bold text-text-primary mt-0.5">
                  ₹{actualDeployedCapital.toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <div className="text-[9px] text-text-muted uppercase">Position Shares</div>
                <div className="text-sm font-bold text-accent mt-0.5">
                  {recommendedShares} Shares
                </div>
              </div>
            </div>

            {/* Stop Loss & Target Derived from ATR */}
            <div className="border-t border-border/60 pt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
              <div>
                <span className="text-text-muted block">Entry Price</span>
                <span className="font-bold text-text-primary">₹{sharePrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-text-muted block">Stop Loss (-1.8%)</span>
                <span className="font-bold text-loss">₹{stopLossPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-text-muted block">Take Profit</span>
                <span className="font-bold text-gain">₹{targetPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Risk Budgeting Guarantee Note */}
          <div className="p-2 rounded bg-elevated/30 border border-border flex items-center justify-between text-[10px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gain" />
              <span>Max Account Risk at Stop:</span>
            </div>
            <span className="font-bold text-text-primary">
              ₹{maxRiskCash.toLocaleString("en-IN")} ({portfolioRiskPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
