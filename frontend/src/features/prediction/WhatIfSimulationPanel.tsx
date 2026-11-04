"use client";

import React, { useState } from "react";
import { Sliders, RefreshCw, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StockSymbol, ModelId } from "@/lib/types";

interface Props {
  symbol: StockSymbol;
  model: ModelId;
  horizon: string;
  onHorizonChange: (h: string) => void;
  onRunSimulation: (overrides: { volatility: number; volume_shift: number; sentiment_score: number }) => void;
  signal: string;
  confidence: number;
}

export function WhatIfSimulationPanel({
  symbol,
  model,
  horizon,
  onHorizonChange,
  onRunSimulation,
  signal,
  confidence,
}: Props) {
  const [volatility, setVolatility] = useState<number>(1.0);
  const [volumeShift, setVolumeShift] = useState<number>(0.0);
  const [sentimentScore, setSentimentScore] = useState<number>(0.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

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

  return (
    <div className="bg-surface border border-border rounded p-3.5 space-y-4">
      {/* Header & Confidence Ring */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Prediction &amp; What-If Engine
            </h4>
          </div>
          <p className="text-[10px] text-text-muted mt-0.5">
            Adjust macro factors to observe real-time inference shifts
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

      {/* Horizon Selector */}
      <div>
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-muted mb-1.5 font-mono">
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

      {/* What-If Sliders */}
      <div className="space-y-3 pt-1">
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

      {/* Apply / Reset Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleApply}
          disabled={isSimulating}
          className="flex-1 py-1.5 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSimulating ? "Recalculating..." : "Simulate Scenario"}</span>
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-elevated hover:bg-elevated/70 border border-border text-text-muted hover:text-text-primary text-xs font-mono rounded transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

