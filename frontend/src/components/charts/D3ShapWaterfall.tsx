"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ShapAttribution } from "@/lib/types";

interface Props {
  attributions: ShapAttribution[];
  height?: number;
}

export function D3ShapWaterfall({ attributions, height = 240 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || attributions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentWidth = svgRef.current.parentElement?.clientWidth || 380;
    const margin = { top: 10, right: 20, bottom: 20, left: 110 };
    const w = parentWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", parentWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
      .scaleBand()
      .domain(attributions.map((d) => d.feature))
      .range([0, h])
      .padding(0.25);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(attributions, (d) => d.importance) || 0.2])
      .range([0, w]);

    // Bars
    g.selectAll(".bar")
      .data(attributions)
      .enter()
      .append("rect")
      .attr("y", (d) => y(d.feature) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", (d) => x(d.importance))
      .attr("fill", (d) => (d.direction === "positive" ? "#00e676" : "#ff334b"))
      .attr("opacity", 0.85)
      .attr("rx", 2);

    // Value Labels
    g.selectAll(".val-label")
      .data(attributions)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.importance) + 6)
      .attr("y", (d) => (y(d.feature) || 0) + y.bandwidth() / 2 + 3)
      .text((d) => (d.direction === "positive" ? "+" : "-") + (d.importance * 100).toFixed(1) + "%")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono");

    // Y Axis (Feature Names)
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
  }, [attributions, height]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}

