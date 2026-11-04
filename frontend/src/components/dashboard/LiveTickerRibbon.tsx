"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMarketStore, DEFAULT_PRICES } from "@/store/useMarketStore";
import { UNIVERSE } from "@/lib/api";
import { StockSymbol } from "@/lib/types";

function TickerBadge({
  sym,
  name,
  isSelected,
  onSelect,
}: {
  sym: StockSymbol;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { liveTicks } = useMarketStore();
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
    <button
      onClick={onSelect}
      title={`Analyze ${sym} in Terminal`}
      className={`flex items-center gap-2.5 px-2.5 py-1 rounded transition-all duration-300 whitespace-nowrap text-left cursor-pointer group ${
        isSelected
          ? "bg-elevated border border-accent/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
          : flash === "up"
          ? "bg-gain/20 border border-gain/40 shadow-[0_0_10px_rgba(0,230,118,0.2)]"
          : flash === "down"
          ? "bg-loss/20 border border-loss/40 shadow-[0_0_10px_rgba(255,51,75,0.2)]"
          : "hover:bg-elevated/80 border border-transparent hover:border-border"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-bold font-mono text-text-primary group-hover:text-accent tracking-tight transition-colors">
          {sym.replace(".NS", "")}
        </span>
        <span className="text-[9px] text-text-muted font-sans -mt-0.5">{name.split(" ")[0]}</span>
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`text-[12px] font-mono tabular-nums font-semibold transition-colors duration-200 ${
            flash === "up" ? "text-gain font-bold" : flash === "down" ? "text-loss font-bold" : "text-text-primary"
          }`}
        >
          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
        <span
          className={`text-[10px] font-mono tabular-nums font-semibold ${
            isUp ? "text-gain" : "text-loss"
          }`}
        >
          {isUp ? "+" : ""}
          {chg.toFixed(2)}%
        </span>
      </div>
    </button>
  );
}

export function LiveTickerRibbon() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedSymbol, setSelectedSymbol, initTickStream } = useMarketStore();

  useEffect(() => {
    const cleanup = initTickStream();
    return cleanup;
  }, [initTickStream]);

  const handleSelectTicker = (sym: StockSymbol) => {
    setSelectedSymbol(sym);
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full bg-surface border-b border-border overflow-hidden select-none py-1.5 px-3">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {UNIVERSE.map((item) => (
          <TickerBadge
            key={item.symbol}
            sym={item.symbol}
            name={item.name}
            isSelected={selectedSymbol === item.symbol}
            onSelect={() => handleSelectTicker(item.symbol)}
          />
        ))}
      </div>
    </div>
  );
}
