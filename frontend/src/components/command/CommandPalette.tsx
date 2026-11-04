"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMarketStore } from "@/store/useMarketStore";
import { UNIVERSE } from "@/lib/api";
import { StockSymbol } from "@/lib/types";
import { Search, TrendingUp, Sun, Moon, ArrowRight, CornerDownLeft, Sparkles, X } from "lucide-react";
import { useTheme } from "next-themes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setSelectedSymbol, setSelectedModel } = useMarketStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = String(query || "").toLowerCase();
  const filteredTickers = UNIVERSE.filter(
    (u) =>
      String(u.symbol || "").toLowerCase().includes(q) ||
      String(u.name || "").toLowerCase().includes(q) ||
      String(u.sector || "").toLowerCase().includes(q)
  );

  const handleSelectTicker = (sym: StockSymbol) => {
    setSelectedSymbol(sym);
    router.push("/dashboard");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden text-text-primary">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickers, commands, jump to views... (Esc to close)"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none font-mono"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {/* Quick Actions */}
          <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-text-muted">Navigation &amp; System</div>
          <button
            onClick={() => {
              router.push("/dashboard");
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-elevated transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-primary">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>Jump to Analytics Dashboard</span>
            </div>
            <CornerDownLeft className="w-3 h-3 text-text-muted" />
          </button>

          <button
            onClick={() => {
              router.push("/");
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-elevated transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-primary">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Back to Overview &amp; Storytelling</span>
            </div>
            <CornerDownLeft className="w-3 h-3 text-text-muted" />
          </button>

          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-elevated transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-text-primary">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-warning" /> : <Moon className="w-3.5 h-3.5 text-accent" />}
              <span>Toggle Visual Theme ({theme === "dark" ? "Light" : "Dark"})</span>
            </div>
            <CornerDownLeft className="w-3 h-3 text-text-muted" />
          </button>

          {/* Model Selection */}
          <div className="px-2.5 pt-3 pb-1 text-[10px] uppercase font-bold text-text-muted">Model Engines</div>
          {[
            { id: "logistic_regression", name: "Logistic Regression Baseline (L2 Regularized)" },
            { id: "lightgbm", name: "LightGBM Gradient Boosted Trees (5D)" },
            { id: "random_forest", name: "Random Forest Classifier (Ensemble)" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedModel(m.id as any);
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-elevated transition-colors text-left text-text-secondary hover:text-text-primary"
            >
              <span>{m.name}</span>
              <span className="text-[10px] text-accent uppercase font-bold">Select</span>
            </button>
          ))}

          {/* Ticker Results */}
          <div className="px-2.5 pt-3 pb-1 text-[10px] uppercase font-bold text-text-muted">Indian Equities Universe</div>
          {filteredTickers.map((t) => (
            <button
              key={t.symbol}
              onClick={() => handleSelectTicker(t.symbol)}
              className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-elevated transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-accent">{t.symbol.replace(".NS", "")}</span>
                <span className="text-text-muted text-[11px] font-sans">{t.name}</span>
              </div>
              <span className="text-[10px] text-text-muted uppercase">{t.sector}</span>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-elevated/40 text-[10px] text-text-muted flex justify-between font-mono">
          <span>Navigate with arrows or click</span>
          <span>ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

