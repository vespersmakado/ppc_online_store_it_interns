export type DemoQuotationRecord = {
  id: string;
  date: string;
  status:
    | "Draft"
    | "Pending Review"
    | "Information Requested"
    | "Approved"
    | "Rejected"
    | "Converted to Order"
    | "Finished"
    | "Expired";
  method: "COLLECT" | "DELIVER";
  conditionsAcknowledged?: boolean;
  customer?: {
    company: string;
    accountNumber: string;
    email: string;
    contact: string;
    destination: string;
  };
  taxRateBps?: number;
  taxInclusive?: boolean;
  taxCategory?: "Taxable" | "Exempt" | "Zero-rated (demo only)";
  exemptionReason?: string;
  lines: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
};

const STORAGE_KEY = "ppc-customer-demo-submitted-quotations-v1";
const VALID_PRODUCT_IDS = new Set(["surecem-32-5n", "surebuild-42-5n", "surecast-42-5r"]);
const VALID_STATUSES = new Set([
  "Draft",
  "Pending Review",
  "Information Requested",
  "Approved",
  "Rejected",
  "Converted to Order",
  "Finished",
  "Expired",
]);

export function readSubmittedDemoQuotations(): DemoQuotationRecord[] {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (record) =>
        record &&
        typeof record === "object" &&
        typeof record.id === "string" &&
        typeof record.date === "string" &&
        typeof record.status === "string" &&
        VALID_STATUSES.has(record.status) &&
        (record.method === "COLLECT" || record.method === "DELIVER") &&
        (!("taxRateBps" in record) ||
          (typeof record.taxRateBps === "number" &&
            Number.isSafeInteger(record.taxRateBps) &&
            record.taxRateBps >= 0)) &&
        (!("taxInclusive" in record) || typeof record.taxInclusive === "boolean") &&
        (!("taxCategory" in record) ||
          record.taxCategory === "Taxable" ||
          record.taxCategory === "Exempt" ||
          record.taxCategory === "Zero-rated (demo only)") &&
        (!("exemptionReason" in record) || typeof record.exemptionReason === "string") &&
        Array.isArray(record.lines) &&
        record.lines.every(
          (line: unknown) =>
            line &&
            typeof line === "object" &&
            "productId" in line &&
            typeof line.productId === "string" &&
            VALID_PRODUCT_IDS.has(line.productId) &&
            "quantity" in line &&
            typeof line.quantity === "number" &&
            Number.isSafeInteger(line.quantity) &&
            line.quantity > 0 &&
            line.quantity % 40 === 0 &&
            "unitPriceCents" in line &&
            typeof line.unitPriceCents === "number" &&
            Number.isSafeInteger(line.unitPriceCents) &&
            line.unitPriceCents > 0,
        ),
    )
  ) {
    throw new Error("Saved submitted quotation data has an invalid format.");
  }
  return parsed as DemoQuotationRecord[];
}

export function recordSubmittedDemoQuotation(
  lines: DemoQuotationRecord["lines"],
  method: "collect" | "delivery",
  customer?: DemoQuotationRecord["customer"],
  tax?: {
    rateBps: number;
    inclusive: boolean;
    category: "Taxable" | "Non-Taxable / Exempt" | "Zero-rated (demo only)";
    exemptionReason: string;
  },
): DemoQuotationRecord {
  if (
    !lines.length ||
    !lines.every(
      (line) =>
        VALID_PRODUCT_IDS.has(line.productId) &&
        Number.isSafeInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity % 40 === 0 &&
        Number.isSafeInteger(line.unitPriceCents) &&
        line.unitPriceCents > 0,
    )
  ) {
    throw new Error("Cannot save a demo quotation with invalid product quantities.");
  }
  const record: DemoQuotationRecord = {
    id: `DEMO-${Date.now()}`,
    date: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
    status: "Pending Review",
    method: method === "collect" ? "COLLECT" : "DELIVER",
    conditionsAcknowledged: true,
    ...(customer ? { customer } : {}),
    ...(tax ? { taxRateBps: tax.rateBps, taxInclusive: tax.inclusive } : {}),
    ...(tax
      ? {
          taxCategory:
            tax.category === "Taxable"
              ? "Taxable"
              : tax.category === "Non-Taxable / Exempt"
                ? "Exempt"
                : "Zero-rated (demo only)",
          ...(tax.category === "Taxable" ? {} : { exemptionReason: tax.exemptionReason }),
        }
      : {}),
    lines,
  };
  const saved = readSubmittedDemoQuotations();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...saved]));
  return record;
}

export function updateSubmittedDemoQuotationStatus(
  id: string,
  status: DemoQuotationRecord["status"],
) {
  const saved = readSubmittedDemoQuotations();
  if (!saved.some((record) => record.id === id)) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(saved.map((record) => (record.id === id ? { ...record, status } : record))),
  );
}

if (import.meta.vitest) {
  const { afterEach, describe, expect, it } = import.meta.vitest;

  describe("demo portal quotations", () => {
    afterEach(() => window.localStorage.clear());

    it("saves submitted demo cart lines for the customer portal", () => {
      const quotation = recordSubmittedDemoQuotation(
        [{ productId: "surecem-32-5n", quantity: 40, unitPriceCents: 1200 }],
        "collect",
      );

      expect(quotation.status).toBe("Pending Review");
      expect(quotation.conditionsAcknowledged).toBe(true);
      expect(readSubmittedDemoQuotations()).toEqual([quotation]);
    });

    it("rejects quantities that do not follow the shared 40-bag increment", () => {
      expect(() =>
        recordSubmittedDemoQuotation(
          [{ productId: "surecem-32-5n", quantity: 41, unitPriceCents: 1200 }],
          "collect",
        ),
      ).toThrow("invalid product quantities");
    });
  });
}
