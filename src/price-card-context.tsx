import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { priceCardApi } from "./api";
import { BUILTIN_PRICE_CARD_VERSION, OFFICIAL_PRICE_CARDS, SERVICE_PRICE_CARDS } from "./data/price-card-seed";
import { DEFAULT_EXCHANGE_RATES, normalizeExchangeRates, type ExchangeRates } from "./lib/exchange-rates";
import type { OfficialPriceCard, PriceCardVersion, ServicePriceCard } from "./types";

const RATE_KEY = "price-card-calculator:exchange-rates:v1";
const DOC_KEY = "price-card-calculator:document:v1";

type Data = { serviceCards: ServicePriceCard[]; officialCards: OfficialPriceCard[]; exchangeRates: ExchangeRates; version: PriceCardVersion };
type Value = Data & { loading: boolean; error: string | null; refresh: () => Promise<void> };
const Context = createContext<Value | null>(null);

function readLocalDocument(): PriceCardVersion | null {
  try {
    const stored = localStorage.getItem(DOC_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    // Basic shape check.
    if (!("serviceCards" in parsed) || !("officialCards" in parsed) || !("version" in parsed)) return null;
    return parsed as PriceCardVersion;
  } catch {
    return null;
  }
}

export function writeLocalDocument(document: PriceCardVersion) {
  localStorage.setItem(DOC_KEY, JSON.stringify(document));
}

function defaults(): Data {
  const exchangeRates = { ...DEFAULT_EXCHANGE_RATES };
  try {
    const stored = localStorage.getItem(RATE_KEY);
    if (stored) Object.assign(exchangeRates, normalizeExchangeRates(JSON.parse(stored)));
  } catch { /* Keep built-in rates. */ }

  const localDoc = readLocalDocument();
  if (localDoc) {
    return {
      serviceCards: structuredClone(localDoc.serviceCards),
      officialCards: structuredClone(localDoc.officialCards),
      exchangeRates,
      version: localDoc,
    };
  }

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
      // If the network API is unreachable (common for external networks), fall back to local published doc (if any).
      const localDoc = readLocalDocument();
      if (localDoc) {
        setData((old) => ({ ...old, serviceCards: localDoc.serviceCards, officialCards: localDoc.officialCards, version: localDoc }));
        setError(null);
      } else {
        setError("loadFailed");
      }
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
