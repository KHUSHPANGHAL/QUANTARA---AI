"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface HeatmapCell {
  symbol: string;
  horizon: string;
  returnPct: number;
}

export function D3ReturnHeatmap({ height = 220 }: { height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const data: HeatmapCell[] = [
    { symbol: "TCS", horizon: "1D", returnPct: 1.45 },
    { symbol: "TCS", horizon: "5D", returnPct: 3.12 },
    { symbol: "TCS", horizon: "20D", returnPct: 5.80 },

    { symbol: "RELIANCE", horizon: "1D", returnPct: 0.85 },
    { symbol: "RELIANCE", horizon: "5D", returnPct: 2.10 },
    { symbol: "RELIANCE", horizon: "20D", returnPct: 4.25 },

    { symbol: "ICICIBANK", horizon: "1D", returnPct: 0.42 },
    { symbol: "ICICIBANK", horizon: "5D", returnPct: 1.65 },
    { symbol: "ICICIBANK", horizon: "20D", returnPct: 3.40 },

    { symbol: "INFY", horizon: "1D", returnPct: 0.15 },
    { symbol: "INFY", horizon: "5D", returnPct: -0.45 },
    { symbol: "INFY", horizon: "20D", returnPct: 1.85 },

    { symbol: "BHARTIARTL", horizon: "1D", returnPct: -0.25 },
    { symbol: "BHARTIARTL", horizon: "5D", returnPct: 0.95 },
    { symbol: "BHARTIARTL", horizon: "20D", returnPct: 6.20 },

    { symbol: "ITC", horizon: "1D", returnPct: -0.10 },
    { symbol: "ITC", horizon: "5D", returnPct: 0.35 },
    { symbol: "ITC", horizon: "20D", returnPct: -1.20 },

    { symbol: "HDFCBANK", horizon: "1D", returnPct: -0.65 },
    { symbol: "HDFCBANK", horizon: "5D", returnPct: -1.80 },
    { symbol: "HDFCBANK", horizon: "20D", returnPct: -2.40 },

    { symbol: "SBIN", horizon: "1D", returnPct: -1.10 },
    { symbol: "SBIN", horizon: "5D", returnPct: -3.20 },
    { symbol: "SBIN", horizon: "20D", returnPct: -4.85 },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentWidth = svgRef.current.parentElement?.clientWidth || 400;
    const margin = { top: 25, right: 15, bottom: 20, left: 75 };
    const w = parentWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", parentWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const symbols = ["TCS", "RELIANCE", "ICICIBANK", "INFY", "BHARTIARTL", "ITC", "HDFCBANK", "SBIN"];
    const horizons = ["1D", "5D", "20D"];

    const x = d3.scaleBand().domain(horizons).range([0, w]).padding(0.06);
    const y = d3.scaleBand().domain(symbols).range([0, h]).padding(0.06);

    const colorScale = d3
      .scaleDiverging<string>()
      .domain([-4, 0, 4])
      .interpolator(d3.interpolateRdYlGn);

    g.selectAll(".cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.horizon) || 0)
      .attr("y", (d) => y(d.symbol) || 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", (d) => {
        if (d.returnPct > 0) return "#00e676";
        if (d.returnPct < 0) return "#ff334b";
        return "#334155";
      })
      .attr("opacity", (d) => Math.min(0.9, Math.max(0.15, Math.abs(d.returnPct) / 4)));

    // Values inside cell
    g.selectAll(".cell-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => (x(d.horizon) || 0) + x.bandwidth() / 2)
      .attr("y", (d) => (y(d.symbol) || 0) + y.bandwidth() / 2 + 3)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono")
      .attr("font-weight", "600")
      .attr("fill", "#ffffff")
      .text((d) => (d.returnPct > 0 ? "+" : "") + d.returnPct.toFixed(1) + "%");

    // X Axis on top
    g.append("g")
      .call(d3.axisTop(x).tickSize(0))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis
          .selectAll(".tick text")
          .attr("fill", "#64748b")
          .attr("font-size", "10px")
          .attr("font-family", "JetBrains Mono")
          .attr("font-weight", "600")
      );

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis
          .selectAll(".tick text")
          .attr("fill", "#94a3b8")
          .attr("font-size", "10px")
          .attr("font-family", "JetBrains Mono")
      );
  }, [height]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}

