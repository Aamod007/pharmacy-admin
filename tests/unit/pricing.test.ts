import { describe, it, expect } from "vitest";

function calculateFinalPrice(basePrice: number, discountPercent: number, gstRate: number, isTaxInclusive = true) {
  const discounted = basePrice - (basePrice * discountPercent) / 100;
  if (isTaxInclusive) {
    return Number(discounted.toFixed(2));
  }
  const tax = (discounted * gstRate) / 100;
  return Number((discounted + tax).toFixed(2));
}

describe("Pharmacy Pricing Calculation Logic", () => {
  it("correctly applies percentage discounts on tax-inclusive medicines", () => {
    const finalPrice = calculateFinalPrice(100, 20, 12, true);
    expect(finalPrice).toBe(80.0);
  });

  it("calculates tax on tax-exclusive products accurately", () => {
    const finalPrice = calculateFinalPrice(100, 10, 12, false);
    expect(finalPrice).toBe(100.8);
  });
});
