import { Calculator, Info } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Page, PageHeader } from "../components/layout/Page";
import { OfficialComparison } from "../components/OfficialComparison";
import { Alert, EmptyState } from "../components/ui/Feedback";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useLocale } from "../locale-context";
import { convertOfficialToRmb, formatReferenceRmb, normalizeExchangeRates } from "../lib/exchange-rates";
import { quoteOfficial, quoteServices } from "../lib/pricing";
import { usePriceCards } from "../price-card-context";
import type { OfficialQuote, QuoteInput, RejectedServiceCard, ServiceQuote } from "../types";

const number = (value: string) => value === "" ? null : Number(value);

export default function CalculatorPage() {
  const { t, locale } = useLocale();
  const { serviceCards, officialCards, exchangeRates, loading: dataLoading, error: dataError, refresh } = usePriceCards();
  const [category, setCategory] = useState("食品");
  const [weight, setWeight] = useState("500");
  const [weightUnit, setWeightUnit] = useState("g");
  const [length, setLength] = useState("100");
  const [width, setWidth] = useState("100");
  const [height, setHeight] = useState("50");
  const [destination, setDestination] = useState("马来西亚");
  const [transportMode, setTransportMode] = useState("空运");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [channel, setChannel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [serviceQuotes, setServiceQuotes] = useState<ServiceQuote[]>([]);
  const [rejectedByProvider, setRejectedByProvider] = useState<Record<string, RejectedServiceCard[]>>({});
  const [officialQuotes, setOfficialQuotes] = useState<OfficialQuote[]>([]);
  const [rates, setRates] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(exchangeRates).map(([currency, rate]) => [currency, String(rate)])));

  useEffect(() => { document.title = `${t.calculator.title} | ${t.app.name}`; }, [t]);
  useEffect(() => { setRates(Object.fromEntries(Object.entries(exchangeRates).map(([currency, rate]) => [currency, String(rate)]))); }, [exchangeRates]);

  const providers = useMemo(() => [...new Set(serviceCards.map((card) => card.provider))].sort(), [serviceCards]);
  useEffect(() => { setSelectedProviders((current) => current.length ? current.filter((provider) => providers.includes(provider)) : providers); }, [providers]);
  const destinations = useMemo(() => [...new Set([...serviceCards.map((card) => card.destination), ...officialCards.map((card) => card.country), "马来西亚", "西马", "东马"])].sort(), [serviceCards, officialCards]);
  const categories = useMemo(() => [...new Set(serviceCards.flatMap((card) => card.categoryTags))].sort(), [serviceCards]);
  const channels = useMemo(() => [...new Set(serviceCards.filter((card) => selectedProviders.includes(card.provider) && card.transportMode === transportMode).map((card) => card.channel))].sort(), [serviceCards, selectedProviders, transportMode]);
  useEffect(() => { if (channel && !channels.includes(channel)) setChannel(""); }, [channel, channels]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const actual = Number(weight) / (weightUnit === "g" ? 1000 : 1);
    const dims = [number(length), number(width), number(height)];
    if (!category || !destination || selectedProviders.length === 0 || !Number.isFinite(actual) || actual <= 0
      || dims.some((item) => item === null || !Number.isFinite(item) || item <= 0)) {
      setError(t.calculator.required); return;
    }
    const input: QuoteInput = {
      category,
      actualWeightKg: actual,
      volumeM3: null,
      dimensionsCm: { length: dims[0]!, width: dims[1]!, height: dims[2]! },
      destination,
      transportMode,
      provider: "",
      channel,
    };
    const results = selectedProviders.map((selectedProvider) => [selectedProvider, quoteServices(serviceCards, { ...input, provider: selectedProvider })] as const);
    setServiceQuotes(results.flatMap(([, result]) => result.quotes).sort((a, b) => a.amount - b.amount));
    setRejectedByProvider(Object.fromEntries(results.map(([selectedProvider, result]) => [selectedProvider, result.rejected])));
    setOfficialQuotes(transportMode === "空运" ? quoteOfficial(officialCards, destination, actual) : []);
    setError(""); setSubmitted(true);
  };

  const money = (value: number, currency: string) => new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", { style: "currency", currency }).format(value);
  const kg = (value: number) => new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", { maximumFractionDigits: 4 }).format(value);
  const dimensionValues = [number(length), number(width), number(height)];
  const calculatedVolume = dimensionValues.every((value) => value !== null && Number.isFinite(value) && value > 0)
    ? dimensionValues[0]! * dimensionValues[1]! * dimensionValues[2]! / 1_000_000
    : null;
  const hintText = (hint: string) => (t.calculator as Record<string, string>)[hint] ?? hint;
  const reasonText = (item: RejectedServiceCard) => {
    const base = item.reason === "overLimit" ? t.calculator.overLimit : item.reason === "outsideBand" ? t.calculator.outsideBand : item.reason === "conflict" ? t.calculator.conflict : t.calculator.missingRate;
    return base.replace("{provider}", item.card.provider).replace("{channel}", item.card.channel).replace("{weight}", kg(item.chargeableWeightKg)).replace("{limit}", String(item.card.shipmentLimitKg ?? "—"));
  };

  return (
    <Page>
      <PageHeader title={t.calculator.title} description={t.calculator.description} />
      <Alert className="mb-5 font-medium" tone="danger">{t.calculator.feeDisclaimer}</Alert>
      {dataLoading ? <Alert className="mb-5" tone="info">{t.calculator.dataLoading}</Alert> : null}
      {dataError ? <Alert className="mb-5" tone="warning"><div className="flex flex-wrap items-center justify-between gap-3"><span>{t.calculator.dataFallback}</span><Button size="sm" type="button" variant="ghost" onClick={() => void refresh()}>{t.calculator.retryData}</Button></div></Alert> : null}
      <form className="border-b pb-6" onSubmit={submit}>
        <h2 className="mb-4 text-base font-semibold">{t.calculator.formTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field htmlFor="category" label={t.calculator.category} required><Select id="category" options={categories.map((v) => ({ value: v, label: v }))} value={category} onValueChange={setCategory} /></Field>
          <Field htmlFor="weight" label={t.calculator.weight} required><div className="flex gap-2"><Input id="weight" inputMode="decimal" min="0" step="any" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /><Select aria-label={t.calculator.weightUnit} className="w-24" options={[{ value: "g", label: t.calculator.g }, { value: "kg", label: t.calculator.kg }]} value={weightUnit} onValueChange={setWeightUnit} /></div></Field>
          <Field htmlFor="length" label={t.calculator.lengthCm} required><Input id="length" inputMode="decimal" min="0" step="any" type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
          <Field htmlFor="width" label={t.calculator.widthCm} required><Input id="width" inputMode="decimal" min="0" step="any" type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
          <Field htmlFor="height" label={t.calculator.heightCm} required><Input id="height" inputMode="decimal" min="0" step="any" type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
          <div className="sm:col-span-2 lg:col-span-4"><span className="text-xs text-fg-subtle">{t.calculator.calculatedVolume}：</span><span className="tabular-nums">{calculatedVolume === null ? "—" : `${kg(calculatedVolume)} m³`}</span></div>
          <Field htmlFor="destination" label={t.calculator.destination} required><Select id="destination" options={destinations.map((v) => ({ value: v, label: v }))} value={destination} onValueChange={setDestination} /></Field>
          <Field htmlFor="transportMode" label={t.calculator.transportMode} required><Select id="transportMode" options={[{ value: "空运", label: t.calculator.air }, { value: "海运", label: t.calculator.sea }]} value={transportMode} onValueChange={setTransportMode} /></Field>
          <fieldset className="sm:col-span-2 lg:col-span-4"><legend className="mb-2 text-sm font-medium">{t.calculator.providers}</legend><div className="rounded-lg border p-3"><div className="mb-3 flex flex-wrap gap-2"><Button size="sm" type="button" onClick={() => setSelectedProviders(providers)}>{t.calculator.selectAllProviders}</Button><Button size="sm" type="button" variant="ghost" onClick={() => setSelectedProviders([])}>{t.calculator.clearProviders}</Button><span className="self-center text-xs text-fg-subtle">{t.calculator.selectedProviders.replace("{count}", String(selectedProviders.length))}</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{providers.map((providerName) => <label className="flex min-h-8 items-center gap-2 rounded-md px-2 hover:bg-muted" key={providerName}><Checkbox checked={selectedProviders.includes(providerName)} onCheckedChange={(checked) => setSelectedProviders((current) => checked === true ? [...current, providerName] : current.filter((item) => item !== providerName))} />{providerName}</label>)}</div></div></fieldset>
          <Field htmlFor="channel" label={t.calculator.channel}><Select id="channel" options={[{ value: "__all", label: t.calculator.allChannels }, ...channels.map((v) => ({ value: v, label: v }))]} value={channel || "__all"} onValueChange={(v) => setChannel(v === "__all" ? "" : v)} /></Field>
        </div>
        {error ? <p className="mt-3 text-sm text-danger-fg" role="alert">{error}</p> : null}
        <div className="mt-4"><Button type="submit" variant="primary"><Calculator aria-hidden="true" size={16} />{t.calculator.calculate}</Button></div>
      </form>

      {submitted ? <>
      <OfficialComparison
        serviceQuotes={serviceQuotes}
        officialQuotes={officialQuotes}
        rates={rates}
        formatMoney={money}
        labels={{
          title: t.calculator.comparisonTitle,
          description: t.calculator.comparisonDescription,
          best3pl: t.calculator.comparisonBest3pl,
          officialBenchmark: t.calculator.comparisonOfficial,
          saving: t.calculator.comparisonSaving,
          premium: t.calculator.comparisonPremium,
          noComparison: t.calculator.comparisonUnavailable,
        }}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="service-heading">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-semibold" id="service-heading">{t.calculator.serviceTitle}</h2><span className="text-xs text-fg-subtle">{t.calculator.quoteCount.replace("{count}", String(serviceQuotes.length))}</span></div>
          {serviceQuotes.length ? <div className="space-y-3">{serviceQuotes.map((quote) => { const officialRmbValues = officialQuotes.map((official) => convertOfficialToRmb(official.amount, official.card.currency, normalizeExchangeRates(rates))).filter((value): value is number => value !== null); const officialReference = officialRmbValues.length ? Math.min(...officialRmbValues) : null; const difference = officialReference === null ? null : quote.amount - officialReference; return <Card key={quote.card.id}><CardHeader title={`${quote.card.provider} · ${quote.card.channel}`} description={`${quote.card.destination} · ${quote.card.transportMode || "—"} · ${quote.card.category || "—"}`} actions={<div className="text-right"><strong className="block text-lg font-semibold tabular-nums">{money(quote.amount, "CNY")}</strong>{officialReference !== null ? <span className="text-xs text-fg-subtle">{t.calculator.officialReferenceShort.replace("{amount}", formatReferenceRmb(officialReference, locale === "zh" ? "zh-CN" : "en-US"))}</span> : null}</div>} /><CardBody className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-fg-subtle">{t.calculator.chargedWeight}：</span>{kg(quote.chargeableWeightKg)} kg</p><p><span className="text-fg-subtle">{t.calculator.billingQuantity}：</span>{kg(quote.billingQuantity)} {quote.billingUnit}</p><p><span className="text-fg-subtle">{t.calculator.volumeWeight}：</span>{quote.volumetricWeightKg === null ? "—" : `${kg(quote.volumetricWeightKg)} kg`}</p><p><span className="text-fg-subtle">{t.calculator.dimensionsDetail}：</span>{quote.dimensionsCm ? `${kg(quote.dimensionsCm.length)} × ${kg(quote.dimensionsCm.width)} × ${kg(quote.dimensionsCm.height)} cm` : "—"}</p><p><span className="text-fg-subtle">{t.calculator.calculatedVolume}：</span>{quote.volumeM3 === null ? "—" : `${kg(quote.volumeM3)} m³`}</p><p><span className="text-fg-subtle">{t.calculator.transit}：</span>{quote.card.transitTime || "—"}</p><p><span className="text-fg-subtle">{t.calculator.limit}：</span>{quote.card.shipmentLimitKg ?? "—"} kg</p>{difference !== null ? <p className="sm:col-span-2 font-medium tabular-nums">{(difference <= 0 ? t.calculator.serviceVsOfficialLower : t.calculator.officialVsServiceLower).replace("{amount}", money(Math.abs(difference), "CNY"))}</p> : null}<p className="sm:col-span-2"><span className="text-fg-subtle">{t.calculator.formula}：</span>{quote.formula}</p>{quote.card.restrictions ? <p className="sm:col-span-2"><span className="text-fg-subtle">{t.calculator.restriction}：</span>{quote.card.restrictions}</p> : null}{quote.dataHints.length ? <div className="sm:col-span-2"><Badge tone="warning">{t.calculator.dataHint}</Badge><ul className="mt-1 list-disc pl-5 text-xs text-fg-subtle">{quote.dataHints.map((hint) => <li key={hint}>{hintText(hint)}</li>)}</ul></div> : null}</CardBody></Card>; })}</div> : <><EmptyState icon={<Info size={22} />} title={t.calculator.noService} description={t.calculator.noServiceDesc} /><div className="mt-3 space-y-2">{selectedProviders.map((providerName) => <Alert key={providerName} tone="warning"><strong>{providerName}</strong><ul className="mt-1 list-disc space-y-1 pl-4">{(rejectedByProvider[providerName] ?? []).length ? (rejectedByProvider[providerName] ?? []).slice(0, 8).map((item) => <li key={item.card.id}>{reasonText(item)}</li>) : <li>{t.calculator.noProviderMatch}</li>}</ul></Alert>)}</div></>}
          {serviceQuotes.length ? <div className="mt-3 space-y-2">{selectedProviders.filter((providerName) => !serviceQuotes.some((quote) => quote.card.provider === providerName)).map((providerName) => <Alert key={providerName} tone="warning"><strong>{providerName}</strong><ul className="mt-1 list-disc space-y-1 pl-4">{(rejectedByProvider[providerName] ?? []).length ? (rejectedByProvider[providerName] ?? []).slice(0, 8).map((item) => <li key={item.card.id}>{reasonText(item)}</li>) : <li>{t.calculator.noProviderMatch}</li>}</ul></Alert>)}</div> : null}
        </section>
        <section aria-labelledby="official-heading"><h2 className="mb-3 text-base font-semibold" id="official-heading">{t.calculator.officialTitle}</h2>{destination === "马来西亚" && officialQuotes.length ? <Alert className="mb-3" tone="info">{t.calculator.regionPrompt}</Alert> : null}{officialQuotes.length ? <div className="space-y-3">{officialQuotes.map((quote) => { const rate = Number(rates[quote.card.currency]); const rmb = convertOfficialToRmb(quote.amount, quote.card.currency, normalizeExchangeRates(rates)); const best3pl = serviceQuotes[0]?.amount; const comparison = rmb !== null && best3pl !== undefined ? rmb - best3pl : null; return <Card key={quote.card.id}><CardHeader title={`${quote.card.country} · ${quote.card.region}`} description={quote.card.channel} actions={<div className="text-right"><strong className="block text-lg font-semibold tabular-nums">{rmb === null ? "—" : formatReferenceRmb(rmb, locale === "zh" ? "zh-CN" : "en-US")}</strong><span className="text-xs tabular-nums text-fg-subtle">{money(quote.amount, quote.card.currency)}</span></div>} /><CardBody><p className="text-sm text-fg-muted">{t.calculator.officialFormula}</p><p className="mt-2 text-xs text-fg-subtle">{t.calculator.referenceRateNote}</p><Field className="mt-3" htmlFor={`rate-${quote.card.id}`} label={t.calculator.exchange.replace("{currency}", quote.card.currency)} hint={t.calculator.temporaryOverride}><Input id={`rate-${quote.card.id}`} min="0" step="any" type="number" value={rates[quote.card.currency] ?? ""} onChange={(e) => setRates((current) => ({ ...current, [quote.card.currency]: e.target.value }))} /></Field>{Number.isFinite(rate) && rate > 0 ? <p className="mt-2 text-xs tabular-nums text-fg-subtle">{t.calculator.rateUsed.replace("{rate}", String(rate)).replace("{currency}", quote.card.currency)}</p> : null}{comparison !== null ? <p className={`mt-2 text-sm font-medium tabular-nums ${comparison <= 0 ? "text-success-fg" : "text-fg-muted"}`}>{(comparison <= 0 ? t.calculator.officialLower : t.calculator.serviceLower).replace("{amount}", money(Math.abs(comparison), "CNY"))}</p> : null}</CardBody></Card>; })}</div> : <EmptyState title={t.calculator.noOfficial} />}</section>
      </div>
      </> : null}
    </Page>
  );
}
