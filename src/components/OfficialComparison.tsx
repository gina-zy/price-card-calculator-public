import React from "react";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import type { OfficialQuote, ServiceQuote } from "../types";
import { convertOfficialToRmb, normalizeExchangeRates } from "../lib/exchange-rates";
import { Card, CardBody, CardHeader } from "./ui/Card";

interface OfficialComparisonProps {
  serviceQuotes: ServiceQuote[];
  officialQuotes: OfficialQuote[];
  rates: Record<string, string>;
  formatMoney: (value: number, currency: string) => string;
  labels: {
    title: string;
    description: string;
    best3pl: string;
    officialBenchmark: string;
    saving: string;
    premium: string;
    noComparison: string;
  };
}

export function OfficialComparison({ serviceQuotes, officialQuotes, rates, formatMoney, labels }: OfficialComparisonProps) {
  const best3pl = serviceQuotes[0];
  const normalizedRates = normalizeExchangeRates(rates);
  const officialCandidates = officialQuotes
    .map((quote) => ({ quote, rmb: convertOfficialToRmb(quote.amount, quote.card.currency, normalizedRates) }))
    .filter((item): item is { quote: OfficialQuote; rmb: number } => item.rmb !== null)
    .sort((a, b) => a.rmb - b.rmb);
  const official = officialCandidates[0];

  if (!best3pl || !official) {
    return (
      <Card className="mt-6">
        <CardHeader title={labels.title} description={labels.noComparison} />
      </Card>
    );
  }

  const difference = best3pl.amount - official.rmb;
  const percentage = official.rmb > 0 ? Math.abs(difference) / official.rmb * 100 : 0;
  const threePlIsLower = difference <= 0;

  return (
    <Card className="mt-6">
      <CardHeader
        title={labels.title}
        description={labels.description}
        actions={<Scale aria-hidden="true" className="text-fg-subtle" size={20} />}
      />
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-fg-subtle">{labels.best3pl}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(best3pl.amount, "CNY")}</p>
          <p className="mt-1 text-xs text-fg-muted">{best3pl.card.provider} · {best3pl.card.channel}</p>
        </div>
        <div>
          <p className="text-xs text-fg-subtle">{labels.officialBenchmark}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(official.rmb, "CNY")}</p>
          <p className="mt-1 text-xs text-fg-muted">{official.quote.card.country} · {official.quote.card.region || official.quote.card.channel}</p>
        </div>
        <div>
          <p className="text-xs text-fg-subtle">{threePlIsLower ? labels.saving : labels.premium}</p>
          <p className={`mt-1 flex items-center gap-1 text-lg font-semibold tabular-nums ${threePlIsLower ? "text-success-fg" : "text-danger-fg"}`}>
            {threePlIsLower ? <ArrowDownRight aria-hidden="true" size={18} /> : <ArrowUpRight aria-hidden="true" size={18} />}
            {formatMoney(Math.abs(difference), "CNY")} · {percentage.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-fg-muted">{threePlIsLower ? best3pl.card.provider : official.quote.card.channel}</p>
        </div>
      </CardBody>
    </Card>
  );
}
