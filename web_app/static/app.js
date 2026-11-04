/**
 * Quantara AI — Research Terminal Frontend Engine
 * Modular client implementation handling data ingestion, charting,
 * and state synchronization across analytics modules.
 */

/* ==========================================================================
   1. State & Configuration
   ========================================================================== */

const UNIVERSE = [
  'BHARTIARTL.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
  'ITC.NS', 'RELIANCE.NS', 'SBIN.NS', 'TCS.NS'
];

const STOCK_NAMES = {
  'BHARTIARTL.NS': 'Bharti Airtel',
  'HDFCBANK.NS': 'HDFC Bank',
  'ICICIBANK.NS': 'ICICI Bank',
  'INFY.NS': 'Infosys',
  'ITC.NS': 'ITC Limited',
  'RELIANCE.NS': 'Reliance Industries',
  'SBIN.NS': 'State Bank of India',
  'TCS.NS': 'Tata Consultancy Services'
};

const state = {
  model: 'logistic_regression',
  symbol: UNIVERSE[0],
  period: '1mo',
  indicators: {
    sma: true,
    bb: true,
    rsi: true,
    macd: true
  },
  predictions: [],
  blotter: [],
  sort: { key: 'conviction', asc: false }
};

// Cached payloads for lazy-loaded tabs
const cache = {
  backtest: null,
  blotter: null,
  audit: null
};

// ApexCharts instances
const charts = {
  candle: null,
  volume: null,
  rsi: null,
  macd: null,
  equity: null,
  features: null
};

// Active in-flight request tokens to prevent out-of-order race conditions
let activeChartToken = 0;
let activePredToken = 0;


/* ==========================================================================
   2. Utilities & Formatters
   ========================================================================== */

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtPrice(val) {
  const n = Number(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(val, decimals = 2) {
  const n = Number(val);
  if (isNaN(n)) return '—';
  const prefix = n > 0 ? '+' : '';
  return prefix + n.toFixed(decimals) + '%';
}

function fmtProb(val) {
  const n = Number(val);
  if (isNaN(n)) return '0.0%';
  return (n * 100).toFixed(1) + '%';
}

function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function getSignalClass(sig) {
  if (!sig || typeof sig !== 'string') return 'wait';
  const s = sig.toUpperCase();
  if (s.includes('BUY')) return 'buy';
  if (s.includes('SELL')) return 'sell';
  if (s.includes('CASH')) return 'cash';
  return 'wait';
}


/* ==========================================================================
   3. Centralized API Layer
   ========================================================================== */

async function api(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText || 'Request failed'})`);
  }
  return response.json();
}


/* ==========================================================================
   4. Clock & System Status
   ========================================================================== */

function initClock() {
  const el = document.getElementById('clockDisplay');
  function tick() {
    const d = new Date();
    el.textContent = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
  }
  setInterval(tick, 1000);
  tick();
}

async function checkSystemStatus() {
  const ind = document.getElementById('systemStatus');
  const txt = document.getElementById('systemStatusText');
  try {
    const data = await api('/api/status');
    txt.textContent = data.status || 'ONLINE';
    ind.classList.remove('offline');
  } catch (err) {
    txt.textContent = 'OFFLINE';
    ind.classList.add('offline');
  }
}


/* ==========================================================================
   5. Tab Navigation
   ========================================================================== */

function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    const isActive = b.getAttribute('data-tab') === tabId;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');

  // Lazy-load data upon initial activation
  if (tabId === 'chartlab') {
    if (!document.getElementById('stockList').children.length) {
      buildStockSelector();
    }
    loadStockChart(state.symbol);
    loadStockPrediction(state.symbol);
  } else if (tabId === 'backtest' && !cache.backtest) {
    loadBacktest();
  } else if (tabId === 'blotter' && !cache.blotter) {
    loadBlotter();
  } else if (tabId === 'audit' && !cache.audit) {
    loadAudit();
  }
}


/* ==========================================================================
   6. View: Signals (Live Signals, Regime, and Model Performance)
   ========================================================================== */

async function refreshPredictions(force = false) {
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.disabled = true;

  try {
    const data = await api(`/api/live-predictions?model=${state.model}&refresh=${force}`);
    state.predictions = data.predictions || [];
    renderRegime(data.market_regime);
    renderKpis(data);
    applySortAndRender();
  } catch (err) {
    document.getElementById('predictionsTableWrap').innerHTML = `
      <div class="state-message state-error">
        Failed to load market signals: ${esc(err.message)}
        <div style="margin-top:8px;">
          <button class="btn" onclick="refreshPredictions(true)">Retry</button>
        </div>
      </div>`;
    toast('Error loading signals: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderRegime(r) {
  if (!r) return;
  const pill = document.getElementById('regimePill');
  const desc = document.getElementById('regimeDesc');
  const breadth = document.getElementById('regimeBreadth');
  const above = document.getElementById('regimeAbove');

  const status = r.status || 'NEUTRAL_CHOP';
  let pillClass = 'neutral';
  if (status.includes('BULLISH')) pillClass = 'bullish';
  if (status.includes('BEARISH')) pillClass = 'bearish';

  pill.className = `regime-pill ${pillClass}`;
  pill.textContent = status.replace(/_/g, ' ');
  desc.textContent = r.guidance || 'Market breadth evaluation active.';
  breadth.textContent = (r.breadth_pct !== undefined ? r.breadth_pct.toFixed(1) : '—') + '%';
  above.textContent = `${r.stocks_above_sma20 || 0} / ${r.total_stocks || 8}`;
}

function renderKpis(data) {
  const preds = data.predictions || [];
  const buyCount = preds.filter(p => p.signal && p.signal.toUpperCase().includes('BUY')).length;
  const sellCount = preds.filter(p => p.signal && p.signal.toUpperCase().includes('SELL')).length;
  const waitCount = preds.filter(p => p.signal && (p.signal.toUpperCase().includes('WAIT') || p.signal.toUpperCase().includes('CASH'))).length;
  const top = data.top_picks && data.top_picks[0];

  document.getElementById('kpiBuy').textContent = buyCount;
  document.getElementById('kpiSell').textContent = sellCount;
  document.getElementById('kpiWait').textContent = waitCount;

  const topEl = document.getElementById('kpiTopPick');
  if (top) {
    topEl.textContent = `${top.Symbol.replace('.NS', '')} (${(top.p_up * 100).toFixed(1)}% UP)`;
  } else {
    topEl.textContent = 'None';
  }
}

function setSort(key) {
  if (state.sort.key === key) {
    state.sort.asc = !state.sort.asc;
  } else {
    state.sort.key = key;
    state.sort.asc = false;
  }
  applySortAndRender();
}

function applySortAndRender() {
  const { key, asc } = state.sort;
  const list = [...state.predictions];

  list.sort((a, b) => {
    let va = a[key];
    let vb = b[key];
    if (key === 'signal') {
      const rank = { 'BUY / LONG': 1, 'SELL / HEDGE': 2, 'WAIT / CHOP': 3, 'CASH (Regime Guard)': 4 };
      va = rank[a.signal] || 99;
      vb = rank[b.signal] || 99;
    }
    if (va === undefined || va === null) va = 0;
    if (vb === undefined || vb === null) vb = 0;
    return asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  renderPredictionsTable(list);
}

function renderPredictionsTable(items) {
  const wrap = document.getElementById('predictionsTableWrap');
  if (!items.length) {
    wrap.innerHTML = '<div class="state-message">No predictions available for the selected model.</div>';
    return;
  }

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th class="num">LTP</th>
          <th class="num">1D Chg</th>
          <th>Signal</th>
          <th>P(UP)</th>
          <th>P(HOLD)</th>
          <th>P(DOWN)</th>
          <th class="num" style="cursor:pointer;" onclick="setSort('conviction')">Conviction ↕</th>
          <th class="num">RSI 14</th>
          <th class="num">Vol 20d</th>
          <th class="num">SMA20 Dist</th>
        </tr>
      </thead>
      <tbody>`;

  items.forEach(p => {
    const chg = Number(p.Change1D || 0);
    const chgClass = chg > 0 ? 'val-up' : chg < 0 ? 'val-down' : 'val-neutral';
    const sig = p.signal || 'WAIT / CHOP';
    const sigClass = getSignalClass(sig);
    const sym = p.Symbol || '';
    const cleanSym = sym.replace('.NS', '');

    const pUp = Number(p.p_up || 0.33);
    const pHold = Number(p.p_hold || 0.34);
    const pDown = Number(p.p_down || 0.33);
    const conv = Number(p.conviction || 0);

    html += `
      <tr>
        <td>
          <button class="ticker-link" onclick="openChartFor('${esc(sym)}')">${esc(cleanSym)}</button>
        </td>
        <td class="num mono">${fmtPrice(p.Close)}</td>
        <td class="num mono ${chgClass}">${fmtPct(chg)}</td>
        <td><span class="signal-tag ${sigClass}">${esc(sig)}</span></td>
        <td>
          <div class="prob-cell">
            <div class="prob-track"><div class="prob-bar" style="width:${Math.round(pUp * 100)}%;background:var(--up);"></div></div>
            <span class="prob-num val-up">${(pUp * 100).toFixed(0)}%</span>
          </div>
        </td>
        <td>
          <div class="prob-cell">
            <div class="prob-track"><div class="prob-bar" style="width:${Math.round(pHold * 100)}%;background:var(--warn);"></div></div>
            <span class="prob-num val-warn">${(pHold * 100).toFixed(0)}%</span>
          </div>
        </td>
        <td>
          <div class="prob-cell">
            <div class="prob-track"><div class="prob-bar" style="width:${Math.round(pDown * 100)}%;background:var(--down);"></div></div>
            <span class="prob-num val-down">${(pDown * 100).toFixed(0)}%</span>
          </div>
        </td>
        <td class="num mono ${conv >= 0 ? 'val-up' : 'val-down'}">${conv >= 0 ? '+' : ''}${conv.toFixed(3)}</td>
        <td class="num mono">${p.RSI14 !== undefined ? Number(p.RSI14).toFixed(1) : '—'}</td>
        <td class="num mono">${p.Vol20d !== undefined ? fmtPct(p.Vol20d, 1) : '—'}</td>
        <td class="num mono ${(p.SMA20Dist || 0) >= 0 ? 'val-up' : 'val-down'}">${fmtPct(p.SMA20Dist || 0)}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function openChartFor(symbol) {
  state.symbol = symbol;
  switchTab('chartlab');
}

/**
 * Unified Model Performance & Consensus Table
 * Combines audited backtest performance metrics with cross-model consensus.
 */
async function loadModelEvaluation() {
  const container = document.getElementById('modelEvalWrap');
  if (!container) return;

  try {
    const [topData, consensusData] = await Promise.all([
      api('/api/top-models'),
      api('/api/all-models-comparison')
    ]);

    const models = topData.models || [];
    const stocks = consensusData.stocks || [];

    let html = `
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-1);text-transform:uppercase;margin-bottom:6px;">
          Audited Model Specifications &amp; In-Sample Performance
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Model Name</th>
              <th>Architecture</th>
              <th class="num">Win Rate</th>
              <th class="num">Profit Factor</th>
              <th class="num">Max Drawdown</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>`;

    models.forEach(m => {
      const isSelected = state.model === m.id;
      html += `
        <tr style="${isSelected ? 'background:rgba(56,189,248,0.06);' : ''}">
          <td class="mono">#${esc(m.rank)}</td>
          <td style="font-weight:600;">${esc(m.name)}</td>
          <td class="mono" style="color:var(--text-1);">${esc(m.architecture)}</td>
          <td class="num mono val-up">${m.win_rate_pct !== undefined ? m.win_rate_pct.toFixed(1) + '%' : '—'}</td>
          <td class="num mono">${m.profit_factor !== undefined ? m.profit_factor.toFixed(2) : '—'}</td>
          <td class="num mono val-down">${m.max_drawdown_pct !== undefined ? '-' + m.max_drawdown_pct.toFixed(1) + '%' : '—'}</td>
          <td>${isSelected ? '<span class="signal-tag buy">ACTIVE</span>' : '<span class="val-neutral">Standby</span>'}</td>
        </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-1);text-transform:uppercase;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
          <span>Cross-Model Signal Agreement &amp; Predictive Performance</span>
          <span style="font-size:10px;color:var(--text-2);font-weight:normal;text-transform:none;">Evaluated strictly on unseen out-of-sample test data</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th class="num">LTP</th>
              <th class="num">1D Chg</th>
              <th>Logistic Reg.</th>
              <th>Random Forest</th>
              <th>LightGBM</th>
              <th>Consensus Verdict</th>
              <th title="Recommendation based solely on validated out-of-sample predictive accuracy, independent of trading PnL" style="cursor:help;">BEST PREDICTING MODEL</th>
            </tr>
          </thead>
          <tbody>`;

    stocks.forEach(st => {
      const symClean = String(st.symbol).replace('.NS', '');
      const close = Number(st.close || 0);
      const chg = Number(st.change_1d || 0);
      const chgClass = chg > 0 ? 'val-up' : chg < 0 ? 'val-down' : 'val-neutral';

      function renderModelCell(key) {
        const m = (st.models && st.models[key]) || {};
        const sig = m.signal || 'WAIT';
        const pUp = m.p_up !== undefined ? (m.p_up * 100).toFixed(0) : '—';
        const acc = m.directional_accuracy_pct !== undefined ? `<span class="mono" style="font-size:10px;color:var(--text-2);display:block;margin-top:2px;">${m.directional_accuracy_pct.toFixed(1)}% acc</span>` : '';
        return `<td><span class="signal-tag ${getSignalClass(sig)}">${esc(sig.split('/')[0].trim())}</span> <span class="mono" style="font-size:11px;color:var(--text-2);margin-left:4px;">${pUp}%</span>${acc}</td>`;
      }

      const rec = st.best_predicting_model || {};
      const winner = rec.winner || 'Similar Performance';
      const tooltip = rec.tooltip || 'Dynamically evaluated on out-of-sample data, strictly independent of trading PnL.';
      const isSimilar = winner.includes('Similar') || rec.status === 'TIED';
      const badgeStyle = isSimilar 
        ? 'background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.3);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;cursor:help;display:inline-block;'
        : 'background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;cursor:help;display:inline-block;';

      html += `
        <tr>
          <td><button class="ticker-link" onclick="openChartFor('${esc(st.symbol)}')">${esc(symClean)}</button></td>
          <td class="num mono">${fmtPrice(close)}</td>
          <td class="num mono ${chgClass}">${fmtPct(chg)}</td>
          ${renderModelCell('logistic_regression')}
          ${renderModelCell('random_forest')}
          ${renderModelCell('lightgbm')}
          <td><span class="signal-tag ${getSignalClass(st.consensus)}">${esc(st.consensus || 'NEUTRAL')}</span></td>
          <td><span style="${badgeStyle}" title="${esc(tooltip)}">★ ${esc(winner)}</span></td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `
      <div class="state-message state-error">
        Failed to load model evaluation data: ${esc(err.message)}
      </div>`;
  }
}


/* ==========================================================================
   7. View: Chart Lab (Candlesticks, Oscillators, and Prediction Readout)
   ========================================================================== */

function buildStockSelector() {
  const container = document.getElementById('stockList');
  container.innerHTML = '';
  UNIVERSE.forEach(sym => {
    const btn = document.createElement('button');
    btn.className = 'stock-select-btn' + (sym === state.symbol ? ' active' : '');
    btn.id = 'stock-btn-' + sym.replace('.NS', '');
    btn.innerHTML = `<span>${esc(sym.replace('.NS', ''))}</span><span style="color:var(--text-2);">${esc(STOCK_NAMES[sym] || '')}</span>`;
    btn.onclick = () => selectStock(sym);
    container.appendChild(btn);
  });
}

function selectStock(sym) {
  state.symbol = sym;
  document.querySelectorAll('.stock-select-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('stock-btn-' + sym.replace('.NS', ''));
  if (activeBtn) activeBtn.classList.add('active');

  loadStockChart(sym);
  loadStockPrediction(sym);
}

function setPeriod(p, btn) {
  document.querySelectorAll('.period-bar .btn-toggle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.period = p;
  loadStockChart(state.symbol);
}

function toggleIndicator(ind, btn) {
  btn.classList.toggle('active');
  state.indicators[ind] = btn.classList.contains('active');

  // Toggle oscillator rows visibility
  const oscRow = document.getElementById('oscillatorsRow');
  if (oscRow) {
    oscRow.style.display = (state.indicators.rsi || state.indicators.macd) ? 'grid' : 'none';
  }
  loadStockChart(state.symbol);
}

const chartThemeBase = {
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    animations: { enabled: false }
  },
  theme: { mode: 'dark' },
  grid: { borderColor: '#192030', strokeDashArray: 2 },
  xaxis: {
    type: 'datetime',
    labels: { style: { colors: '#526077', fontSize: '10px' }, datetimeUTC: false }
  },
  tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } }
};

async function loadStockChart(sym) {
  const currentToken = ++activeChartToken;
  document.getElementById('chartStockName').textContent = `${sym.replace('.NS', '')} — ${STOCK_NAMES[sym] || ''}`;
  document.getElementById('chartStockMeta').textContent = 'Loading historical data…';

  try {
    const data = await api(`/api/stock-history/${sym}?period=${state.period}`);
    if (currentToken !== activeChartToken) return; // Stale request discarded

    document.getElementById('chartStockPrice').textContent = fmtPrice(data.latest_close);
    const chgEl = document.getElementById('chartStockChange');
    const chg = Number(data.latest_change_1d || 0);
    chgEl.textContent = fmtPct(chg);
    chgEl.className = 'stat-val ' + (chg >= 0 ? 'val-up' : 'val-down');
    document.getElementById('chartStockMeta').textContent = `As of ${data.latest_date || 'latest session'}`;

    renderCandleAndOverlays(data);
    renderVolumeChart(data);

    if (state.indicators.rsi) renderRSIChart(data);
    if (state.indicators.macd) renderMACDChart(data);

  } catch (err) {
    if (currentToken !== activeChartToken) return;
    toast('Chart load error: ' + err.message, 'error');
    document.getElementById('chartStockMeta').textContent = 'Error loading historical prices.';
  }
}

function renderCandleAndOverlays(d) {
  const series = [{ name: 'OHLC', type: 'candlestick', data: d.candles || [] }];
  const widths = [1];
  const colors = ['transparent'];

  if (state.indicators.sma && d.sma20 && d.sma20.length) {
    series.push({ name: 'SMA 20', type: 'line', data: d.sma20 });
    widths.push(1.5);
    colors.push('#38bdf8');
  }
  if (state.indicators.sma && d.sma50 && d.sma50.length) {
    series.push({ name: 'SMA 50', type: 'line', data: d.sma50 });
    widths.push(1.5);
    colors.push('#94a3b8');
  }
  if (state.indicators.bb && d.bb_upper && d.bb_upper.length) {
    series.push({ name: 'BB Upper', type: 'line', data: d.bb_upper });
    widths.push(1);
    colors.push('rgba(245, 158, 11, 0.5)');
    series.push({ name: 'BB Lower', type: 'line', data: d.bb_lower });
    widths.push(1);
    colors.push('rgba(245, 158, 11, 0.5)');
  }

  if (charts.candle) {
    charts.candle.destroy();
    charts.candle = null;
  }

  charts.candle = new ApexCharts(document.getElementById('chartCandleEl'), {
    ...chartThemeBase,
    series,
    chart: { ...chartThemeBase.chart, type: 'line', height: 320, id: 'chart-main-candle' },
    plotOptions: {
      candlestick: {
        colors: { upward: '#10b981', downward: '#ef4444' },
        wick: { useFillColor: true }
      }
    },
    stroke: { width: widths, colors },
    legend: { show: true, labels: { colors: '#94a3b8' }, position: 'top', horizontalAlign: 'right' },
    yaxis: {
      labels: {
        style: { colors: '#526077', fontSize: '10px' },
        formatter: v => '₹' + Math.round(v).toLocaleString('en-IN')
      }
    }
  });
  charts.candle.render();
}

function renderVolumeChart(d) {
  if (charts.volume) {
    charts.volume.destroy();
    charts.volume = null;
  }

  charts.volume = new ApexCharts(document.getElementById('chartVolumeEl'), {
    ...chartThemeBase,
    series: [{ name: 'Volume', data: d.volume || [] }],
    chart: {
      ...chartThemeBase.chart,
      type: 'bar',
      height: 70,
      brush: { target: 'chart-main-candle', enabled: true },
      selection: { enabled: true }
    },
    plotOptions: { bar: { columnWidth: '85%' } },
    colors: ['#232a3d'],
    xaxis: { ...chartThemeBase.xaxis, labels: { show: false } },
    yaxis: { labels: { show: false } },
    legend: { show: false }
  });
  charts.volume.render();
}

function renderRSIChart(d) {
  const el = document.getElementById('chartRsiEl');
  if (charts.rsi) { charts.rsi.destroy(); charts.rsi = null; }
  if (!state.indicators.rsi) { el.innerHTML = ''; return; }

  charts.rsi = new ApexCharts(el, {
    ...chartThemeBase,
    series: [{ name: 'RSI 14', data: d.rsi || [] }],
    chart: { ...chartThemeBase.chart, type: 'line', height: 110 },
    stroke: { width: 1.5, colors: ['#38bdf8'] },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 2,
      labels: { style: { colors: '#526077', fontSize: '10px' } }
    },
    annotations: {
      yaxis: [
        { y: 70, borderColor: '#ef4444', strokeDashArray: 2 },
        { y: 30, borderColor: '#10b981', strokeDashArray: 2 }
      ]
    }
  });
  charts.rsi.render();
}

function renderMACDChart(d) {
  const el = document.getElementById('chartMacdEl');
  if (charts.macd) { charts.macd.destroy(); charts.macd = null; }
  if (!state.indicators.macd) { el.innerHTML = ''; return; }

  charts.macd = new ApexCharts(el, {
    ...chartThemeBase,
    series: [
      { name: 'MACD', type: 'line', data: d.macd || [] },
      { name: 'Signal', type: 'line', data: d.macd_signal || [] },
      { name: 'Histogram', type: 'bar', data: d.macd_hist || [] }
    ],
    chart: { ...chartThemeBase.chart, type: 'line', height: 110 },
    stroke: { width: [1.5, 1.5, 0] },
    colors: ['#38bdf8', '#f59e0b', '#222a3d'],
    yaxis: { labels: { style: { colors: '#526077', fontSize: '10px' } } },
    legend: { show: false }
  });
  charts.macd.render();
}

async function loadStockPrediction(sym) {
  const currentToken = ++activePredToken;
  const container = document.getElementById('stockPredReadout');
  container.innerHTML = '<div class="state-message">Updating model inference…</div>';

  try {
    const data = await api(`/api/stock-predictions/${sym}`);
    if (currentToken !== activePredToken) return;

    const preds = data.model_predictions || [];
    const active = preds.find(p => p.model === state.model) || preds[0] || {};
    const sigClass = getSignalClass(active.signal);

    let html = `
      <div class="pred-headline">
        <div>
          <span style="font-size:11px;color:var(--text-2);text-transform:uppercase;font-weight:600;">Active Forecast (${esc(active.label || state.model)}):</span>
          <span class="signal-tag ${sigClass}" style="margin-left:8px;font-size:12px;padding:3px 8px;">${esc(active.signal || 'HOLD')}</span>
        </div>
        <div class="stat-item">
          <span class="stat-lbl">Conviction:</span>
          <span class="stat-val mono ${active.conviction >= 0 ? 'val-up' : 'val-down'}">${active.conviction !== undefined ? (active.conviction >= 0 ? '+' : '') + active.conviction.toFixed(3) : '—'}</span>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Signal</th>
            <th class="num">P(UP)</th>
            <th class="num">P(HOLD)</th>
            <th class="num">P(DOWN)</th>
            <th class="num">Conviction</th>
          </tr>
        </thead>
        <tbody>`;

    preds.forEach(p => {
      const isCur = p.model === state.model;
      html += `
        <tr style="${isCur ? 'background:rgba(56,189,248,0.06);font-weight:600;' : ''}">
          <td>${esc(p.label || p.model)}</td>
          <td><span class="signal-tag ${getSignalClass(p.signal)}">${esc(p.signal)}</span></td>
          <td class="num mono val-up">${fmtProb(p.p_up)}</td>
          <td class="num mono val-warn">${fmtProb(p.p_hold)}</td>
          <td class="num mono val-down">${fmtProb(p.p_down)}</td>
          <td class="num mono">${p.conviction !== undefined ? p.conviction.toFixed(3) : '—'}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    if (currentToken !== activePredToken) return;
    container.innerHTML = `<div class="state-message state-error">Inference unavailable: ${esc(err.message)}</div>`;
  }
}


/* ==========================================================================
   8. View: Backtest (Equity Curves & Strategy Comparison)
   ========================================================================== */

async function loadBacktest() {
  const tableWrap = document.getElementById('backtestTableWrap');
  try {
    const [curves, summary] = await Promise.all([
      api('/api/equity-curves'),
      api('/api/backtest-strategies')
    ]);
    cache.backtest = { curves, summary };

    renderEquityCurves(curves);
    renderStrategySummary(summary);
  } catch (err) {
    tableWrap.innerHTML = `
      <div class="state-message state-error">
        Failed to load backtest data: ${esc(err.message)}
        <div style="margin-top:8px;"><button class="btn" onclick="loadBacktest()">Retry</button></div>
      </div>`;
    toast('Backtest load error: ' + err.message, 'error');
  }
}

function renderEquityCurves(curves) {
  if (charts.equity) {
    charts.equity.destroy();
    charts.equity = null;
  }

  const series = (curves.series || []).map(s => ({
    name: s.name,
    data: (curves.dates || []).map((date, idx) => ({
      x: new Date(date).getTime(),
      y: s.data[idx]
    }))
  }));

  charts.equity = new ApexCharts(document.getElementById('chartEquityEl'), {
    ...chartThemeBase,
    series,
    chart: { ...chartThemeBase.chart, type: 'line', height: 350 },
    stroke: { width: 1.5, curve: 'straight' },
    colors: ['#526077', '#38bdf8', '#10b981', '#f59e0b', '#ef4444'],
    legend: { show: true, labels: { colors: '#94a3b8' }, position: 'top', horizontalAlign: 'left' },
    yaxis: {
      labels: {
        style: { colors: '#526077', fontSize: '10px' },
        formatter: v => '₹' + Math.round(v).toLocaleString('en-IN')
      }
    }
  });
  charts.equity.render();
}

function renderStrategySummary(summary) {
  const wrap = document.getElementById('backtestTableWrap');
  const items = summary.strategies || [];
  if (!items.length) {
    wrap.innerHTML = '<div class="state-message">No strategy results found.</div>';
    return;
  }

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Strategy</th>
          <th class="num">Total Return</th>
          <th class="num">Annualized</th>
          <th class="num">Sharpe Ratio</th>
          <th class="num">Max Drawdown</th>
          <th class="num">Win Rate</th>
          <th class="num">Trades</th>
          <th class="num">Final Capital</th>
        </tr>
      </thead>
      <tbody>`;

  items.forEach(s => {
    const tot = Number(s.total_return_pct || 0);
    const ann = Number(s.annualized_return_pct || 0);
    const sharpe = Number(s.sharpe_ratio || 0);
    const dd = Number(s.max_drawdown_pct || 0);

    html += `
      <tr>
        <td style="font-weight:600;">${esc(s.strategy_name || s.name || 'Strategy')}</td>
        <td class="num mono ${tot >= 0 ? 'val-up' : 'val-down'}">${fmtPct(tot)}</td>
        <td class="num mono ${ann >= 0 ? 'val-up' : 'val-down'}">${fmtPct(ann)}</td>
        <td class="num mono ${sharpe > 1.0 ? 'val-up' : 'val-neutral'}">${sharpe.toFixed(2)}</td>
        <td class="num mono val-down">-${Math.abs(dd).toFixed(2)}%</td>
        <td class="num mono">${s.win_rate !== undefined ? (s.win_rate * 100).toFixed(1) + '%' : '—'}</td>
        <td class="num mono">${s.total_trades !== undefined ? s.total_trades : '—'}</td>
        <td class="num mono">${fmtPrice(s.final_portfolio_value || 100000)}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}


/* ==========================================================================
   9. View: Blotter (Execution Records & Filters)
   ========================================================================== */

async function loadBlotter() {
  const body = document.getElementById('blotterTableBody');
  try {
    const data = await api('/api/trade-blotter');
    cache.blotter = data;
    state.blotter = data.trades || [];
    document.getElementById('blotterCount').textContent = `${state.blotter.length} executions recorded`;
    filterAndRenderBlotter();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="12" class="state-message state-error">Failed to load trades: ${esc(err.message)}</td></tr>`;
    toast('Blotter load error: ' + err.message, 'error');
  }
}

function filterAndRenderBlotter() {
  const query = (document.getElementById('blotterSearch').value || '').toLowerCase().trim();
  const dirFilter = document.getElementById('blotterDir').value;

  const filtered = state.blotter.filter(t => {
    const sym = String(t.Symbol || t.symbol || '').toLowerCase();
    const dir = String(t.Direction || t.direction || '').toUpperCase();
    const matchSym = !query || sym.includes(query);
    const matchDir = !dirFilter || dir === dirFilter;
    return matchSym && matchDir;
  });

  renderBlotterRows(filtered);
}

function renderBlotterRows(trades) {
  const thead = document.getElementById('blotterTableHead');
  const tbody = document.getElementById('blotterTableBody');

  if (!trades.length) {
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="12" class="state-message">No trades match specified filter criteria.</td></tr>';
    return;
  }

  const columns = Object.keys(trades[0]).filter(k => k && k !== 'null');
  thead.innerHTML = '<tr>' + columns.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>';

  tbody.innerHTML = trades.map(t => {
    return '<tr>' + columns.map(col => {
      const v = t[col];
      const valStr = (v !== null && v !== undefined) ? String(v) : '—';

      if (col === 'Direction' || col === 'direction') {
        const isLong = valStr.toUpperCase() === 'LONG';
        return `<td><span class="signal-tag ${isLong ? 'buy' : 'sell'}">${esc(valStr)}</span></td>`;
      }
      if (col === 'PnL' || col === 'pnl' || col === 'Profit' || col === 'Return') {
        const n = parseFloat(v);
        const cls = !isNaN(n) ? (n >= 0 ? 'val-up' : 'val-down') : '';
        return `<td class="num mono ${cls}">${esc(valStr)}</td>`;
      }
      if (typeof v === 'number') {
        return `<td class="num mono">${esc(valStr)}</td>`;
      }
      return `<td>${esc(valStr)}</td>`;
    }).join('') + '</tr>';
  }).join('');
}


/* ==========================================================================
   10. View: Audit (Data Integrity Checks & Feature Importance)
   ========================================================================== */

async function loadAudit() {
  try {
    const [checks, feats] = await Promise.all([
      api('/api/validation-checks'),
      api('/api/feature-importance')
    ]);
    cache.audit = { checks, feats };

    renderAuditChecks(checks);
    renderFeatureImportance(feats);
  } catch (err) {
    document.getElementById('auditListEl').innerHTML = `
      <div class="state-message state-error">Failed to load audit verification: ${esc(err.message)}</div>`;
    toast('Audit load error: ' + err.message, 'error');
  }
}

function renderAuditChecks(d) {
  const container = document.getElementById('auditListEl');
  const countEl = document.getElementById('auditSummaryBadge');
  countEl.textContent = `${d.passed_count || 0} Passed / ${d.failed_count || 0} Failed (${d.total_checks || 0} Total)`;

  const items = d.checks || [];
  if (!items.length) {
    container.innerHTML = '<div class="state-message">No audit check logs found.</div>';
    return;
  }

  container.innerHTML = items.map(c => {
    const isPass = c.status === 'PASS';
    return `
      <div class="audit-item">
        <span class="audit-badge ${isPass ? 'pass' : 'fail'}">${isPass ? 'PASS' : 'FAIL'}</span>
        <span style="font-weight:600;color:var(--text-0);">${esc(c.check_name)}</span>
        <span style="color:var(--text-2);margin-left:auto;" class="mono">${esc(c.detail || '')}</span>
      </div>`;
  }).join('');
}

function renderFeatureImportance(d) {
  if (charts.features) {
    charts.features.destroy();
    charts.features = null;
  }

  const features = d.features || [];
  const gains = d.importance_gain || [];
  const paired = features.map((f, i) => ({ f, g: gains[i] || 0 }))
    .sort((a, b) => b.g - a.g)
    .slice(0, 20);

  charts.features = new ApexCharts(document.getElementById('chartFeaturesEl'), {
    ...chartThemeBase,
    series: [{ name: 'Importance Gain', data: paired.map(p => p.g) }],
    chart: { ...chartThemeBase.chart, type: 'bar', height: 420 },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '65%',
        borderRadius: 2
      }
    },
    colors: ['#38bdf8'],
    xaxis: { categories: paired.map(p => p.f) },
    yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
    dataLabels: { enabled: false }
  });
  charts.features.render();
}


/* ==========================================================================
   11. Event Wiring & Bootstrap
   ========================================================================== */

function onModelChanged() {
  const sel = document.getElementById('globalModelSelect');
  state.model = sel.value;
  refreshPredictions(false);
  loadModelEvaluation();
  if (document.getElementById('tab-chartlab').classList.contains('active')) {
    loadStockPrediction(state.symbol);
  }
}

function initTerminal() {
  initClock();
  checkSystemStatus();

  // Model selector event
  document.getElementById('globalModelSelect').addEventListener('change', onModelChanged);

  // Tab switcher events
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  // Blotter filter events
  document.getElementById('blotterSearch').addEventListener('input', filterAndRenderBlotter);
  document.getElementById('blotterDir').addEventListener('change', filterAndRenderBlotter);

  // Initial data ingestion
  refreshPredictions(false);
  loadModelEvaluation();
}

window.addEventListener('DOMContentLoaded', initTerminal);

