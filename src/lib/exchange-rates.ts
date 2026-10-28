export const SUPPORTED_OFFICIAL_CURRENCIES = ["MYR", "THB", "VND", "PHP", "SGD"] as const;

export type OfficialCurrency = (typeof SUPPORTED_OFFICIAL_CURRENCIES)[number];
export type ExchangeRates = Record<OfficialCurrency, number>;

/** Public reference snapshot at 2026-10-23 00:02 UTC; 1 official currency unit = X RMB. */
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  MYR: 1.643498,
  THB: 0.198790,
  VND: 0.000258000,
  PHP: 0.105300,
  SGD: 5.236944,
};

export function normalizeExchangeRates(value: unknown): ExchangeRates {
  const candidate = value && typeof value === "object" ? value as Partial<Record<OfficialCurrency, unknown>> : {};
  return Object.fromEntries(SUPPORTED_OFFICIAL_CURRENCIES.map((currency) => {
    const rate = Number(candidate[currency]);
    return [currency, Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EXCHANGE_RATES[currency]];
  })) as ExchangeRates;
}

export function formatReferenceRmb(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "CNY", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function convertOfficialToRmb(amount: number, currency: string, rates: ExchangeRates): number | null {
  if (currency === "CNY" || currency === "RMB") return amount;
  if (!SUPPORTED_OFFICIAL_CURRENCIES.includes(currency as OfficialCurrency)) return null;
  return amount * rates[currency as OfficialCurrency];
}
