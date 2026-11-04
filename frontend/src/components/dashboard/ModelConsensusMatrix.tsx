"use client";

import React from "react";
import { UNIVERSE } from "@/lib/api";
import { StockSymbol } from "@/lib/types";
import { useMarketStore } from "@/store/useMarketStore";

interface PredictionRow {
  Symbol: StockSymbol;
  Close: number;
  Change1D: number;
  signal: string;
  p_up: number;
  p_hold: number;
  p_down: number;
  conviction: number;
  RSI14: number;
  Vol20d: number;
  SMA20Dist: number;
}

interface Props {
  predictions: PredictionRow[];
}

export function ModelConsensusMatrix({ predictions }: Props) {
  const { selectedSymbol, setSelectedSymbol } = useMarketStore();

  return (
    <div className="bg-surface border border-border rounded overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Forward 5-Day Classification Matrix
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Real-time inference across 8 liquid Indian equities
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-elevated/60 text-text-muted text-[10px] uppercase font-mono border-b border-border">
            <tr>
              <th className="px-3.5 py-2">Symbol</th>
              <th className="px-3 py-2 text-right">LTP</th>
              <th className="px-3 py-2 text-right">1D Chg</th>
              <th className="px-3 py-2">Signal</th>
              <th className="px-3 py-2 text-right">P(UP)</th>
              <th className="px-3 py-2 text-right">P(HOLD)</th>
              <th className="px-3 py-2 text-right">P(DOWN)</th>
              <th className="px-3 py-2 text-right">Conviction</th>
              <th className="px-3 py-2 text-right">RSI 14</th>
              <th className="px-3 py-2 text-right">SMA20 Dist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-mono text-[11px]">
            {predictions.map((p) => {
              const isSelected = selectedSymbol === p.Symbol;
              const isUp = p.Change1D >= 0;
              const isBuy = p.signal.includes("BUY");
              const isSell = p.signal.includes("SELL");

              return (
                <tr
                  key={p.Symbol}
                  onClick={() => setSelectedSymbol(p.Symbol)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent/10 hover:bg-accent/15"
                      : "hover:bg-elevated/40"
                  }`}
                >
                  <td className="px-3.5 py-2.5 font-bold text-text-primary flex items-center gap-1.5">
                    <span className="text-accent text-[9px]">●</span>
                    {p.Symbol.replace(".NS", "")}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">
                    ₹{p.Close.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums font-semibold ${
                      isUp ? "text-gain" : "text-loss"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {p.Change1D.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBuy
                          ? "bg-gain/15 text-gain border border-gain/30"
                          : isSell
                          ? "bg-loss/15 text-loss border border-loss/30"
                          : "bg-elevated text-text-secondary border border-border"
                      }`}
                    >
                      {p.signal.split("/")[0].trim()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gain">
                    {(p.p_up * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-warning">
                    {(p.p_hold * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-loss">
                    {(p.p_down * 100).toFixed(1)}%
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums font-bold ${
                      p.conviction >= 0 ? "text-gain" : "text-loss"
                    }`}
                  >
                    {p.conviction >= 0 ? "+" : ""}
                    {p.conviction.toFixed(3)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                    {p.RSI14.toFixed(1)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums ${
                      p.SMA20Dist >= 0 ? "text-gain" : "text-loss"
                    }`}
                  >
                    {p.SMA20Dist >= 0 ? "+" : ""}
                    {p.SMA20Dist.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

