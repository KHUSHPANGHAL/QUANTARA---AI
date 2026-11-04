"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMarketStore, DEFAULT_PRICES } from "@/store/useMarketStore";
import { UNIVERSE } from "@/lib/api";
import { StockSymbol } from "@/lib/types";
import { Star, Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";

function WatchlistRow({
  sym,
  isSelected,
  onSelect,
  onRemove,
}: {
  sym: StockSymbol;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const { liveTicks } = useMarketStore();
  const item = UNIVERSE.find((u) => u.symbol === sym);
  const tick = liveTicks[sym];
  const price = tick?.price || DEFAULT_PRICES[sym] || 1000;
  const chg = tick?.change_pct ?? 0.0;
  const isUp = chg >= 0;

  const prevPriceRef = useRef<number>(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setFlash("up");
      const t = setTimeout(() => setFlash(null), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(t);
    } else if (price < prevPriceRef.current) {
      setFlash("down");
      const t = setTimeout(() => setFlash(null), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(t);
    }
  }, [price]);

  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-all duration-300 ${
        isSelected
          ? "bg-accent/10 border-accent/40"
          : flash === "up"
          ? "bg-gain/20 border-gain/40 shadow-[0_0_10px_rgba(0,230,118,0.2)]"
          : flash === "down"
          ? "bg-loss/20 border-loss/40 shadow-[0_0_10px_rgba(255,51,75,0.2)]"
          : "bg-elevated/40 border-border/60 hover:bg-elevated/70"
      }`}
    >
      <div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-text-primary">
          <span>{sym.replace(".NS", "")}</span>
        </div>
        <div className="text-[10px] text-text-muted">{item?.sector}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right font-mono">
          <div
            className={`text-xs font-semibold tabular-nums transition-colors duration-200 ${
              flash === "up" ? "text-gain font-bold" : flash === "down" ? "text-loss font-bold" : "text-text-primary"
            }`}
          >
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-[10px] tabular-nums font-bold flex items-center justify-end ${isUp ? "text-gain" : "text-loss"}`}>
            {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {isUp ? "+" : ""}
            {chg.toFixed(2)}%
          </div>
        </div>

        <button
          onClick={onRemove}
          className="p-1 text-text-muted hover:text-loss transition-colors"
          title="Remove from watchlist"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function WatchlistPanel() {
  const { selectedSymbol, setSelectedSymbol } = useMarketStore();
  const [watchlist, setWatchlist] = useState<StockSymbol[]>([
    "TCS.NS",
    "RELIANCE.NS",
    "ICICIBANK.NS",
    "INFY.NS",
    "BHARTIARTL.NS",
  ]);

  const handleRemove = (sym: StockSymbol, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter((s) => s !== sym));
  };

  const handleAdd = (sym: StockSymbol) => {
    if (!watchlist.includes(sym)) {
      setWatchlist([...watchlist, sym]);
    }
  };

  const availableToAdd = UNIVERSE.filter((u) => !watchlist.includes(u.symbol));

  return (
    <div className="bg-surface border border-border rounded p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Active Watchlist ({watchlist.length})
          </h4>
        </div>

        {availableToAdd.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) handleAdd(e.target.value as StockSymbol);
            }}
            value=""
            className="bg-elevated border border-border text-[10px] px-1.5 py-0.5 rounded text-accent outline-none font-mono cursor-pointer"
          >
            <option value="" disabled>+ Add Ticker</option>
            {availableToAdd.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol.replace(".NS", "")}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {watchlist.map((sym) => (
          <WatchlistRow
            key={sym}
            sym={sym}
            isSelected={selectedSymbol === sym}
            onSelect={() => setSelectedSymbol(sym)}
            onRemove={(e) => handleRemove(sym, e)}
          />
        ))}
      </div>
    </div>
  );
}
