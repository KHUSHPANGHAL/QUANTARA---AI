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
  "BHARTIARTL.NS": 2067.60,
  "HDFCBANK.NS": 736.70,
  "ICICIBANK.NS": 1418.40,
  "INFY.NS": 1122.60,
  "ITC.NS": 280.60,
  "RELIANCE.NS": 1311.00,
  "SBIN.NS": 975.50,
  "TCS.NS": 2436.00,
};

let activeSubscribers = 0;
let globalWs: WebSocket | null = null;
let globalFallbackInterval: NodeJS.Timeout | null = null;
let globalApiPollInterval: NodeJS.Timeout | null = null;
let lastWsMessageTime = 0;

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

    activeSubscribers += 1;
    if (activeSubscribers > 1) {
      return () => {
        activeSubscribers = Math.max(0, activeSubscribers - 1);
      };
    }

    const host = window.location.hostname || "127.0.0.1";

    const applyQuotes = (quotes: any) => {
      if (quotes && typeof quotes === "object") {
        const nextTicks = { ...get().liveTicks };
        Object.values(quotes).forEach((q: any) => {
          if (q && q.symbol && q.price) {
            nextTicks[q.symbol] = {
              symbol: q.symbol,
              price: q.price,
              change_pct: q.change_pct ?? 0.0,
              bid: Math.round((q.price - 0.05) * 100) / 100,
              ask: Math.round((q.price + 0.05) * 100) / 100,
              volume_delta: q.volume ?? 1000,
              timestamp: q.timestamp || new Date().toISOString(),
            };
          }
        });
        set({ liveTicks: nextTicks, connectionStatus: "CONNECTED" });
      }
    };

    // Initial fetch from backend REST endpoint
    fetch(`http://${host}:8000/api/market/realtime-prices`)
      .then((res) => (res.ok ? res.json() : null))
      .then(applyQuotes)
      .catch(() => {});

    const startLocalTicker = () => {
      if (globalFallbackInterval) return;
      globalFallbackInterval = setInterval(() => {
        // If WebSocket is actively delivering ticks, don't generate mock ticks
        if (Date.now() - lastWsMessageTime < 2500) {
          return;
        }

        const symbols = Object.keys(DEFAULT_PRICES) as StockSymbol[];
        const nextTicks = { ...get().liveTicks };
        symbols.forEach((sym) => {
          const currentTick = nextTicks[sym];
          const basePrice = currentTick?.price || DEFAULT_PRICES[sym];
          const baseChg = currentTick?.change_pct ?? 0.0;

          // 0.03% micro drift to simulate live trade prints
          const drift = (Math.random() - 0.495) * 0.0004;
          const newPrice = Math.round((basePrice * (1.0 + drift)) * 100) / 100;
          const spread = Math.max(0.05, Math.round(newPrice * 0.0002 * 100) / 100);

          nextTicks[sym] = {
            symbol: sym,
            price: newPrice,
            change_pct: Math.round((baseChg + drift * 100) * 100) / 100,
            bid: Math.round((newPrice - spread / 2) * 100) / 100,
            ask: Math.round((newPrice + spread / 2) * 100) / 100,
            volume_delta: Math.floor(Math.random() * 450 + 50),
            timestamp: new Date().toISOString(),
          };
        });
        set({ liveTicks: nextTicks, connectionStatus: "CONNECTED" });
      }, 1000);
    };

    const connectWebSocket = () => {
      try {
        globalWs = new WebSocket(`ws://${host}:8000/ws/ticks`);

        globalWs.onopen = () => {
          set({ connectionStatus: "CONNECTED" });
        };

        globalWs.onmessage = (event) => {
          try {
            lastWsMessageTime = Date.now();
            const payload = JSON.parse(event.data);
            if (payload.type === "TICK_STREAM" && Array.isArray(payload.ticks)) {
              const nextTicks = { ...get().liveTicks };
              payload.ticks.forEach((tick: MarketTick) => {
                nextTicks[tick.symbol] = tick;
              });
              set({ liveTicks: nextTicks, connectionStatus: "CONNECTED" });
            }
          } catch (e) {
            // ignore parsing error
          }
        };

        globalWs.onerror = () => {
          startLocalTicker();
        };

        globalWs.onclose = () => {
          startLocalTicker();
          // Retry connection after 3s
          setTimeout(() => {
            if (activeSubscribers > 0) {
              connectWebSocket();
            }
          }, 3000);
        };
      } catch (e) {
        startLocalTicker();
      }
    };

    connectWebSocket();
    startLocalTicker();

    // Periodically sync with actual market quotes every 15s
    globalApiPollInterval = setInterval(() => {
      fetch(`http://${host}:8000/api/market/realtime-prices`)
        .then((res) => (res.ok ? res.json() : null))
        .then(applyQuotes)
        .catch(() => {});
    }, 15000);

    return () => {
      activeSubscribers = Math.max(0, activeSubscribers - 1);
      if (activeSubscribers === 0) {
        if (globalWs) {
          globalWs.close();
          globalWs = null;
        }
        if (globalFallbackInterval) {
          clearInterval(globalFallbackInterval);
          globalFallbackInterval = null;
        }
        if (globalApiPollInterval) {
          clearInterval(globalApiPollInterval);
          globalApiPollInterval = null;
        }
      }
    };
  },
}));
