# Quantara AI Frontend Audit

**Document Version:** 1.0  
**Scope:** `web_app/static/index.html` (1,791 lines)  
**Target:** Conversion to production-grade, human-authored institutional internal tool.

---

## 1. AI-Tells Found

| ID / Line | Current Implementation (AI Tell) | Proposed Fix |
| :--- | :--- | :--- |
| **Lines 502–506** | Emojis in navigation tabs (`⚡ Live Signals`, `📊 Chart Lab`, `📈 Backtest`, `📋 Blotter`, `🔍 Audit`). | Remove all emojis. Use plain textual navigation: `Signals`, `Chart`, `Backtest`, `Blotter`, `Audit`. |
| **Lines 82–92** | `.brand-logo` with violet-to-cyan gradient, rounded box, and box-shadow glow; gradient text mask on title. | Replace with clean, restrained, flat text branding: `QUANTARA` with a simple institutional descriptor `Research Terminal`. |
| **Lines 104–112** | `.status-dot` with `@keyframes pulse` infinitely cycling opacity. | Remove infinite CSS pulse animation. Use a solid, static green/red status indicator circle. |
| **Lines 161–193, 533–557** | `#regimeHero`: Massive 3-tiered colored hero billboard with radial gradients, huge 32px typography, and promotional layout. | Replace billboard with a compact, dense, single-row status bar: regime status, breadth %, count of stocks above SMA20. |
| **Lines 560–581** | `#kpiStrip`: 4 large KPI cards restating what is already visible in the signal table. | Replace with a compact, inline summary metric bar embedded directly into the header of the Signals table. |
| **Lines 241–266, 606–619** | `#topModelsContainer`: Card grid with medal emojis (`🥇 RANK #1`, `🥈 RANK #2`, `🥉 RANK #3`), hover lift (`translateY(-2px)`), card glow, and duplicate action buttons. | Merge with the 3-model comparison section into a unified, clean tabular performance comparison. |
| **Lines 622–641, 1188–1279** | `#modelCompareSection`: Redundant table repeating tickers with emoji pills (`🎯 3/3 Consensus BUY`, `⚡ 2/3 Majority BUY`, `Chart 📊`). | Integrate model performance and consensus into a single structured comparison table without emojis or redundant drill-down buttons. |
| **Lines 701–750** | ML Prediction Panel in Chart Lab: Uses 4 simultaneous redundant visualizations (huge signal badge, donut chart, stacked horizontal bar, conviction score bars). | Remove donut chart and stacked bars. Display a clean, concise quantitative summary: signal badge, numeric probability table ($P(\text{UP})$, $P(\text{HOLD})$, $P(\text{DOWN})$), and conviction metric. |
| **Lines 18–37, 248–289** | Multi-colored neon dark palette (violet, emerald, rose, amber, cyan, gold, silver) competing for attention with glowing borders. | Normalize to a coherent institutional palette: dark neutral slate surfaces, single primary accent (slate/blue), green (`#10b981`) only for positive return/UP, red (`#ef4444`) only for negative return/DOWN, amber (`#f59e0b`) for neutral/warning. Eliminate cyan as a decorative color. |
| **Global CSS** | Oversized border radii (`12px`, `18px`, `24px`, `100px` pills) and heavy drop shadows (`0 10px 25px rgba(...)`). | Enforce compact 4px / 6px radii and flat 1px solid borders without glows or diffuse shadows. |
| **Lines 430–433** | `.skeleton` shimmer animation. | Remove unused shimmer animation; use clean textual "Loading..." placeholders. |

---

## 2. Duplicates Found

1. **Model Selection Controls (3x Duplicate)**:
   - Topbar dropdown `#globalModel` (lines 512–516).
   - "Switch to this Model" buttons generated on each card in `#topModelsContainer` (line 1115).
   - Redundant model label badges and per-model column triggers.
   - *Resolution:* Retain solely the topbar `#globalModel` dropdown as the single source of truth. Make model overview cards/rows read-only.
2. **Stock / Ticker Selection Controls (3x Duplicate)**:
   - Sidebar buttons in Chart Lab `#stockButtons` (lines 1282–1293).
   - Clickable symbol chips in Live Signals table (line 1029).
   - Clickable symbol chips & redundant `Chart 📊` buttons in Consensus table (lines 1246, 1261).
   - *Resolution:* Chart Lab sidebar remains the explicit selector; table tickers become standard clickable links that navigate to the Chart tab. Remove all auxiliary `Chart 📊` buttons.
3. **Model Evaluation Displays (2x Duplicate)**:
   - `#topModelsContainer` (lines 606–619, 1070–1127) lists the 3 models with win rates, drawdowns, and profit factors.
   - `#modelCompareSection` (lines 622–641, 1150–1279) lists the same 3 models side by side for each stock.
   - *Resolution:* Combine into a single unified Model Evaluation & Consensus panel.
4. **Prediction Data Visualization in Chart Lab (4x Duplicate)**:
   - `#bigSignalWrap` (lines 711, 1469–1470).
   - `#chart-pred-donut` (lines 720, 1501–1531).
   - `#chart-pred-compare` (lines 745, 1533–1559).
   - `#convictionBars` (lines 747, 1561–1577).
   - *Resolution:* Consolidate into one compact, data-dense tabular readout showing active model signal, 3-class probabilities, and conviction score.
5. **Data Refresh Triggers (3x Duplicate)**:
   - `#refreshBtn` in Regime Hero (line 552).
   - "Refresh Matrix" button in Consensus Matrix (line 632).
   - "Update" button in Chart Lab ML Prediction Panel (line 712).
   - *Resolution:* Single global refresh button or context-specific header action without duplicate micro-buttons.

---

## 3. Dead Code Found (Grep-Verified)

### A. Unreferenced CSS Classes
- `.audit-grid` (HTML uses `.grid-2`, class never referenced)
- `.col-span-2` (Never used)
- `.col-span-3` (Never used)
- `.glow-emerald` (Never used)
- `.glow-violet` (Never used)
- `.grid-3` (Never used)
- `.model-col` (Dead layout from previous revision)
- `.model-col-body` (Dead layout)
- `.model-col-header` (Dead layout)
- `.model-compare-grid` (Dead layout)
- `.model-row` (Dead layout)
- `.model-row-prob` (Dead layout)
- `.model-row-signal` (Dead layout)
- `.model-row-sym` (Dead layout)
- `.selected` (Never applied)
- `.skeleton` (Defined, never attached to any element)

### B. Dead JavaScript Variables & Objects
- `const COLORS` (line 854: defined but never used anywhere in code).
- `const MODEL_LABELS` (line 853: defined once, then duplicated inline on line 909 and line 1133).
- `let _allModelsData` (line 861: initialized to `{}`, never read or written).
- `let _stockPredData` (line 862: initialized to `null`, assigned to on line 1454, never read).
- `let _sortKey` (line 978: initialized to `'conviction'`, updated on line 979, never read).
- `annotations = { yaxis: [] }` (line 1359: empty object passed needlessly to chart options).

### C. Unused Element IDs
- `#blotterTable` (only `#blotterHead` and `#blotterBody` accessed)
- `#kpiStrip`
- `#predGrid`
- `#predLegend`

---

## 4. Inconsistencies Found

1. **Table Typography & Alignment**:
   - Numeric columns in `.signals-table`, `.consensus-table`, and `.blotter-table` had mixed left/right alignment and inconsistent padding (8px to 14px).
   - Inconsistent tabular numeral formatting: some cells used standard proportional fonts instead of monospace.
2. **Number Formatting**:
   - Currency: Some values rendered as `₹${(p.Close||0).toLocaleString()}`, others as `'₹' + d.latest_close.toLocaleString()`, others as `'₹' + Math.round(v).toLocaleString()`. None enforced standard 2 decimal places for trading prices.
   - Percentages: Mixed between `toFixed(1)` and `toFixed(2)`.
   - Probability representations: Mixed between percentages (0-100%) and decimals (0.0-1.0).
3. **Color Inconsistencies**:
   - Four different shades of green (`#10b981`, `#34d399`, `rgba(16,185,129,...)`).
   - Four different shades of red/rose (`#f43f5e`, `#fb7185`, `#ef4444`, `rgba(244,63,94,...)`).
4. **Button & Control Styling**:
   - Four different button classes (`.btn`, `.stock-btn`, `.period-btn`, `.ind-toggle`) with differing padding, font weights, borders, and hover mechanics.

---

## 5. Bugs & Technical Risks

1. **Cross-Site Scripting (XSS) via `innerHTML`**:
   - Multiple functions concatenate unescaped strings from API payloads into DOM `innerHTML`:
     - `renderPredictionsTable` (`p.Symbol`, `p.signal`)
     - `loadTopModels` (`m.name`, `m.architecture`, `m.summary`)
     - `loadAllModelsComparison` (`st.symbol`, `m.signal`)
     - `renderStrategyTable` (`s.strategy_name`)
     - `renderBlotter` (`t[k]`)
     - `renderChecks` (`c.check_name`, `c.detail`)
   - *Fix:* Implement an explicit `escapeHtml()` utility and prefer `textContent` for dynamic text nodes.
2. **Race Conditions on Quick Navigation**:
   - `loadStockChart` and `loadStockPrediction` launch independent fetches with no request tracking or `AbortController`. If a user clicks between multiple stocks quickly, responses can arrive out-of-order, leaving stale data on screen.
   - *Fix:* Implement an active request token or `AbortController` to cancel/ignore stale responses.
3. **ApexCharts Memory Leak & Redundant Instances**:
   - Chart instances are destroyed and recreated repeatedly without reusing series or options.
   - When switching tabs, charts hidden in display:none can experience render glitches.
4. **Silent API Failures**:
   - Several API errors only trigger a fleeting toast message while leaving container divs permanently stuck in "Loading..." states without a retry action.
   - *Fix:* Render explicit inline error containers with retry buttons on fetch failures.

