import { describe, expect, it } from "vitest";
import { OFFICIAL_PRICE_CARDS } from "../data/price-card-seed";
import { quoteOfficial } from "./pricing";

/**
 * Official price card seed must match:
 * 东南亚跨境物流运费价格表20261030(1).xlsx / 第一个 sheet「价卡」/ 跨境物流成本 A-G
 * (NOT buyer/seller paid shipping columns H-K).
 */
describe("OFFICIAL_PRICE_CARDS", () => {
  it("matches 2026-10-30 xlsx (A-G) for Malaysia", () => {
    const west = OFFICIAL_PRICE_CARDS.find((c) => c.country === "马来西亚" && c.region === "西马");
    const east = OFFICIAL_PRICE_CARDS.find((c) => c.country === "马来西亚" && c.region === "东马");

    expect(west).toMatchObject({ startingWeightG: 30, startingPrice: 0.06, incrementPricePer10G: 0.08, currency: "MYR", channel: "Standard" });
    expect(east).toMatchObject({ startingWeightG: 30, startingPrice: 0.06, incrementPricePer10G: 0.08, currency: "MYR", channel: "Standard" });
  });

  it("pricing weight boundary uses ceil by 10g increments", () => {
    // West Malaysia: startingWeightG=30, startingPrice=0.06, increment=0.08
    const q30 = quoteOfficial(OFFICIAL_PRICE_CARDS, "西马", 0.03).find((q) => q.card.region === "西马");
    const q31 = quoteOfficial(OFFICIAL_PRICE_CARDS, "西马", 0.031).find((q) => q.card.region === "西马");

    expect(q30?.steps).toBe(0);
    expect(q30?.amount).toBeCloseTo(0.06, 10);

    expect(q31?.steps).toBe(1);
    expect(q31?.amount).toBeCloseTo(0.14, 10);

    // Thailand: startingWeightG=10, startingPrice=0.4, increment=0.4
    const th10 = quoteOfficial(OFFICIAL_PRICE_CARDS, "泰国", 0.01).find((q) => q.card.region === "Zone A");
    const th11 = quoteOfficial(OFFICIAL_PRICE_CARDS, "泰国", 0.011).find((q) => q.card.region === "Zone A");

    expect(th10?.steps).toBe(0);
    expect(th10?.amount).toBeCloseTo(0.4, 10);

    expect(th11?.steps).toBe(1);
    expect(th11?.amount).toBeCloseTo(0.8, 10);
  });
});
