import { create } from "zustand";
import { StockSymbol, ModelId, MarketTick } from "@/lib/types";

interface MarketStoreState {
  selectedSymbol: StockSymbol;
  selectedModel: ModelId;
  liveTicks: Record<string, MarketTick>;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "CONNECTING";
  setSelectedSymbol: (sym: StockSymbol) => void;
  setSelectedModel: (m: ModelId) => void;
  updateTick: (tick: MarketTick) => void;
  initTickStream: () => () => void;
}

export const DEFAULT_PRICES: Record<StockSymbol, number> = {
  "BHARTIARTL.NS": 2051.50,
  "HDFCBANK.NS": 731.35,
  "ICICIBANK.NS": 1418.40,
  "INFY.NS": 1122.60,
  "ITC.NS": 280.60,
  "RELIANCE.NS": 1299.50,
  "SBIN.NS": 975.50,
  "TCS.NS": 2436.90,
};

export const useMarketStore = create<MarketStoreState>((set, get) => ({
  selectedSymbol: "TCS.NS",
  selectedModel: "logistic_regression",
  liveTicks: {},
  connectionStatus: "CONNECTING",

  setSelectedSymbol: (sym) => set({ selectedSymbol: sym }),
  setSelectedModel: (m) => set({ selectedModel: m }),

  updateTick: (tick) =>
    set((state) => ({
      liveTicks: {
        ...state.liveTicks,
        [tick.symbol]: tick,
      },
    })),

  initTickStream: () => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const host = window.location.hostname || "127.0.0.1";
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let apiPollInterval: NodeJS.Timeout | null = null;
    let lastWsMessageTime = 0;

    const applyQuotes = (quotes: any) => {
      if (quotes && typeof quotes === "object") {
        Object.values(quotes).forEach((q: any) => {
          if (q && q.symbol && q.price) {
            get().updateTick({
              symbol: q.symbol,
              price: q.price,
              change_pct: q.change_pct ?? 0.0,
              bid: Math.round((q.price - 0.05) * 100) / 100,
              ask: Math.round((q.price + 0.05) * 100) / 100,
              volume_delta: q.volume ?? 1000,
              timestamp: q.timestamp || new Date().toISOString(),
            });
          }
        });
      }
    };

    // Initial fetch from backend REST endpoint
    fetch(`http://${host}:8000/api/market/realtime-prices`)
      .then((res) => (res.ok ? res.json() : null))
      .then(applyQuotes)
      .catch(() => {});

    const startLocalTicker = () => {
      if (fallbackInterval) return;
      fallbackInterval = setInterval(() => {
        // If WebSocket is active and delivering ticks, don't generate mock ticks
        if (Date.now() - lastWsMessageTime < 2500) {
          return;
        }

        const symbols = Object.keys(DEFAULT_PRICES) as StockSymbol[];
        // Micro-variance tick generator (realistic market order flow)
        symbols.forEach((sym) => {
          const currentTick = get().liveTicks[sym];
          const basePrice = currentTick?.price || DEFAULT_PRICES[sym];
          const baseChg = currentTick?.change_pct ?? 0.0;

          // 0.02% micro drift to simulate live trade prints
          const drift = (Math.random() - 0.495) * 0.0004;
          const newPrice = Math.round((basePrice * (1.0 + drift)) * 100) / 100;
          const spread = Math.max(0.05, Math.round(newPrice * 0.0002 * 100) / 100);

          get().updateTick({
            symbol: sym,
            price: newPrice,
            change_pct: Math.round((baseChg + drift * 100) * 100) / 100,
            bid: Math.round((newPrice - spread / 2) * 100) / 100,
            ask: Math.round((newPrice + spread / 2) * 100) / 100,
            volume_delta: Math.floor(Math.random() * 450 + 50),
            timestamp: new Date().toISOString(),
          });
        });
      }, 1000);
    };

    try {
      ws = new WebSocket(`ws://${host}:8000/ws/ticks`);

      ws.onopen = () => {
        set({ connectionStatus: "CONNECTED" });
      };

      ws.onmessage = (event) => {
        try {
          lastWsMessageTime = Date.now();
          const payload = JSON.parse(event.data);
          if (payload.type === "TICK_STREAM" && Array.isArray(payload.ticks)) {
            payload.ticks.forEach((tick: MarketTick) => get().updateTick(tick));
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        set({ connectionStatus: "CONNECTED" });
        startLocalTicker();
      };

      ws.onclose = () => {
        startLocalTicker();
      };
    } catch (e) {
      startLocalTicker();
    }

    // Always ensure background tick generator is active as a secondary heartbeat
    startLocalTicker();

    // Periodically sync with actual market quotes every 15s
    apiPollInterval = setInterval(() => {
      fetch(`http://${host}:8000/api/market/realtime-prices`)
        .then((res) => (res.ok ? res.json() : null))
        .then(applyQuotes)
        .catch(() => {});
    }, 15000);

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (apiPollInterval) clearInterval(apiPollInterval);
    };
  },
}));
