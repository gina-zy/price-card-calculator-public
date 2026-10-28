import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { BUILTIN_PRICE_CARD_VERSION, OFFICIAL_PRICE_CARDS, SERVICE_PRICE_CARDS } from "./data/price-card-seed";
import { DEFAULT_EXCHANGE_RATES, normalizeExchangeRates, type ExchangeRates } from "./lib/exchange-rates";
import type { OfficialPriceCard, PriceCardVersion, ServicePriceCard } from "./types";

const RATE_KEY = "price-card-calculator:exchange-rates:v1";
type Data = { serviceCards: ServicePriceCard[]; officialCards: OfficialPriceCard[]; exchangeRates: ExchangeRates; version: PriceCardVersion };
type Value = Data & { loading: false; error: null; refresh: () => Promise<void> };
const Context = createContext<Value | null>(null);

function defaults(): Data {
  const exchangeRates = { ...DEFAULT_EXCHANGE_RATES };
  try {
    const stored = localStorage.getItem(RATE_KEY);
    if (stored) Object.assign(exchangeRates, normalizeExchangeRates(JSON.parse(stored)));
  } catch { /* Keep built-in rates. */ }
  return {
    serviceCards: structuredClone(SERVICE_PRICE_CARDS),
    officialCards: structuredClone(OFFICIAL_PRICE_CARDS),
    exchangeRates,
    version: BUILTIN_PRICE_CARD_VERSION,
  };
}

export function PriceCardProvider({ children }: { children: ReactNode }) {
  const [data] = useState<Data>(defaults);
  const value = useMemo<Value>(() => ({ ...data, loading: false, error: null, refresh: async () => undefined }), [data]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePriceCards() {
  const value = useContext(Context);
  if (!value) throw new Error("usePriceCards must be used inside PriceCardProvider");
  return value;
}
