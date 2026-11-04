"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Cmd/Ctrl + K", desc: "Open Command Palette (search, navigation, actions)" },
    { key: "?", desc: "Toggle this Keyboard Shortcuts cheat-sheet" },
    { key: "1 / 2 / 3 / 4", desc: "Switch timeframe (1M, 3M, 6M, 1Y)" },
    { key: "T", desc: "Toggle visual theme (Dark / Light)" },
    { key: "Esc", desc: "Close any modal or dialog" },
    { key: "Arrow Up / Down", desc: "Cycle through watchlist equities" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-2xl overflow-hidden text-text-primary">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Terminal Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-none">
              <span className="text-text-secondary">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-elevated border border-border text-accent font-bold text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-elevated/40 text-[10px] text-text-muted text-right font-mono">
          Press ESC to dismiss
        </div>
      </div>
    </div>
  );
}

