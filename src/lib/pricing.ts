import type { OfficialPriceCard, OfficialQuote, QuoteInput, RejectedServiceCard, ServicePriceCard, ServiceQuote } from "../types";

const ceilTo = (value: number, increment: number | null) => increment && increment > 0 ? Math.ceil((value - 1e-12) / increment) * increment : value;

export function volumeWeightKg(card: ServicePriceCard, input: QuoteInput): number | null {
  if (!card.volumetricDivisor || card.volumetricDivisor <= 0) return null;
  const volumeCm3 = input.dimensionsCm
    ? input.dimensionsCm.length * input.dimensionsCm.width * input.dimensionsCm.height
    : input.volumeM3 === null ? null : input.volumeM3 * 1_000_000;
  return volumeCm3 === null ? null : volumeCm3 / card.volumetricDivisor;
}

function destinationRank(card: ServicePriceCard, selected: string): number | null {
  if (selected === card.destination || selected === card.region) return 0;
  if (selected === card.country) return card.region ? 1 : 0;
  if (selected === "马来西亚" && card.country === "马来西亚") return card.region ? 1 : 0;
  if ((selected === "西马" || selected === "东马") && card.country === "马来西亚" && !card.region) return 1;
  if (selected === "菲律宾" && card.country === "菲律宾") return card.region ? 1 : 0;
  if (selected === "泰国" && card.country === "泰国") return card.region ? 1 : 0;
  return null;
}

function categoryRank(card: ServicePriceCard, selected: string[]): number | null {
  if (!selected.length) return null;
  // OR semantics: any selected category can match.
  if (selected.some((c) => card.categoryTags.includes(c))) return 0;
  if (!card.categoryTags.length && selected.some((c) => card.channel.includes(c))) return 1;
  // Backward-compat: blank categoryTags are treated as a low-priority candidate.
  if (!card.categoryTags.length) return 2;
  return null;
}

function isInBand(card: ServicePriceCard, value: number): boolean {
  const lower = card.minWeightKg === null || (card.minInclusive ? value >= card.minWeightKg : value > card.minWeightKg);
  const upper = card.maxWeightKg === null || (card.maxInclusive ? value <= card.maxWeightKg : value < card.maxWeightKg);
  return lower && upper;
}

function chargeableWeight(card: ServicePriceCard, actual: number, volumetric: number | null) {
  const rule = card.chargeableWeightRule;
  let value = actual; let fallback = false;
  if (rule.includes("体积重") && !rule.includes("取大") && !rule.includes("较大")) value = volumetric ?? actual;
  else if (rule.includes("取大") || rule.includes("较大") || rule.includes("&")) value = Math.max(actual, volumetric ?? actual);
  else if (!rule) { value = Math.max(actual, volumetric ?? actual); fallback = true; }
  return { weight: ceilTo(value, card.kgIncrement), fallback };
}

function amount(card: ServicePriceCard, weight: number, volume: number): { amount: number; quantity: number; unit: "kg" | "CBM"; formula: string } | null {
  if (card.billingMode === "FIRST_INCREMENT") {
    if (card.firstWeightKg === null || card.firstWeightFee === null || !card.incrementWeightKg || card.incrementFee === null) return null;
    const units = Math.ceil(Math.max(0, weight - card.firstWeightKg) / card.incrementWeightKg);
    return { amount: card.firstWeightFee + units * card.incrementFee, quantity: weight, unit: "kg", formula: `${card.firstWeightFee} + ceil(max(0, ${weight} - ${card.firstWeightKg}) / ${card.incrementWeightKg}) × ${card.incrementFee}` };
  }
  if (card.billingMode === "PER_CBM") {
    if (card.ratePerCbm === null || card.minimumCbm === null || !card.cbmIncrement) return null;
    const quantity = ceilTo(Math.max(volume, card.minimumCbm), card.cbmIncrement);
    return { amount: quantity * card.ratePerCbm, quantity, unit: "CBM", formula: `ceil(max(${volume} CBM, ${card.minimumCbm}) / ${card.cbmIncrement}) × ${card.cbmIncrement} × ${card.ratePerCbm}` };
  }
  if ((card.billingMode === "PER_KG" || card.billingMode === "TIERED_PER_KG") && card.ratePerKg !== null && card.handlingFee !== null) {
    return { amount: weight * card.ratePerKg + card.handlingFee, quantity: weight, unit: "kg", formula: `${weight} kg × ${card.ratePerKg} + ${card.handlingFee}` };
  }
  return null;
}

export function quoteServices(cards: ServicePriceCard[], input: QuoteInput): { quotes: ServiceQuote[]; rejected: RejectedServiceCard[] } {
  const volume = input.dimensionsCm ? input.dimensionsCm.length * input.dimensionsCm.width * input.dimensionsCm.height / 1_000_000 : input.volumeM3 ?? 0;
  const prepared = cards.map((card) => {
    const dr = destinationRank(card, input.destination); const cr = categoryRank(card, input.categories);
    const volumetric = volumeWeightKg(card, input); const charged = chargeableWeight(card, input.actualWeightKg, volumetric);
    return { card, dr, cr, volumetric, charged };
  }).filter((x) => x.dr !== null && x.cr !== null && (!input.transportMode || x.card.transportMode === input.transportMode) && (!input.provider || x.card.provider === input.provider) && (!input.channel || x.card.channel === input.channel));
  const rejected: RejectedServiceCard[] = []; const eligible = [];
  for (const item of prepared) {
    if (item.card.status === "blocked") { rejected.push({ card: item.card, reason: "missingRate", chargeableWeightKg: item.charged.weight }); continue; }
    if (item.card.shipmentLimitKg !== null && item.charged.weight > item.card.shipmentLimitKg) { rejected.push({ card: item.card, reason: "overLimit", chargeableWeightKg: item.charged.weight }); continue; }
    if (item.card.billingMode !== "PER_CBM" && !isInBand(item.card, item.charged.weight)) { rejected.push({ card: item.card, reason: "outsideBand", chargeableWeightKg: item.charged.weight }); continue; }
    eligible.push(item);
  }
  const groups = new Map<string, typeof eligible>();
  eligible.forEach((item) => { const key = `${item.card.provider}|${item.card.channel}|${item.dr}|${item.cr}`; groups.set(key, [...(groups.get(key) ?? []), item]); });
  const quotes: ServiceQuote[] = [];
  for (const group of groups.values()) {
    if (group.length > 1) { group.forEach((item) => rejected.push({ card: item.card, reason: "conflict", chargeableWeightKg: item.charged.weight })); continue; }
    const item = group[0]!; const calculated = amount(item.card, item.charged.weight, volume);
    if (!calculated) { rejected.push({ card: item.card, reason: "missingRate", chargeableWeightKg: item.charged.weight }); continue; }
    const hints = [...item.card.warnings];
    if (item.charged.fallback) hints.push("fallbackWeightRule");
    if (item.cr === 1) hints.push("categoryFromChannel"); if (item.cr === 2) hints.push("blankCategory"); if (item.dr === 1) hints.push("normalizedDestination");
    quotes.push({ card: item.card, amount: calculated.amount, chargeableWeightKg: item.charged.weight, billingQuantity: calculated.quantity, billingUnit: calculated.unit, volumetricWeightKg: item.volumetric, dimensionsCm: input.dimensionsCm, volumeM3: volume, dataHints: hints, formula: calculated.formula });
  }
  return { quotes: quotes.sort((a, b) => a.amount - b.amount), rejected };
}

export function quoteOfficial(cards: OfficialPriceCard[], destination: string, actualWeightKg: number): OfficialQuote[] {
  const weightG = actualWeightKg * 1000;
  return cards.filter((card) => destination === "马来西亚" ? card.country === "马来西亚" : destination === "西马" || destination === "东马" ? card.country === "马来西亚" && card.region === destination : card.country === destination)
    .map((card) => { const steps = Math.ceil(Math.max(0, weightG - card.startingWeightG) / 10); return { card, steps, amount: card.startingPrice + steps * card.incrementPricePer10G }; });
}
