"use client";

import React, { useState } from "react";
import { BlotterTrade } from "@/lib/types";

interface Props {
  trades: BlotterTrade[];
}

export function OrderBlotterTable({ trades = [] }: Props) {
  const [filterText, setFilterText] = useState("");
  const [dirFilter, setDirFilter] = useState<string>("ALL");

  const safeTrades = Array.isArray(trades) ? trades : [];

  const filtered = safeTrades.filter((t) => {
    if (!t) return false;
    const sym = String(t.Symbol || (t as any).symbol || "").toLowerCase();
    const query = String(filterText || "").toLowerCase();
    const matchSym = sym.includes(query);
    const direction = t.Direction || ((t as any).action === "BUY" ? "LONG" : "SHORT") || "LONG";
    const matchDir = dirFilter === "ALL" || direction === dirFilter;
    return matchSym && matchDir;
  });

  return (
    <div className="bg-surface border border-border rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Execution Blotter &amp; Portfolio Log
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Institutional cash model executions ({safeTrades.length} historical trades logged)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter symbol…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-elevated border border-border text-xs px-2.5 py-1 rounded text-text-primary placeholder:text-text-muted outline-none focus:border-accent font-mono w-32"
          />
          <select
            value={dirFilter}
            onChange={(e) => setDirFilter(e.target.value)}
            className="bg-elevated border border-border text-xs px-2 py-1 rounded text-text-primary outline-none focus:border-accent font-mono"
          >
            <option value="ALL">All Directions</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[280px]">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-elevated/60 text-text-muted text-[10px] uppercase font-mono border-b border-border sticky top-0">
            <tr>
              <th className="px-3.5 py-2">Date</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2 text-right">Entry (₹)</th>
              <th className="px-3 py-2 text-right">Exit (₹)</th>
              <th className="px-3 py-2 text-right">Return %</th>
              <th className="px-3 py-2 text-right">Realized PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-mono text-[11px]">
            {filtered.map((t, idx) => {
              const sym = String(t.Symbol || (t as any).symbol || "").replace(".NS", "");
              const date = t.Date || (t as any).date || "—";
              const direction = t.Direction || ((t as any).action === "BUY" ? "LONG" : "SHORT") || "LONG";
              const entryPrice = t.Entry_Price ?? (t as any).exec_price ?? 0;
              const exitPrice = t.Exit_Price;
              const pnl = t.PnL ?? (t as any).net_pnl ?? 0;
              const returnPct = t.Return_Pct ?? 0;
              const isGain = pnl >= 0;

              return (
                <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                  <td className="px-3.5 py-2 text-text-muted">{date}</td>
                  <td className="px-3 py-2 font-bold text-text-primary">{sym}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        direction === "LONG"
                          ? "bg-gain/15 text-gain"
                          : "bg-loss/15 text-loss"
                      }`}
                    >
                      {direction}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-primary">
                    ₹{entryPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-primary">
                    {exitPrice ? `₹${exitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-semibold ${isGain ? "text-gain" : "text-loss"}`}>
                    {isGain ? "+" : ""}{returnPct.toFixed(2)}%
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${isGain ? "text-gain" : "text-loss"}`}>
                    {isGain ? "+" : ""}₹{Math.round(pnl).toLocaleString("en-IN")}
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
