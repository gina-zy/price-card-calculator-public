import { describe, expect, it } from "vitest";
import { quoteServices } from "./pricing";
import type { QuoteInput, ServicePriceCard } from "../types";

const base: ServicePriceCard = {
  id: "x", provider: "测试", country: "马来西亚", region: "西马", destination: "西马", channel: "渠道", transportMode: "海运",
  category: "食品/品牌", categoryTags: ["食品", "品牌"], chargeableWeightRule: "实重", billingMode: "PER_KG", billingModeSource: "每KG+操作费",
  minWeightKg: 0, maxWeightKg: 30, minInclusive: false, maxInclusive: true, firstWeightKg: null, firstWeightFee: null, incrementWeightKg: null, incrementFee: null,
  ratePerKg: 10, handlingFee: 5, ratePerCbm: null, minimumCbm: null, cbmIncrement: null, kgIncrement: null, volumetricDivisor: 6000,
  shipmentLimitKg: 30, transitTime: "", valueAddedServicesRaw: "", nonKgDetails: {}, restrictions: "", status: "ok", blockers: [], warnings: [],
};
const input: QuoteInput = { category: "食品", actualWeightKg: 1.2, volumeM3: null, dimensionsCm: { length: 10, width: 10, height: 10 }, destination: "西马", transportMode: "海运", provider: "测试", channel: "" };

describe("SEA pricing formulas", () => {
  it("requires an explicit handling fee for per-kg quotes", () => {
    expect(quoteServices([{ ...base, handlingFee: null }], input).quotes).toHaveLength(0);
    expect(quoteServices([{ ...base, handlingFee: 0 }], input).quotes[0]!.amount).toBe(12);
  });
  it("calculates first plus increment with ceiling", () => {
    const card = { ...base, billingMode: "FIRST_INCREMENT" as const, ratePerKg: null, handlingFee: null, firstWeightKg: 0.5, firstWeightFee: 20, incrementWeightKg: 0.5, incrementFee: 10 };
    expect(quoteServices([card], input).quotes[0]!.amount).toBe(40);
  });
  it("calculates CBM with minimum and 0.01 increment", () => {
    const card = { ...base, billingMode: "PER_CBM" as const, ratePerKg: null, handlingFee: null, ratePerCbm: 680, minimumCbm: 0.3, cbmIncrement: 0.01, shipmentLimitKg: null };
    expect(quoteServices([card], input).quotes[0]!.amount).toBeCloseTo(204);
  });
  it("filters quotes by transport mode", () => {
    const airCard = { ...base, id: "air", transportMode: "空运" };
    const result = quoteServices([base, airCard], input);
    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0]!.card.transportMode).toBe("海运");
  });
  it("blocks overlapping tiers instead of choosing the cheapest", () => {
    const second = { ...base, id: "y", ratePerKg: 8 };
    const result = quoteServices([base, second], input);
    expect(result.quotes).toHaveLength(0); expect(result.rejected.every((item) => item.reason === "conflict")).toBe(true);
  });
});
