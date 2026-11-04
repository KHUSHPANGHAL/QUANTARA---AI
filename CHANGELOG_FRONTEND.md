# Quantara AI — Frontend Refactoring Changelog

**Date:** 2026-11-04  
**Scope:** Complete refactor of `web_app/static/index.html` into a modular, production-grade institutional internal trading interface.

---

## 1. Quantitative Summary of Changes

| Metric | Before Refactor | After Refactor | Delta |
| :--- | :--- | :--- | :--- |
| **Monolithic Files** | 1 (`index.html`) | 0 (Split into `index.html`, `styles.css`, `app.js`) | Modularized |
| **Total Lines of Code** | 1,791 lines | 1,514 lines total (`html`: 283, `css`: 608, `js`: 623) | -277 lines net (-15.5%) |
| **CSS Rules / Selectors** | 134 rules | 74 rules | -60 dead / duplicate rules |
| **Unreferenced CSS Classes** | 15 unused classes | **0 unused classes** | 100% eliminated |
| **Decorative Emojis** | 28 emojis across tabs, cards, headers | **0 emojis** | 100% eliminated |
| **Decorative Animations** | 3 (`@keyframes pulse`, `shimmer`, `spin`) | **0 decorative keyframes** | 100% eliminated |
| **Duplicate Model Selectors**| 3 independent controls | **1 unified control** (topbar dropdown) | -2 controls |
| **Duplicate Ticker Triggers** | 4 independent triggers / buttons | **1 selector panel + standard table links** | -2 redundant buttons |
| **Chart Lab Prediction Visuals** | 4 overlapping displays (big badge, donut, stacked bar, meters) | **1 structured inference table** | -3 redundant charts |
| **`console.log` statements** | Variable | **0 statements** | Clean |

---

## 2. Controls Inventory: Exactly One Control per Action

In strict adherence to Hard Constraint #3 ("No duplicate buttons or controls. Every action has exactly one control, in exactly one place"):

1. **Active ML Model Selection:**
   - **Single Control:** `#globalModelSelect` `<select>` dropdown in the sticky topbar.
   - *Removed:* "Switch to this Model" buttons on Top-3 model cards and per-model column triggers. Model cards and comparison matrices are now read-only institutional specs.
2. **Tab Navigation:**
   - **Single Control:** `.nav-tabs` button group (`Signals`, `Charts`, `Backtest`, `Trades`, `Audit`) in the topbar.
3. **Chart Lab Equity Selection:**
   - **Single Control:** `#stockList` button list in the Chart Lab sidebar.
   - *Behavior:* Table symbol clicks simply route the user directly to this active selector.
4. **Chart Lookback Window:**
   - **Single Control:** `.period-bar` toggle group (`1M`, `3M`, `6M`, `1Y`).
5. **Technical Overlays & Oscillators:**
   - **Single Controls:** 4 toggle buttons in the sidebar (`SMA 20/50`, `Bollinger Bands`, `RSI 14`, `MACD`).
6. **Market Signals Ingestion:**
   - **Single Control:** `#refreshBtn` in the Market Regime status bar.
   - *Removed:* Duplicate "Refresh Matrix" and "Update" buttons in child cards.
7. **Signal Table Sorting:**
   - **Single Control:** `Conviction ↕` column header toggle in the Live Predictions table.
8. **Trade Blotter Filtering:**
   - **Text Query Control:** `#blotterSearch` `<input type="text">` for filtering tickers.
   - **Direction Filter Control:** `#blotterDir` `<select>` for filtering `LONG` / `SHORT`.

---

## 3. Structural Merges & Unifications

1. **Top-3 Models Showcase & 3-Model Consensus Matrix Merged:**
   - Previously, these were two disconnected, competing sections on the main page.
   - They are now unified under `#modelEvalWrap` as:
     - Part A: Audited Model Specifications & In-Sample Performance Table.
     - Part B: Cross-Model Signal Agreement Matrix.
2. **Chart Lab Prediction Readout Streamlined:**
   - Eliminated the redundant ApexCharts donut chart, redundant stacked horizontal bar chart, and redundant conviction meters.
   - Replaced with a single clean quantitative inference table comparing model predictions, probabilities, and conviction scores directly below the price chart.
3. **Market Regime Banner Compacted:**
   - Replaced the 300px multi-color hero billboard with a 40px single-row institutional status strip (`.regime-bar`).

---

## 4. Visual Language & "AI-Look" Removals

1. **Color Palette Normalized:**
   - Replaced the rainbow neon scheme (emerald + rose + amber + violet + cyan + gold + silver) with an institutional slate palette:
     - Neutral surfaces: `--bg-0: #090c12`, `--bg-1: #0f131d`, `--bg-2: #161c2b`, `--bg-3: #1e2638`.
     - Single primary brand accent: `--accent: #38bdf8` (sky/slate blue).
     - Semantic data colors only: `--up: #10b981` (green for gains/UP), `--down: #ef4444` (red for losses/DOWN), `--warn: #f59e0b` (amber for neutral/cash).
2. **Decorations Eliminated:**
   - Zero gradients (removed text gradient masks, glowing logo squares, gradient bars).
   - Zero glow effects (removed `var(--violet-glow)`, `var(--border-glow)`).
   - Zero heavy drop shadows; flat `1px solid var(--border)` borders.
   - Border radius standardized to `4px` across all controls and tables.
3. **Copy De-marketized:**
   - Removed: "Alpha Screener", "Institutional Intelligence", "Radical transparency", "Studio", "Deep void", exclamation marks, and promotional subtitles.
   - Substituted plain descriptive names: `Signals`, `Charts`, `Backtest`, `Trades`, `Audit`.

---

## 5. Security & Engineering Enhancements

1. **XSS Prevention:**
   - All dynamic strings originating from API endpoints (`Symbol`, `signal`, `name`, `architecture`, `detail`, `check_name`, trade records) are passed through an explicit `esc()` sanitization helper before DOM insertion.
2. **Race Condition Prevention:**
   - Implemented monotonic token counters (`activeChartToken`, `activePredToken`) to discard out-of-order responses when switching symbols or periods rapidly.
3. **Safe Memory & Chart Lifecycle:**
   - Prior to creating new ApexCharts instances, existing instances are safely destroyed via `.destroy()`, eliminating detached DOM nodes and memory leaks.
4. **Tabular Numerals & Consistency:**
   - Applied CSS `font-feature-settings: "tnum" 1` and right-aligned all numerical table columns.
   - Enforced 2 decimal places for INR prices (`fmtPrice`), signed percentages for returns (`fmtPct`), and 1 decimal place for probabilities (`fmtProb`).

---

## 6. Items Left Untouched (Intentional Conservatism)

- **Backend API Contract:** All 11 endpoint routes and query parameter specifications remain 100% unaltered.
- **Underlying Quantitative Data:** No changes were made to feature definitions, classification thresholds, or backtest logic.
- **ApexCharts Library:** Kept ApexCharts v3.45.2 as requested without adding any new libraries or bundlers.

