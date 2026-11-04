"use client";

import React, { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { CandleBar } from "@/lib/types";

interface Props {
  candles: CandleBar[];
  sma20?: [number, number][];
  sma50?: [number, number][];
  height?: number;
}

export function TradingViewCandleChart({ candles, sma20, sma50, height = 380 }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#64748b",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(0, 240, 255, 0.4)", width: 1, style: 3 },
        horzLine: { color: "rgba(0, 240, 255, 0.4)", width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00e676",
      downColor: "#ff334b",
      borderUpColor: "#00e676",
      borderDownColor: "#ff334b",
      wickUpColor: "#00e676",
      wickDownColor: "#ff334b",
    });

    // Volume histogram
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    if (candles.length > 0) {
      // Deduplicate and ensure strict ascending order by time
      const seenTimes = new Set<number>();
      const validCandles = [...candles]
        .filter((c) => {
          if (!c.time || isNaN(c.time) || isNaN(c.open) || isNaN(c.close) || isNaN(c.high) || isNaN(c.low)) return false;
          if (seenTimes.has(c.time)) return false;
          seenTimes.add(c.time);
          return true;
        })
        .sort((a, b) => a.time - b.time);

      candleSeries.setData(
        validCandles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: Math.max(c.high, c.open, c.close),
          low: Math.min(c.low, c.open, c.close),
          close: c.close,
        }))
      );

      volumeSeries.setData(
        validCandles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume || 100000,
          color: c.close >= c.open ? "rgba(0, 230, 118, 0.25)" : "rgba(255, 51, 75, 0.25)",
        }))
      );
    }

    // SMA 20 Overlay (Electric Cyan)
    if (sma20 && sma20.length > 0) {
      const seenSma20 = new Set<number>();
      const validSma20 = sma20
        .filter(([time, val]) => {
          if (!time || isNaN(time) || isNaN(val) || val === null) return false;
          if (seenSma20.has(time)) return false;
          seenSma20.add(time);
          return true;
        })
        .sort((a, b) => a[0] - b[0]);

      if (validSma20.length > 0) {
        const sma20Series = chart.addLineSeries({
          color: "#00f0ff",
          lineWidth: 1,
          title: "SMA 20",
        });
        sma20Series.setData(
          validSma20.map(([time, val]) => ({ time: time as UTCTimestamp, value: val }))
        );
      }
    }

    // SMA 50 Overlay (Muted Slate)
    if (sma50 && sma50.length > 0) {
      const seenSma50 = new Set<number>();
      const validSma50 = sma50
        .filter(([time, val]) => {
          if (!time || isNaN(time) || isNaN(val) || val === null) return false;
          if (seenSma50.has(time)) return false;
          seenSma50.add(time);
          return true;
        })
        .sort((a, b) => a[0] - b[0]);

      if (validSma50.length > 0) {
        const sma50Series = chart.addLineSeries({
          color: "#94a3b8",
          lineWidth: 1,
          title: "SMA 50",
        });
        sma50Series.setData(
          validSma50.map(([time, val]) => ({ time: time as UTCTimestamp, value: val }))
        );
      }
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, sma20, sma50, height]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}

