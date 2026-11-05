import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { priceCardApi } from "./api";
import { BUILTIN_PRICE_CARD_VERSION, OFFICIAL_PRICE_CARDS, SERVICE_PRICE_CARDS } from "./data/price-card-seed";
import { DEFAULT_EXCHANGE_RATES, normalizeExchangeRates, type ExchangeRates } from "./lib/exchange-rates";
import type { OfficialPriceCard, PriceCardDocument, PriceCardVersion, ServicePriceCard } from "./types";

const RATE_KEY = "price-card-calculator:exchange-rates:v1";
const DOC_KEY = "price-card-calculator:document:v1";

type Data = { serviceCards: ServicePriceCard[]; officialCards: OfficialPriceCard[]; exchangeRates: ExchangeRates; version: PriceCardVersion };
type Value = Data & { loading: boolean; error: string | null; refresh: () => Promise<void> };
const Context = createContext<Value | null>(null);

function readLocalDocument(): PriceCardDocument | null {
  try {
    const stored = localStorage.getItem(DOC_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    // Basic shape check.
    if (!("schemaVersion" in parsed) || !("serviceCards" in parsed) || !("officialCards" in parsed) || !("version" in parsed)) return null;
    if (!Array.isArray((parsed as any).serviceCards) || !Array.isArray((parsed as any).officialCards)) return null;

    return parsed as PriceCardDocument;
  } catch {
    return null;
  }
}

export function writeLocalDocument(document: PriceCardDocument) {
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
    // If user previously published a local "builtin" document, it will pin old official cards forever.
    // We upgrade official cards when the built-in version changes, while preserving user-maintained service cards.
    const shouldUpgradeBuiltinOfficial = localDoc.source === "builtin" && localDoc.version !== BUILTIN_PRICE_CARD_VERSION.version;

    const next = {
      schemaVersion: localDoc.schemaVersion,
      version: shouldUpgradeBuiltinOfficial ? BUILTIN_PRICE_CARD_VERSION.version : localDoc.version,
      updatedAt: shouldUpgradeBuiltinOfficial ? BUILTIN_PRICE_CARD_VERSION.updatedAt : localDoc.updatedAt,
      source: shouldUpgradeBuiltinOfficial ? "builtin" : localDoc.source,
      summary: shouldUpgradeBuiltinOfficial ? BUILTIN_PRICE_CARD_VERSION.summary : localDoc.summary,
      serviceCards: structuredClone(localDoc.serviceCards),
      officialCards: shouldUpgradeBuiltinOfficial ? structuredClone(OFFICIAL_PRICE_CARDS) : structuredClone(localDoc.officialCards),
    } satisfies PriceCardDocument;

    if (shouldUpgradeBuiltinOfficial) {
      try { writeLocalDocument(next); } catch { /* Ignore storage quota / private mode errors. */ }
    }

    return { serviceCards: next.serviceCards, officialCards: next.officialCards, exchangeRates, version: next };
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
