"use client";

import React from "react";
import { ModelId } from "@/lib/types";
import { useMarketStore } from "@/store/useMarketStore";
import { Cpu, Check } from "lucide-react";

interface ModelStats {
  id: ModelId;
  name: string;
  tag: string;
  rmse: number;
  mae: number;
  dirAccuracy: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

export function ModelComparisonGrid() {
  const { selectedModel, setSelectedModel } = useMarketStore();

  const models: ModelStats[] = [
    {
      id: "logistic_regression",
      name: "Logistic Regression",
      tag: "L2 Standardized Baseline",
      rmse: 14.28,
      mae: 10.45,
      dirAccuracy: 58.4,
      winRate: 44.88,
      profitFactor: 0.81,
      maxDrawdown: 17.33,
    },
    {
      id: "lightgbm",
      name: "LightGBM 5D Classifier",
      tag: "Gradient Boosted Trees",
      rmse: 18.92,
      mae: 13.80,
      dirAccuracy: 54.2,
      winRate: 37.29,
      profitFactor: 0.44,
      maxDrawdown: 38.17,
    },
    {
      id: "random_forest",
      name: "Random Forest",
      tag: "100 Decision Trees Ensemble",
      rmse: 16.45,
      mae: 11.90,
      dirAccuracy: 56.1,
      winRate: 41.20,
      profitFactor: 0.62,
      maxDrawdown: 24.50,
    },
    {
      id: "lstm",
      name: "PyTorch LSTM",
      tag: "2-Layer Recurrent Sequence Net",
      rmse: 15.80,
      mae: 11.40,
      dirAccuracy: 49.9,
      winRate: 46.89,
      profitFactor: 0.72,
      maxDrawdown: 22.10,
    },
    {
      id: "gru",
      name: "PyTorch GRU",
      tag: "Gated Recurrent Unit (Fast)",
      rmse: 16.10,
      mae: 11.75,
      dirAccuracy: 48.7,
      winRate: 39.37,
      profitFactor: 0.68,
      maxDrawdown: 25.40,
    },
  ];

  return (
    <div className="bg-surface border border-border rounded p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Cross-Model Performance Benchmarks (ML &amp; DL)
          </h4>
        </div>
        <span className="text-[10px] text-text-muted font-mono">248 Out-of-Sample Sessions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {models.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`p-3 rounded border cursor-pointer transition-all ${
                isSelected
                  ? "bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                  : "bg-elevated/60 border-border hover:border-text-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-text-primary">{m.name}</span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-accent bg-accent/20 px-1.5 py-0.5 rounded font-bold uppercase">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mb-2.5">{m.tag}</p>

              <div className="grid grid-cols-3 gap-2 text-center font-mono border-t border-border/40 pt-2">
                <div>
                  <div className="text-[9px] text-text-muted uppercase">Dir Acc</div>
                  <div className="text-xs font-bold text-gain mt-0.5">{m.dirAccuracy.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-text-muted uppercase">RMSE</div>
                  <div className="text-xs font-bold text-text-primary mt-0.5">{m.rmse.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-text-muted uppercase">Max DD</div>
                  <div className="text-xs font-bold text-loss mt-0.5">-{m.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
