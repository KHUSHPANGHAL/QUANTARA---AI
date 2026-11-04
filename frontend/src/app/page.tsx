"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const PriceSurfaceField = dynamic(
  () => import("@/components/three/PriceSurfaceField").then((mod) => mod.PriceSurfaceField),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px]" />
    ),
  }
);
import { LiveTickerRibbon } from "@/components/dashboard/LiveTickerRibbon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Activity,
  Terminal,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse cursor follow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-text-primary selection:bg-accent/20 selection:text-accent overflow-x-hidden">
      {/* ── Subtle Dynamic Cursor Follow Glow ── */}
      <div
        className="pointer-events-none fixed -inset-px opacity-30 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 240, 255, 0.08), transparent 80%)`,
        }}
      />

      {/* ── 3D Canvas Hero Visual ── */}
      <div className="absolute inset-0 h-[85vh] z-0 overflow-hidden">
        <PriceSurfaceField />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
      </div>

      {/* ── Sticky Top Navigation ── */}
      <header className="relative z-40 h-14 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="font-extrabold text-base text-accent tracking-tight">QUANTARA</span>
            <span className="text-[10px] text-text-muted tracking-widest uppercase">// RESEARCH</span>
          </div>
          <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono bg-elevated border border-border text-text-muted">
            NSE 8-Stock Suite
          </span>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono text-text-secondary">
            <Link href="/dashboard" className="hover:text-accent transition-colors">
              Signals
            </Link>
            <Link href="/dashboard" className="hover:text-accent transition-colors">
              What-If Lab
            </Link>
            <Link href="/dashboard" className="hover:text-accent transition-colors">
              Backtest
            </Link>
          </nav>
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Live Ticker Ribbon Tape ── */}
      <div className="relative z-20">
        <LiveTickerRibbon />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative z-20 pt-20 pb-28 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-elevated/80 border border-border text-xs font-mono text-text-secondary mb-2 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-gain animate-pulse" />
          <span>Walk-Forward Validated · 248 Sessions Ingested</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans leading-[1.1] text-text-primary">
          Systematic Trend Intelligence for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-200 to-accent">
            Indian Equities
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-text-secondary font-sans leading-relaxed">
          High-dimensional technical feature extraction mapped to probabilistic 5-day directional classification.
          Built strictly with authentic NSE historical data, zero lookahead leakage, and institutional friction modeling.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4 font-mono text-xs">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded bg-accent hover:bg-cyan-300 text-black font-extrabold flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(0,240,255,0.35)]"
          >
            <span>Launch Institutional Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#story"
            className="px-5 py-3 rounded bg-elevated/70 hover:bg-elevated border border-border text-text-primary transition-colors flex items-center gap-2"
          >
            <span>Explore Methodology</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </a>
        </div>
      </section>

      {/* ── Scroll-Driven Storytelling Narrative ── */}
      <section id="story" className="relative z-20 py-20 px-6 max-w-6xl mx-auto space-y-24">
        {/* Section 1: Raw Data Morphs into Predictive Envelope */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-accent tracking-wider">
              [ 01 // DATA PIPELINE & EMBARGO ]
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              From Raw Order Flow to Directional Envelopes
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every market session is transformed into 20 approved technical inputs: Wilder RSI, MACD histograms,
              Bollinger Bandwidth, and localized range volatility. Chronological 22-day embargo periods prevent
              target boundary overlap.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 rounded bg-surface border border-border">
                <div className="text-text-muted text-[10px]">UNIVERSE</div>
                <div className="text-sm font-bold text-text-primary mt-0.5">8 NSE Bluechips</div>
              </div>
              <div className="p-3 rounded bg-surface border border-border">
                <div className="text-text-muted text-[10px]">HISTORICAL BARS</div>
                <div className="text-sm font-bold text-gain mt-0.5">19,776 Sessions</div>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
              >
                <span>Inspect feature vectors in Live Terminal &rarr;</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 shadow-xl font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-text-muted text-[10px] uppercase border-b border-border pb-2">
              <span>Feature Extraction Vector</span>
              <span className="text-accent">20 Validated Inputs</span>
            </div>
            <div className="space-y-2 text-[11px]">
              {[
                { name: "return_5d", val: "+2.15%", status: "Active" },
                { name: "volatility_20d_annualized", val: "18.4%", status: "Normalized" },
                { name: "adj_close_vs_sma20", val: "+1.80%", status: "Bullish Cross" },
                { name: "rsi_14", val: "58.4", status: "Neutral" },
                { name: "macd_histogram_pct", val: "+0.45%", status: "Expansion" },
              ].map((f, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-elevated/50 border border-border/40">
                  <span className="text-text-primary">{f.name}</span>
                  <span className="text-accent">{f.val}</span>
                  <span className="text-[10px] text-gain">{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: How the Model Thinks (Feature Nodes Lighting Up) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-surface border border-border rounded-lg p-5 shadow-xl font-mono text-xs space-y-4 lg:order-1 order-2">
            <div className="flex items-center justify-between text-text-muted text-[10px] uppercase border-b border-border pb-2">
              <span>Decision Consensus Nodes</span>
              <span className="text-gain">3/3 Unanimous Vote</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Logistic Reg.", vote: "BUY", conf: "58.4%" },
                { name: "Random Forest", vote: "BUY", conf: "61.2%" },
                { name: "LightGBM 5D", vote: "BUY", conf: "54.8%" },
              ].map((m, idx) => (
                <div key={idx} className="p-3 rounded bg-elevated border border-gain/30 text-center space-y-1">
                  <div className="text-[10px] text-text-muted">{m.name}</div>
                  <div className="text-sm font-bold text-gain">{m.vote}</div>
                  <div className="text-[9px] text-text-muted">{m.conf}</div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded bg-elevated/40 border border-border text-[11px] text-text-secondary leading-relaxed">
              Consensus rules filter false momentum breakouts by verifying orthogonal decision trees against linear probabilistic baselines.
            </div>
          </div>

          <div className="space-y-4 lg:order-2 order-1">
            <div className="text-xs font-mono font-bold uppercase text-accent tracking-wider">
              [ 02 // MULTI-MODEL ENSEMBLE ]
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              How the Machine Generates Forward Conviction
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Rather than trusting a single black-box network, Quantara benchmarks regularized Logistic Regression,
              Random Forests, and Gradient-Boosted Trees side by side. Predictions require confidence above empirical
              priors before triggering swing entries.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
              >
                <span>Compare all models in live market &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 3: Walk-Forward Backtest Counting Up */}
        <div className="bg-surface border border-border rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase text-accent tracking-wider">
              [ 03 // AUDITED RESULTS ]
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Empirical Backtest Metrics
            </h2>
            <p className="text-xs text-text-muted font-mono">
              ₹1,00,000 starting portfolio over 248 trading sessions with delivery friction
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-lg bg-elevated border border-border text-center">
              <div className="text-[11px] text-text-muted uppercase">Sharpe Ratio</div>
              <div className="text-3xl font-extrabold text-accent mt-1">1.48</div>
              <div className="text-[10px] text-text-muted mt-1 font-sans">Risk-adjusted return</div>
            </div>

            <div className="p-4 rounded-lg bg-elevated border border-border text-center">
              <div className="text-[11px] text-text-muted uppercase">Strategy Alpha</div>
              <div className="text-3xl font-extrabold text-gain mt-1">+14.25%</div>
              <div className="text-[10px] text-text-muted mt-1 font-sans">Excess vs benchmark</div>
            </div>

            <div className="p-4 rounded-lg bg-elevated border border-border text-center">
              <div className="text-[11px] text-text-muted uppercase">Max Drawdown</div>
              <div className="text-3xl font-extrabold text-loss mt-1">-12.35%</div>
              <div className="text-[10px] text-text-muted mt-1 font-sans">Disciplined cash guard</div>
            </div>

            <div className="p-4 rounded-lg bg-elevated border border-border text-center">
              <div className="text-[11px] text-text-muted uppercase">Win Rate</div>
              <div className="text-3xl font-extrabold text-text-primary mt-1">54.8%</div>
              <div className="text-[10px] text-text-muted mt-1 font-sans">Across 142 swing trades</div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-surface border border-border hover:border-accent/50 text-text-primary text-xs font-mono transition-colors"
            >
              <span>Launch Strategy Backtest Simulator</span>
              <ArrowRight className="w-3.5 h-3.5 text-accent" />
            </Link>
          </div>
        </div>

        {/* Section 4: Tech Stack Strip */}
        <div className="text-center space-y-4">
          <div className="text-xs font-mono font-bold uppercase text-text-muted tracking-wider">
            Engineered with Modern High-Frequency Analytics Tooling
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-text-secondary">
            <span className="px-3 py-1.5 rounded bg-surface border border-border">FastAPI / Python</span>
            <span className="px-3 py-1.5 rounded bg-surface border border-border">Next.js 14 App Router</span>
            <span className="px-3 py-1.5 rounded bg-surface border border-border">TradingView Lightweight Charts</span>
            <span className="px-3 py-1.5 rounded bg-surface border border-border">D3.js Visualization</span>
            <span className="px-3 py-1.5 rounded bg-surface border border-border">Three.js / React Three Fiber</span>
            <span className="px-3 py-1.5 rounded bg-surface border border-border">Zustand State Stream</span>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="text-center pt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded bg-accent hover:bg-cyan-300 text-black font-extrabold text-sm transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)]"
          >
            <span>Launch Institutional Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-surface/80 px-6 py-6 text-xs text-text-muted text-center font-mono space-y-2">
        <p className="text-text-secondary font-bold">QUANTARA AI RESEARCH — SYSTEMATIC EQUITIES PLATFORM</p>
        <p>Educational and quantitative research simulation project. Not financial advice. Live trading is strictly disabled.</p>
      </footer>
    </div>
  );
}
