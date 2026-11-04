"use client";

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { StockSymbol } from "@/lib/types";
import { Scale } from "lucide-react";

export function MultiTickerCompare() {
  const [selectedTickers, setSelectedTickers] = useState<StockSymbol[]>([
    "TCS.NS",
    "RELIANCE.NS",
    "INFY.NS",
  ]);

  const svgRef = useRef<SVGSVGElement>(null);

  const colors: Record<string, string> = {
    "TCS.NS": "#00f0ff",
    "RELIANCE.NS": "#00e676",
    "INFY.NS": "#ffb300",
    "HDFCBANK.NS": "#a855f7",
  };

  const toggleTicker = (sym: StockSymbol) => {
    if (selectedTickers.includes(sym)) {
      if (selectedTickers.length > 1) {
        setSelectedTickers(selectedTickers.filter((s) => s !== sym));
      }
    } else if (selectedTickers.length < 4) {
      setSelectedTickers([...selectedTickers, sym]);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentWidth = svgRef.current.parentElement?.clientWidth || 500;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 25, left: 45 };
    const w = parentWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", parentWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sessions = 60;
    const x = d3.scaleLinear().domain([0, sessions]).range([0, w]);
    const y = d3.scaleLinear().domain([-12, 16]).range([h, 0]);

    // Zero baseline
    g.append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-dasharray", "3,3");

    selectedTickers.forEach((sym) => {
      // Generate synthetic normalized % path
      const seed = sym.charCodeAt(0) * 0.1;
      const pts: [number, number][] = [[0, 0]];
      let cum = 0;
      for (let i = 1; i <= sessions; i++) {
        cum += Math.sin(i * 0.2 + seed) * 0.5 + (seed > 8 ? 0.08 : -0.04);
        pts.push([i, cum]);
      }

      const line = d3
        .line<[number, number]>()
        .x((d) => x(d[0]))
        .y((d) => y(d[1]))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(pts)
        .attr("fill", "none")
        .attr("stroke", colors[sym] || "#38bdf8")
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `T-${sessions - Number(d)}d`))
      .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((axis) =>
        axis.selectAll(".tick text").attr("fill", "#64748b").attr("font-family", "JetBrains Mono").attr("font-size", "10px")
      );

    // Y Axis (% change)
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${Number(d) > 0 ? "+" : ""}${d}%`))
      .call((axis) => axis.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
      .call((axis) =>
        axis.selectAll(".tick text").attr("fill", "#64748b").attr("font-family", "JetBrains Mono").attr("font-size", "10px")
      );
  }, [selectedTickers]);

  return (
    <div className="bg-surface border border-border rounded p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Normalized Performance Comparison (% Return)
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          {(["TCS.NS", "RELIANCE.NS", "INFY.NS", "HDFCBANK.NS"] as StockSymbol[]).map((sym) => {
            const isSel = selectedTickers.includes(sym);
            return (
              <button
                key={sym}
                onClick={() => toggleTicker(sym)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  isSel
                    ? "bg-accent/20 border border-accent text-accent"
                    : "bg-elevated border border-border text-text-muted hover:text-text-primary"
                }`}
              >
                {sym.replace(".NS", "")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}

