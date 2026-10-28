export type BillingMode = "PER_KG" | "TIERED_PER_KG" | "FIRST_INCREMENT" | "PER_CBM" | "REFERENCE_ONLY";

export interface ServicePriceCard {
  id: string; provider: string; country: string; region: string; destination: string; channel: string;
  transportMode: string; category: string; categoryTags: string[]; chargeableWeightRule: string;
  billingMode: BillingMode; billingModeSource: string; minWeightKg: number | null; maxWeightKg: number | null;
  minInclusive: boolean | null; maxInclusive: boolean | null; firstWeightKg: number | null; firstWeightFee: number | null;
  incrementWeightKg: number | null; incrementFee: number | null; ratePerKg: number | null; handlingFee: number | null;
  ratePerCbm: number | null; minimumCbm: number | null; cbmIncrement: number | null; kgIncrement: number | null;
  volumetricDivisor: number | null; shipmentLimitKg: number | null; transitTime: string;
  valueAddedServicesRaw: string; nonKgDetails: Record<string, string>; restrictions: string;
  sourceFile?: string; sourceRow?: number; status: "ok" | "warning" | "blocked"; blockers: string[]; warnings: string[];
}

export interface OfficialPriceCard { id: string; country: string; region: string; channel: string; currency: string; startingWeightG: number; startingPrice: number; incrementPricePer10G: number; sourceRow?: number; }
export interface ImportSummary { providers: Record<string, number>; rows: number; computable: number; blockers: number; warnings: number; }
export interface PriceCardVersion { version: string; updatedAt: string; source: string; summary: ImportSummary; }
export interface PriceCardDocument extends PriceCardVersion { schemaVersion: number; serviceCards: ServicePriceCard[]; officialCards: OfficialPriceCard[]; }
export interface PreviewIssue { level: "blocker" | "warning"; provider: string; row: number; message: string; }
export interface PriceCardPreview { previewToken: string; expiresInSeconds: number; summary: ImportSummary; files: Array<{ filename: string; providers: string[]; rows: number }>; issues: PreviewIssue[]; }

export interface QuoteInput { category: string; actualWeightKg: number; volumeM3: number | null; dimensionsCm: { length: number; width: number; height: number } | null; destination: string; transportMode: string; provider: string; channel: string; }
export interface ServiceQuote { card: ServicePriceCard; amount: number; chargeableWeightKg: number; billingQuantity: number; billingUnit: "kg" | "CBM"; volumetricWeightKg: number | null; dimensionsCm: { length: number; width: number; height: number } | null; volumeM3: number | null; dataHints: string[]; formula: string; }
export interface RejectedServiceCard { card: ServicePriceCard; reason: "overLimit" | "outsideBand" | "missingRate" | "conflict"; chargeableWeightKg: number; }
export interface OfficialQuote { card: OfficialPriceCard; amount: number; steps: number; }
