"use client";

import React from "react";
import { MarketRegime } from "@/lib/types";
import { ShieldAlert, TrendingUp, Shuffle } from "lucide-react";

interface Props {
  regime: MarketRegime;
}

export function MarketRegimeWidget({ regime }: Props) {
  const isBull = regime.status === "BULLISH_EXPANSION";
  const isBear = regime.status === "BEARISH_CONTRACTION";

  return (
    <div className="bg-surface border border-border rounded p-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            Market Regime State
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase font-mono ${
              isBull
                ? "bg-gain/15 text-gain border border-gain/30"
                : isBear
                ? "bg-loss/15 text-loss border border-loss/30"
                : "bg-warning/15 text-warning border border-warning/30"
            }`}
          >
            {regime.status.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-mono tabular-nums font-extrabold text-text-primary">
            {regime.breadth_pct.toFixed(1)}%
          </span>
          <span className="text-xs text-text-muted font-sans">
            Breadth ({regime.stocks_above_sma20}/{regime.total_stocks} above SMA20)
          </span>
        </div>

        <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBull ? "bg-gain" : isBear ? "bg-loss" : "bg-warning"
            }`}
            style={{ width: `${regime.breadth_pct}%` }}
          />
        </div>
      </div>

      <div className="p-2.5 rounded bg-elevated/70 border border-border text-[11px] flex items-start gap-2.5 text-text-secondary">
        {isBull ? (
          <TrendingUp className="w-4 h-4 text-gain shrink-0 mt-0.5" />
        ) : isBear ? (
          <ShieldAlert className="w-4 h-4 text-loss shrink-0 mt-0.5" />
        ) : (
          <Shuffle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        )}
        <p className="leading-relaxed">{regime.guidance}</p>
      </div>
    </div>
  );
}

