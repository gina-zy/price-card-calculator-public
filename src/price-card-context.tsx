import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { priceCardApi } from "./api";
import { BUILTIN_PRICE_CARD_VERSION, OFFICIAL_PRICE_CARDS, SERVICE_PRICE_CARDS } from "./data/price-card-seed";
import { DEFAULT_EXCHANGE_RATES, normalizeExchangeRates, type ExchangeRates } from "./lib/exchange-rates";
import type { OfficialPriceCard, PriceCardVersion, ServicePriceCard } from "./types";

const RATE_KEY = "price-card-calculator:exchange-rates:v1";
type Data = { serviceCards: ServicePriceCard[]; officialCards: OfficialPriceCard[]; exchangeRates: ExchangeRates; version: PriceCardVersion };
type Value = Data & { loading: boolean; error: string | null; refresh: () => Promise<void> };
const Context = createContext<Value | null>(null);

function defaults(): Data {
  const exchangeRates = { ...DEFAULT_EXCHANGE_RATES };
  try {
    const stored = localStorage.getItem(RATE_KEY);
    if (stored) Object.assign(exchangeRates, normalizeExchangeRates(JSON.parse(stored)));
  } catch { /* Keep built-in rates. */ }
  return { serviceCards: structuredClone(SERVICE_PRICE_CARDS), officialCards: structuredClone(OFFICIAL_PRICE_CARDS), exchangeRates, version: BUILTIN_PRICE_CARD_VERSION };
}

export function PriceCardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setLoading(true);
    try {
      const current = await priceCardApi.current();
      setData((old) => ({ ...old, serviceCards: current.serviceCards, officialCards: current.officialCards, version: current }));
      setError(null);
    } catch {
      setError("loadFailed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);
  const value = useMemo<Value>(() => ({ ...data, loading, error, refresh }), [data, loading, error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePriceCards() {
  const value = useContext(Context);
  if (!value) throw new Error("usePriceCards must be used inside PriceCardProvider");
  return value;
}
