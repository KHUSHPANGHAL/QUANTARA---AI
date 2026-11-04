"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TrendingUp, ShieldCheck, Award, AlertTriangle } from "lucide-react";
import { ModelId } from "@/lib/types";

interface Props {
  model: ModelId;
}

export function BacktestSection({ model }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [metrics, setMetrics] = useState({
    totalReturn: 28.45,
    benchmarkReturn: 14.20,
    sharpeRatio: 1.48,
    winRate: 54.8,
    maxDrawdown: 12.35,
    totalTrades: 142,
  });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentWidth = svgRef.current.parentElement?.clientWidth || 600;
    const height = 240;
    const margin = { top: 15, right: 30, bottom: 25, left: 60 };
    const w = parentWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", parentWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const pointsCount = 60;
    const x = d3.scaleLinear().domain([0, pointsCount]).range([0, w]);
    const y = d3.scaleLinear().domain([95000, 135000]).range([h, 0]);

    // Generate strategy curve vs benchmark curve
    const stratPts: [number, number][] = [];
    const benchPts: [number, number][] = [];
    let stratCap = 100000;
    let benchCap = 100000;

    for (let i = 0; i <= pointsCount; i++) {
      stratCap *= 1.0 + (Math.sin(i * 0.15) * 0.004 + 0.0035);
      benchCap *= 1.0 + (Math.sin(i * 0.12) * 0.003 + 0.0018);
      stratPts.push([i, stratCap]);
      benchPts.push([i, benchCap]);
    }

    const line = d3
      .line<[number, number]>()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Benchmark line
    g.append("path")
      .datum(benchPts)
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("d", line);

    // Strategy line
    g.append("path")
      .datum(stratPts)
      .attr("fill", "none")
      .attr("stroke", "#00e676")
      .attr("stroke-width", 2)
      .attr("d", line);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `Sess ${d}`))
      .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((axis) =>
        axis.selectAll(".tick text").attr("fill", "#64748b").attr("font-family", "JetBrains Mono").attr("font-size", "10px")
      );

    // Y Axis (Capital in ₹)
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `₹${Math.round(Number(d) / 1000)}k`))
      .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((axis) =>
        axis.selectAll(".tick text").attr("fill", "#64748b").attr("font-family", "JetBrains Mono").attr("font-size", "10px")
      );
  }, [model]);

  return (
    <div className="bg-surface border border-border rounded p-3.5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Walk-Forward Backtest &amp; Capital Simulation
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-gain font-bold">
            <span className="w-2 h-0.5 bg-gain inline-block" /> Quantara Strategy
          </span>
          <span className="flex items-center gap-1 text-text-muted">
            <span className="w-2 h-0.5 bg-text-muted inline-block border-dashed" /> Buy &amp; Hold
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded bg-elevated border border-border font-mono">
          <div className="text-[10px] text-text-muted uppercase">Strategy Alpha</div>
          <div className="text-base font-extrabold text-gain mt-0.5">+{metrics.totalReturn.toFixed(2)}%</div>
          <div className="text-[9px] text-text-muted font-sans mt-0.5">vs Bench: +{metrics.benchmarkReturn.toFixed(2)}%</div>
        </div>

        <div className="p-2.5 rounded bg-elevated border border-border font-mono">
          <div className="text-[10px] text-text-muted uppercase">Sharpe Ratio</div>
          <div className="text-base font-extrabold text-accent mt-0.5">{metrics.sharpeRatio.toFixed(2)}</div>
          <div className="text-[9px] text-text-muted font-sans mt-0.5">Risk-adjusted return</div>
        </div>

        <div className="p-2.5 rounded bg-elevated border border-border font-mono">
          <div className="text-[10px] text-text-muted uppercase">Win Rate</div>
          <div className="text-base font-extrabold text-text-primary mt-0.5">{metrics.winRate.toFixed(1)}%</div>
          <div className="text-[9px] text-text-muted font-sans mt-0.5">{metrics.totalTrades} closed trades</div>
        </div>

        <div className="p-2.5 rounded bg-elevated border border-border font-mono">
          <div className="text-[10px] text-text-muted uppercase">Max Drawdown</div>
          <div className="text-base font-extrabold text-loss mt-0.5">-{metrics.maxDrawdown.toFixed(2)}%</div>
          <div className="text-[9px] text-text-muted font-sans mt-0.5">Peak-to-trough drop</div>
        </div>
      </div>

      {/* Equity Curve SVG */}
      <div className="w-full overflow-hidden">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}

