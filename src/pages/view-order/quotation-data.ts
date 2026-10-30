import surebuildImage from "@/assets/surebuild.jpg";
import surecastImage from "@/assets/surecast.jpg";
import surecemImage from "@/assets/surecem.jpg";

export const QUOTATION_NUMBER = "500550005";
export const DEFAULT_TAX_RATE_BASIS_POINTS = 1550;

export const QUOTATION_PRODUCTS = [
  {
    id: "surecem-32-5n",
    material: "SURECEM 32,5N",
    image: surecemImage,
    unitPriceCents: 1200,
  },
  {
    id: "surecast-42-5r",
    material: "SURECAST 42,5R",
    image: surecastImage,
    unitPriceCents: 1300,
  },
  {
    id: "surebuild-42-5n",
    material: "SureBuild 42,5N",
    image: surebuildImage,
    unitPriceCents: 1400,
  },
] as const;

export type QuotationLine = {
  id: string;
  qty: number;
  unitPriceCents: number;
};

export function formatQuotationUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function calculateQuotationTotals(
  lines: QuotationLine[],
  taxRateBps = DEFAULT_TAX_RATE_BASIS_POINTS,
  taxInclusive = false,
) {
  if (!Number.isSafeInteger(taxRateBps) || taxRateBps < 0) {
    throw new Error("Quotation tax rate must be a non-negative integer in basis points.");
  }
  const totals = lines.reduce(
    (sum, line) => {
      const lineAmountCents = line.qty * line.unitPriceCents;
      if (taxInclusive) {
        const lineNetCents =
          taxRateBps === 0
            ? lineAmountCents
            : Math.round((lineAmountCents * 10000) / (10000 + taxRateBps));
        return {
          amountExcludingVatCents: sum.amountExcludingVatCents + lineNetCents,
          outputTaxCents: sum.outputTaxCents + lineAmountCents - lineNetCents,
          totalCents: sum.totalCents + lineAmountCents,
        };
      }
      const lineTaxCents = Math.round((lineAmountCents * taxRateBps) / 10000);
      return {
        amountExcludingVatCents: sum.amountExcludingVatCents + lineAmountCents,
        outputTaxCents: sum.outputTaxCents + lineTaxCents,
        totalCents: sum.totalCents + lineAmountCents + lineTaxCents,
      };
    },
    { amountExcludingVatCents: 0, outputTaxCents: 0, totalCents: 0 },
  );

  return {
    ...totals,
    grandTotalCents: totals.totalCents,
  };
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("quotation calculations", () => {
    it("uses the fixed quotation number", () => {
      expect(QUOTATION_NUMBER).toBe("500550005");
    });

    it("calculates line totals and 15.50% VAT using integer cents", () => {
      const totals = calculateQuotationTotals([
        { id: "surecem-32-5n", qty: 40, unitPriceCents: 1200 },
        { id: "surecast-42-5r", qty: 40, unitPriceCents: 1300 },
        { id: "surebuild-42-5n", qty: 40, unitPriceCents: 1400 },
      ]);

      expect(totals).toEqual({
        amountExcludingVatCents: 156000,
        outputTaxCents: 24180,
        totalCents: 180180,
        grandTotalCents: 180180,
      });
    });
  });
}
