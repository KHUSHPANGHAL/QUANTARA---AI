"use client";

import React, { useEffect, useState } from "react";
import { LayoutGrid, ArrowUpRight, ArrowDownRight, Newspaper } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";
import { StockSymbol } from "@/lib/types";

interface SectorNode {
  name: string;
  performance_pct: number;
  market_cap_weight: number;
  top_stock: string;
}

interface NewsNode {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: string;
  score: number;
}

export function MarketOverviewSection() {
  const { setSelectedSymbol } = useMarketStore();
  const [sectors, setSectors] = useState<SectorNode[]>([
    { name: "Technology", performance_pct: 2.15, market_cap_weight: 0.35, top_stock: "TCS" },
    { name: "Banking & Finance", performance_pct: -0.45, market_cap_weight: 0.30, top_stock: "ICICIBANK" },
    { name: "Energy & Petrochem", performance_pct: 1.10, market_cap_weight: 0.18, top_stock: "RELIANCE" },
    { name: "Telecom", performance_pct: 0.85, market_cap_weight: 0.10, top_stock: "BHARTIARTL" },
    { name: "Consumer FMCG", performance_pct: -0.20, market_cap_weight: 0.07, top_stock: "ITC" },
  ]);

  const [news, setNews] = useState<NewsNode[]>([
    { id: "1", title: "RBI Policy Committee maintains repo rate at 6.50% amidst steady liquidity", source: "LiveMint", time: "18m ago", sentiment: "NEUTRAL", score: 0.15 },
    { id: "2", title: "IT Sector posts strong Q3 earnings acceleration led by cloud infrastructure deals", source: "Economic Times", time: "42m ago", sentiment: "BULLISH", score: 0.78 },
    { id: "3", title: "FII net buyers in Indian cash equities for 3rd consecutive session", source: "Bloomberg Quint", time: "1h ago", sentiment: "BULLISH", score: 0.64 },
    { id: "4", title: "Crude oil futures consolidate near $78/bbl on OPEC supply adjustments", source: "Reuters India", time: "2h ago", sentiment: "NEUTRAL", score: 0.05 },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
      {/* Sector Performance Treemap / Cards */}
      <div className="bg-surface border border-border rounded p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Sector Treemap &amp; Industry Breadth
            </h4>
          </div>
          <span className="text-[10px] text-text-muted font-mono">Weight-Adjusted Returns</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {sectors.map((s, idx) => {
            const isGain = s.performance_pct >= 0;
            return (
              <div
                key={idx}
                className={`p-3 rounded border transition-all ${
                  isGain
                    ? "bg-gain/10 border-gain/20 hover:border-gain/40"
                    : "bg-loss/10 border-loss/20 hover:border-loss/40"
                } ${idx === 0 ? "col-span-2" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-text-primary">{s.name}</span>
                  <span className={`text-xs font-mono font-bold ${isGain ? "text-gain" : "text-loss"}`}>
                    {isGain ? "+" : ""}
                    {s.performance_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-muted font-mono mt-3">
                  <span>Weight: {(s.market_cap_weight * 100).toFixed(0)}%</span>
                  <button
                    onClick={() => setSelectedSymbol(`${s.top_stock}.NS` as StockSymbol)}
                    className="text-accent hover:underline uppercase"
                  >
                    Top: {s.top_stock}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional News & Sentiment Feed */}
      <div className="bg-surface border border-border rounded p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Market Intelligence &amp; Sentiment Stream
            </h4>
          </div>
          <span className="text-[10px] text-text-muted font-mono">NLP Tagged</span>
        </div>

        <div className="space-y-2">
          {news.map((item) => {
            const isBull = item.sentiment === "BULLISH";
            const isBear = item.sentiment === "BEARISH";
            return (
              <div key={item.id} className="p-2.5 rounded bg-elevated/40 border border-border/60 hover:bg-elevated/70 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-text-muted">
                    {item.source} · {item.time}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                      isBull
                        ? "bg-gain/20 text-gain"
                        : isBear
                        ? "bg-loss/20 text-loss"
                        : "bg-elevated text-text-secondary"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>
                <p className="text-xs text-text-primary font-medium leading-snug">{item.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

