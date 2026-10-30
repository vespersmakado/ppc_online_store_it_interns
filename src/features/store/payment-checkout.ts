export const PAYMENT_CHECKOUT_KEY = "ppc-zw-payment-checkout-v1";

const VALID_PRODUCT_IDS = new Set(["surecem-32-5n", "surecast-42-5r", "surebuild-42-5n"]);

export type PaymentCheckout = {
  quotationReference: string;
  submissionReference: string;
  date: string;
  method: "COLLECT" | "DELIVER";
  customer: {
    name: string;
    accountNumber: string;
    emailAddress: string;
  };
  lines: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  taxRateBps: number;
  taxInclusive: boolean;
};

function isPaymentCheckout(value: unknown): value is PaymentCheckout {
  if (!value || typeof value !== "object") return false;
  const checkout = value as Partial<PaymentCheckout>;
  return (
    typeof checkout.quotationReference === "string" &&
    typeof checkout.submissionReference === "string" &&
    typeof checkout.date === "string" &&
    (checkout.method === "COLLECT" || checkout.method === "DELIVER") &&
    typeof checkout.customer === "object" &&
    checkout.customer !== null &&
    typeof checkout.customer.name === "string" &&
    typeof checkout.customer.accountNumber === "string" &&
    typeof checkout.customer.emailAddress === "string" &&
    Array.isArray(checkout.lines) &&
    checkout.lines.length > 0 &&
    checkout.lines.every(
      (line) =>
        line &&
        VALID_PRODUCT_IDS.has(line.productId) &&
        Number.isSafeInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity % 40 === 0 &&
        Number.isSafeInteger(line.unitPriceCents) &&
        line.unitPriceCents > 0,
    ) &&
    typeof checkout.taxRateBps === "number" &&
    Number.isSafeInteger(checkout.taxRateBps) &&
    checkout.taxRateBps >= 0 &&
    typeof checkout.taxInclusive === "boolean"
  );
}

export function savePaymentCheckout(checkout: PaymentCheckout) {
  if (!isPaymentCheckout(checkout)) {
    throw new Error("Cannot continue to payment with invalid quotation details.");
  }
  window.sessionStorage.setItem(PAYMENT_CHECKOUT_KEY, JSON.stringify(checkout));
}

export function readPaymentCheckout(): PaymentCheckout | null {
  const raw = window.sessionStorage.getItem(PAYMENT_CHECKOUT_KEY);
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  if (!isPaymentCheckout(parsed)) {
    throw new Error("Saved payment details are invalid. Return to order review and try again.");
  }
  return parsed;
}

if (import.meta.vitest) {
  const { afterEach, describe, expect, it } = import.meta.vitest;

  describe("payment checkout session", () => {
    afterEach(() => window.sessionStorage.clear());

    it("round-trips an order-review quotation safely", () => {
      const checkout: PaymentCheckout = {
        quotationReference: "500550005",
        submissionReference: "DEMO-123",
        date: "2026-10-29",
        method: "COLLECT",
        customer: {
          name: "Vespers Makado",
          accountNumber: "1230004560098",
          emailAddress: "vespers@example.com",
        },
        lines: [{ productId: "surecem-32-5n", quantity: 40, unitPriceCents: 1200 }],
        taxRateBps: 1550,
        taxInclusive: false,
      };

      savePaymentCheckout(checkout);
      expect(readPaymentCheckout()).toEqual(checkout);
    });

    it("rejects malformed or unknown product lines", () => {
      window.sessionStorage.setItem(
        PAYMENT_CHECKOUT_KEY,
        JSON.stringify({
          quotationReference: "500550005",
          submissionReference: "DEMO-123",
          date: "2026-10-29",
          method: "COLLECT",
          customer: { name: "", accountNumber: "", emailAddress: "" },
          lines: [{ productId: "unknown", quantity: 40, unitPriceCents: 1200 }],
          taxRateBps: 1550,
          taxInclusive: false,
        }),
      );

      expect(() => readPaymentCheckout()).toThrow("Saved payment details are invalid");
    });
  });
}
