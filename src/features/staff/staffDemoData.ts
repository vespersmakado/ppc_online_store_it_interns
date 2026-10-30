export type StaffQuotationStatus =
  "Awaiting Review" | "Information Requested" | "Approved" | "Rejected" | "Converted to Order";

export type StaffOrderStatus =
  | "Processing"
  | "Awaiting Payment"
  | "Ready for Collection"
  | "Ready for Dispatch"
  | "Dispatched"
  | "Completed"
  | "Cancelled";

export type StaffPaymentStatus =
  | "Awaiting Verification"
  | "Verified"
  | "Partially Allocated"
  | "Allocated"
  | "Unallocated"
  | "Exception"
  | "Rejected";

export type StaffTransportStatus =
  | "Awaiting Scheduling"
  | "Scheduled"
  | "Truck Assigned"
  | "In Transit"
  | "Completed"
  | "Delayed"
  | "Cancelled";

export type StaffQuotation = {
  id: string;
  company: string;
  contact: string;
  email: string;
  account: string;
  date: string;
  method: "COLLECT" | "DELIVER";
  destination: string;
  lines: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  netCents: number;
  taxRateBps: number;
  taxInclusive?: boolean;
  taxCategory?: "Taxable" | "Exempt" | "Zero-rated (demo only)";
  exemptionReason?: string;
  taxCents: number;
  totalCents: number;
  status: StaffQuotationStatus;
  conditionsAcknowledged: boolean;
  notes: string;
  source?: "customer-portal";
  orderId?: string;
};

export type StaffOrder = {
  id: string;
  quotationId: string;
  customer: string;
  account: string;
  date: string;
  method: "COLLECT" | "DELIVER";
  destination: string;
  lines: StaffQuotation["lines"];
  netCents: number;
  taxCents: number;
  totalCents: number;
  status: StaffOrderStatus;
  completionDate: string;
  note: string;
};

export type StaffPayment = {
  id: string;
  customer: string;
  account: string;
  orderId: string;
  quotationId: string;
  date: string;
  method: "Bank Transfer" | "Direct Deposit" | "Other";
  reference: string;
  amountCents: number;
  status: StaffPaymentStatus;
  allocatedCents: number;
  note: string;
};

export type StaffTransport = {
  id: string;
  orderId: string;
  customer: string;
  origin: string;
  destination: string;
  bags: number;
  distanceKm: number;
  estimatedCostCents: number;
  vehicle: string;
  dispatchDate: string;
  eta: string;
  completedDate: string;
  status: StaffTransportStatus;
  note: string;
};

export type StaffSapRecord = {
  id: string;
  document: string;
  orderId: string;
  account: string;
  date: string;
  netCents: number;
  taxCents: number;
  status: "Matched" | "Pending" | "Mismatch" | "Missing SAP Record" | "Duplicate Review Required";
  note: string;
};

export type StaffTaxAccount = {
  account: string;
  customer: string;
  taxNumber: string;
  status: "Compliant" | "Non-Compliant" | "Pending Verification" | "Exempt" | "Unverified";
  outstanding: string;
  lastReviewed: string;
};

export type StaffNotification = {
  id: string;
  category: "Quotations" | "Orders" | "Payments" | "Transport" | "Tax / Compliance" | "SAP";
  title: string;
  message: string;
  reference: string;
  date: string;
  read: boolean;
};

export type StaffMessage = {
  id: string;
  sender: string;
  body: string;
  date: string;
  internal: boolean;
};

export type StaffThread = {
  id: string;
  customer: string;
  subject: string;
  reference: string;
  category: "Customer Enquiries" | "Quotations" | "Orders" | "Payments" | "Internal";
  status: "Open" | "Awaiting Customer" | "Closed";
  unread: boolean;
  messages: StaffMessage[];
};

export type StaffAuditEntry = {
  id: string;
  date: string;
  actor: string;
  action: string;
  type: string;
  reference: string;
  previous: string;
  next: string;
  reason: string;
};

export type StaffPrice = {
  productId: string;
  priceCents: number;
  updatedAt: string;
  updatedBy: string;
  history: Array<{
    previousCents: number;
    nextCents: number;
    date: string;
    actor: string;
    reason: string;
  }>;
};

export type StaffDemoWorkspace = {
  prices: StaffPrice[];
  quotations: StaffQuotation[];
  orders: StaffOrder[];
  payments: StaffPayment[];
  transport: StaffTransport[];
  sapRecords: StaffSapRecord[];
  taxAccounts: StaffTaxAccount[];
  notifications: StaffNotification[];
  threads: StaffThread[];
  audit: StaffAuditEntry[];
  taxRateBps: number;
  taxInclusive: boolean;
  taxCategory: "Taxable" | "Non-Taxable / Exempt" | "Zero-rated (demo only)";
  taxRecordRequired: boolean;
  taxEffectiveDate: string;
  taxReason: string;
};

const STORAGE_KEY = "ppc-staff-demo-workspace-v1";
export const DEMO_PRODUCT_PRICES_STORAGE_KEY = "ppc-staff-demo-product-prices-v1";
const TODAY = "2026-10-26";

function taxFor(netCents: number, rateBps = 1550) {
  return Math.round((netCents * rateBps) / 10000);
}

function quotation(
  id: string,
  company: string,
  contact: string,
  email: string,
  account: string,
  date: string,
  method: "COLLECT" | "DELIVER",
  destination: string,
  productId: string,
  quantity: number,
  unitPriceCents: number,
  status: StaffQuotationStatus,
  notes = "",
): StaffQuotation {
  const netCents = quantity * unitPriceCents;
  const taxCents = taxFor(netCents);
  return {
    id,
    company,
    contact,
    email,
    account,
    date,
    method,
    destination,
    lines: [{ productId, quantity, unitPriceCents }],
    netCents,
    taxRateBps: 1550,
    taxCents,
    totalCents: netCents + taxCents,
    status,
    conditionsAcknowledged: true,
    notes,
  };
}

const quotations: StaffQuotation[] = [
  quotation(
    "DEMO-QUO-1001",
    "Bulawayo Build Supplies",
    "Tariro Moyo",
    "orders@example.com",
    "DEMO-ACC-1001",
    "2026-10-26",
    "DELIVER",
    "Bulawayo",
    "surecem-32-5n",
    400,
    1200,
    "Awaiting Review",
    "Please confirm delivery availability.",
  ),
  quotation(
    "DEMO-QUO-1002",
    "Matabeleland Construction Services",
    "Kuda Ncube",
    "procurement@example.com",
    "DEMO-ACC-1002",
    "2026-10-25",
    "COLLECT",
    "Bulawayo Collection Point",
    "surecast-42-5r",
    240,
    1300,
    "Information Requested",
    "Tax documents need confirmation.",
  ),
  quotation(
    "DEMO-QUO-1003",
    "Horizon Building Materials",
    "Rudo Dube",
    "sales@example.com",
    "DEMO-ACC-1003",
    "2026-10-24",
    "DELIVER",
    "Harare",
    "surebuild-42-5n",
    320,
    1400,
    "Converted to Order",
  ),
  (() => {
    const record = quotation(
      "DEMO-QUO-1004",
      "Westgate Projects",
      "Tendai Moyo",
      "projects@example.com",
      "DEMO-ACC-1004",
      "2026-10-23",
      "COLLECT",
      "Harare Collection Point",
      "surecem-32-5n",
      200,
      1200,
      "Converted to Order",
      "Sample tax variance of USD 1.00 flagged for compliance review.",
    );
    record.taxCents += 100;
    record.totalCents += 100;
    return record;
  })(),
  quotation(
    "DEMO-QUO-1005",
    "Sunrise Contractors",
    "Nyasha Sibanda",
    "accounts@example.com",
    "DEMO-ACC-1005",
    "2026-10-22",
    "COLLECT",
    "Gweru Collection Point",
    "surecast-42-5r",
    160,
    1300,
    "Converted to Order",
  ),
  quotation(
    "DEMO-QUO-1006",
    "Bulawayo Build Supplies",
    "Tariro Moyo",
    "orders@example.com",
    "DEMO-ACC-1001",
    "2026-10-20",
    "DELIVER",
    "Bulawayo",
    "surebuild-42-5n",
    240,
    1400,
    "Converted to Order",
  ),
  quotation(
    "DEMO-QUO-1007",
    "Matabeleland Construction Services",
    "Kuda Ncube",
    "procurement@example.com",
    "DEMO-ACC-1002",
    "2026-10-18",
    "DELIVER",
    "Victoria Falls",
    "surecem-32-5n",
    160,
    1200,
    "Converted to Order",
  ),
  quotation(
    "DEMO-QUO-1008",
    "Horizon Building Materials",
    "Rudo Dube",
    "sales@example.com",
    "DEMO-ACC-1003",
    "2026-10-16",
    "COLLECT",
    "Harare Collection Point",
    "surecem-32-5n",
    120,
    1200,
    "Rejected",
    "Requested delivery outside the service area.",
  ),
  quotation(
    "DEMO-QUO-1009",
    "Westgate Projects",
    "Tendai Moyo",
    "projects@example.com",
    "DEMO-ACC-1004",
    "2026-10-14",
    "DELIVER",
    "Mutare",
    "surebuild-42-5n",
    200,
    1400,
    "Approved",
  ),
  quotation(
    "DEMO-QUO-1010",
    "Sunrise Contractors",
    "Nyasha Sibanda",
    "accounts@example.com",
    "DEMO-ACC-1005",
    "2026-10-12",
    "COLLECT",
    "Gweru Collection Point",
    "surecem-32-5n",
    80,
    1200,
    "Awaiting Review",
  ),
  (() => {
    const exempt = quotation(
      "DEMO-QUO-1011",
      "Sunrise Contractors",
      "Nyasha Sibanda",
      "accounts@example.com",
      "DEMO-ACC-1005",
      "2026-10-11",
      "COLLECT",
      "Gweru Collection Point",
      "surecem-32-5n",
      40,
      1200,
      "Converted to Order",
      "Demonstration exemption; authorised evidence not verified.",
    );
    exempt.taxRateBps = 0;
    exempt.taxCents = 0;
    exempt.totalCents = exempt.netCents;
    exempt.taxCategory = "Exempt";
    exempt.exemptionReason = "Sample exemption record; verify supporting evidence.";
    return exempt;
  })(),
];

function order(
  quotationId: string,
  status: StaffOrderStatus,
  date: string,
  completionDate = "",
): StaffOrder {
  const item = quotations.find((quote) => quote.id === quotationId);
  if (!item) throw new Error(`Demo quotation ${quotationId} is missing.`);
  const id = `DEMO-ORD-${quotationId.slice(-4)}`;
  item.orderId = id;
  return {
    id,
    quotationId,
    customer: item.company,
    account: item.account,
    date,
    method: item.method,
    destination: item.destination,
    lines: item.lines,
    netCents: item.netCents,
    taxCents: item.taxCents,
    totalCents: item.totalCents,
    status,
    completionDate,
    note: "",
  };
}

export const INITIAL_STAFF_WORKSPACE: StaffDemoWorkspace = {
  prices: [
    {
      productId: "surecem-32-5n",
      priceCents: 1200,
      updatedAt: "2026-10-20",
      updatedBy: "Sales Demo User",
      history: [],
    },
    {
      productId: "surecast-42-5r",
      priceCents: 1300,
      updatedAt: "2026-10-20",
      updatedBy: "Sales Demo User",
      history: [],
    },
    {
      productId: "surebuild-42-5n",
      priceCents: 1400,
      updatedAt: "2026-10-20",
      updatedBy: "Sales Demo User",
      history: [],
    },
  ],
  quotations,
  orders: [
    order("DEMO-QUO-1003", "Processing", "2026-10-24"),
    order("DEMO-QUO-1004", "Awaiting Payment", "2026-10-23"),
    order("DEMO-QUO-1005", "Ready for Collection", "2026-10-22"),
    order("DEMO-QUO-1006", "Dispatched", "2026-10-20"),
    order("DEMO-QUO-1007", "Completed", "2026-10-18", "2026-10-21"),
    order("DEMO-QUO-1008", "Cancelled", "2026-10-16"),
    order("DEMO-QUO-1011", "Processing", "2026-10-11"),
  ],
  payments: [
    {
      id: "DEMO-PAY-2001",
      customer: "Horizon Building Materials",
      account: "DEMO-ACC-1003",
      orderId: "DEMO-ORD-1003",
      quotationId: "DEMO-QUO-1003",
      date: "2026-10-25",
      method: "Bank Transfer",
      reference: "DEMO-BANK-001",
      amountCents: 250000,
      status: "Allocated",
      allocatedCents: 250000,
      note: "Sample verified remittance.",
    },
    {
      id: "DEMO-PAY-2002",
      customer: "Westgate Projects",
      account: "DEMO-ACC-1004",
      orderId: "DEMO-ORD-1004",
      quotationId: "DEMO-QUO-1004",
      date: "2026-10-24",
      method: "Direct Deposit",
      reference: "DEMO-DEP-002",
      amountCents: 50000,
      status: "Awaiting Verification",
      allocatedCents: 0,
      note: "Verification pending in this demo.",
    },
    {
      id: "DEMO-PAY-2003",
      customer: "Sunrise Contractors",
      account: "DEMO-ACC-1005",
      orderId: "DEMO-ORD-1005",
      quotationId: "DEMO-QUO-1005",
      date: "2026-10-23",
      method: "Bank Transfer",
      reference: "DEMO-BANK-003",
      amountCents: 240240,
      status: "Allocated",
      allocatedCents: 240240,
      note: "Sample verified remittance.",
    },
    {
      id: "DEMO-PAY-2004",
      customer: "Bulawayo Build Supplies",
      account: "DEMO-ACC-1001",
      orderId: "DEMO-ORD-1006",
      quotationId: "DEMO-QUO-1006",
      date: "2026-10-22",
      method: "Bank Transfer",
      reference: "DEMO-BANK-004",
      amountCents: 388080,
      status: "Allocated",
      allocatedCents: 388080,
      note: "Sample verified remittance.",
    },
    {
      id: "DEMO-PAY-2005",
      customer: "Matabeleland Construction Services",
      account: "DEMO-ACC-1002",
      orderId: "DEMO-ORD-1007",
      quotationId: "DEMO-QUO-1007",
      date: "2026-10-21",
      method: "Direct Deposit",
      reference: "DEMO-DEP-005",
      amountCents: 221760,
      status: "Allocated",
      allocatedCents: 221760,
      note: "Sample verified remittance.",
    },
    {
      id: "DEMO-PAY-2006",
      customer: "Horizon Building Materials",
      account: "DEMO-ACC-1003",
      orderId: "",
      quotationId: "",
      date: "2026-10-20",
      method: "Other",
      reference: "DEMO-UNALLOC-006",
      amountCents: 45000,
      status: "Unallocated",
      allocatedCents: 0,
      note: "No matching demo order.",
    },
    {
      id: "DEMO-PAY-2007",
      customer: "Westgate Projects",
      account: "DEMO-ACC-1004",
      orderId: "DEMO-ORD-1004",
      quotationId: "DEMO-QUO-1004",
      date: "2026-10-19",
      method: "Bank Transfer",
      reference: "DEMO-EXC-007",
      amountCents: 15000,
      status: "Exception",
      allocatedCents: 0,
      note: "Amount reference requires review.",
    },
    {
      id: "DEMO-PAY-2008",
      customer: "Horizon Building Materials",
      account: "DEMO-ACC-1003",
      orderId: "DEMO-ORD-1003",
      quotationId: "DEMO-QUO-1003",
      date: "2026-10-18",
      method: "Bank Transfer",
      reference: "DEMO-BANK-008",
      amountCents: 200000,
      status: "Verified",
      allocatedCents: 0,
      note: "Sample verification record; not connected to a bank.",
    },
    {
      id: "DEMO-PAY-2009",
      customer: "Horizon Building Materials",
      account: "DEMO-ACC-1003",
      orderId: "DEMO-ORD-1003",
      quotationId: "DEMO-QUO-1003",
      date: "2026-10-17",
      method: "Bank Transfer",
      reference: "DEMO-BANK-009",
      amountCents: 100000,
      status: "Partially Allocated",
      allocatedCents: 50000,
      note: "Sample partial allocation.",
    },
  ],
  transport: [
    {
      id: "DEMO-TRN-3001",
      orderId: "DEMO-ORD-1003",
      customer: "Horizon Building Materials",
      origin: "Harare Depot",
      destination: "Harare",
      bags: 320,
      distanceKm: 18,
      estimatedCostCents: 8400,
      vehicle: "Pending assignment",
      dispatchDate: "",
      eta: "2026-10-28",
      completedDate: "",
      status: "Awaiting Scheduling",
      note: "",
    },
    {
      id: "DEMO-TRN-3002",
      orderId: "DEMO-ORD-1004",
      customer: "Westgate Projects",
      origin: "Harare Depot",
      destination: "Harare",
      bags: 200,
      distanceKm: 24,
      estimatedCostCents: 11200,
      vehicle: "PPC Demo Truck 02",
      dispatchDate: "",
      eta: "2026-10-27",
      completedDate: "",
      status: "Truck Assigned",
      note: "",
    },
    {
      id: "DEMO-TRN-3003",
      orderId: "DEMO-ORD-1006",
      customer: "Bulawayo Build Supplies",
      origin: "Bulawayo Depot",
      destination: "Bulawayo",
      bags: 240,
      distanceKm: 12,
      estimatedCostCents: 6000,
      vehicle: "PPC Demo Truck 01",
      dispatchDate: "2026-10-25",
      eta: "2026-10-27",
      completedDate: "",
      status: "In Transit",
      note: "",
    },
    {
      id: "DEMO-TRN-3004",
      orderId: "DEMO-ORD-1007",
      customer: "Matabeleland Construction Services",
      origin: "Bulawayo Depot",
      destination: "Victoria Falls",
      bags: 160,
      distanceKm: 440,
      estimatedCostCents: 88000,
      vehicle: "PPC Demo Truck 04",
      dispatchDate: "2026-10-19",
      eta: "2026-10-21",
      completedDate: "2026-10-21",
      status: "Completed",
      note: "Completed sample delivery.",
    },
    {
      id: "DEMO-TRN-3005",
      orderId: "DEMO-ORD-1005",
      customer: "Sunrise Contractors",
      origin: "Gweru Depot",
      destination: "Gweru",
      bags: 160,
      distanceKm: 8,
      estimatedCostCents: 4000,
      vehicle: "PPC Demo Truck 03",
      dispatchDate: "",
      eta: "2026-10-28",
      completedDate: "",
      status: "Scheduled",
      note: "",
    },
    {
      id: "DEMO-TRN-3006",
      orderId: "DEMO-ORD-1006",
      customer: "Bulawayo Build Supplies",
      origin: "Bulawayo Depot",
      destination: "Bulawayo",
      bags: 240,
      distanceKm: 12,
      estimatedCostCents: 6000,
      vehicle: "PPC Demo Truck 05",
      dispatchDate: "",
      eta: "2026-10-26",
      completedDate: "",
      status: "Delayed",
      note: "Sample delay; revised delivery time not confirmed.",
    },
  ],
  sapRecords: [
    {
      id: "DEMO-SAP-4001",
      document: "SAP-DEMO-81001",
      orderId: "DEMO-ORD-1003",
      account: "DEMO-ACC-1003",
      date: "2026-10-24",
      netCents: 448000,
      taxCents: taxFor(448000),
      status: "Matched",
      note: "",
    },
    {
      id: "DEMO-SAP-4002",
      document: "SAP-DEMO-81002",
      orderId: "DEMO-ORD-1004",
      account: "DEMO-ACC-1004",
      date: "2026-10-23",
      netCents: 240000,
      taxCents: taxFor(240000),
      status: "Pending",
      note: "",
    },
    {
      id: "DEMO-SAP-4003",
      document: "SAP-DEMO-81003",
      orderId: "DEMO-ORD-1005",
      account: "DEMO-ACC-1005",
      date: "2026-10-22",
      netCents: 312000,
      taxCents: taxFor(312000) + 500,
      status: "Mismatch",
      note: "Tax value differs in this sample record.",
    },
    {
      id: "DEMO-SAP-4004",
      document: "SAP-DEMO-81004",
      orderId: "DEMO-ORD-1006",
      account: "DEMO-ACC-1001",
      date: "2026-10-20",
      netCents: 336000,
      taxCents: taxFor(336000),
      status: "Matched",
      note: "",
    },
    {
      id: "DEMO-SAP-4005",
      document: "Missing reference",
      orderId: "DEMO-ORD-1007",
      account: "DEMO-ACC-1002",
      date: "2026-10-18",
      netCents: 192000,
      taxCents: taxFor(192000),
      status: "Missing SAP Record",
      note: "Sample record has no SAP document reference.",
    },
    {
      id: "DEMO-SAP-4006",
      document: "SAP-DEMO-81006",
      orderId: "DEMO-ORD-1006",
      account: "DEMO-ACC-1001",
      date: "2026-10-20",
      netCents: 336000,
      taxCents: taxFor(336000),
      status: "Duplicate Review Required",
      note: "Possible duplicate sample entry.",
    },
  ],
  taxAccounts: [
    {
      account: "DEMO-ACC-1001",
      customer: "Bulawayo Build Supplies",
      taxNumber: "DEMO-TAX-001",
      status: "Compliant",
      outstanding: "None",
      lastReviewed: "2026-10-20",
    },
    {
      account: "DEMO-ACC-1002",
      customer: "Matabeleland Construction Services",
      taxNumber: "",
      status: "Pending Verification",
      outstanding: "Tax registration confirmation",
      lastReviewed: "2026-10-18",
    },
    {
      account: "DEMO-ACC-1003",
      customer: "Horizon Building Materials",
      taxNumber: "DEMO-TAX-003",
      status: "Compliant",
      outstanding: "None",
      lastReviewed: "2026-10-21",
    },
    {
      account: "DEMO-ACC-1004",
      customer: "Westgate Projects",
      taxNumber: "",
      status: "Non-Compliant",
      outstanding: "Required review documents",
      lastReviewed: "2026-10-17",
    },
    {
      account: "DEMO-ACC-1005",
      customer: "Sunrise Contractors",
      taxNumber: "DEMO-TAX-005",
      status: "Exempt",
      outstanding: "Sample exemption evidence review",
      lastReviewed: "2026-10-11",
    },
  ],
  notifications: [
    {
      id: "DEMO-NOT-001",
      category: "Quotations",
      title: "New quotation submitted",
      message: "Bulawayo Build Supplies submitted a quotation for review.",
      reference: "DEMO-QUO-1001",
      date: "2026-10-26T09:20:00",
      read: false,
    },
    {
      id: "DEMO-NOT-002",
      category: "Quotations",
      title: "Customer information requested",
      message: "Tax documents need confirmation for Matabeleland Construction Services.",
      reference: "DEMO-QUO-1002",
      date: "2026-10-25T14:10:00",
      read: false,
    },
    {
      id: "DEMO-NOT-003",
      category: "Payments",
      title: "Payment awaiting verification",
      message: "A recorded demo payment requires verification.",
      reference: "DEMO-PAY-2002",
      date: "2026-10-24T11:40:00",
      read: false,
    },
    {
      id: "DEMO-NOT-004",
      category: "Orders",
      title: "Order ready for processing",
      message: "A demo quotation was approved and converted to an order.",
      reference: "DEMO-ORD-1003",
      date: "2026-10-24T10:15:00",
      read: true,
    },
    {
      id: "DEMO-NOT-005",
      category: "Transport",
      title: "Transport delayed",
      message: "A sample delivery status requires review.",
      reference: "DEMO-TRN-3006",
      date: "2026-10-23T16:10:00",
      read: false,
    },
    {
      id: "DEMO-NOT-006",
      category: "Tax / Compliance",
      title: "Tax review required",
      message: "A demo customer account needs compliance review.",
      reference: "DEMO-ACC-1004",
      date: "2026-10-22T08:30:00",
      read: true,
    },
    {
      id: "DEMO-NOT-007",
      category: "SAP",
      title: "SAP reconciliation needed",
      message: "A sample SAP record is not reconciled.",
      reference: "DEMO-SAP-4003",
      date: "2026-10-21T13:05:00",
      read: false,
    },
  ],
  threads: [
    {
      id: "DEMO-THR-001",
      customer: "Bulawayo Build Supplies",
      subject: "Delivery availability",
      reference: "DEMO-QUO-1001",
      category: "Quotations",
      status: "Open",
      unread: true,
      messages: [
        {
          id: "DEMO-MSG-001",
          sender: "Tariro Moyo",
          body: "Please confirm delivery availability for our quotation.",
          date: "2026-10-26T09:20:00",
          internal: false,
        },
      ],
    },
    {
      id: "DEMO-THR-002",
      customer: "Horizon Building Materials",
      subject: "Order processing update",
      reference: "DEMO-ORD-1003",
      category: "Orders",
      status: "Awaiting Customer",
      unread: false,
      messages: [
        {
          id: "DEMO-MSG-002",
          sender: "Rudo Dube",
          body: "Could you share an update on our order?",
          date: "2026-10-24T11:05:00",
          internal: false,
        },
      ],
    },
    {
      id: "DEMO-THR-003",
      customer: "Finance Department",
      subject: "Payment reconciliation note",
      reference: "DEMO-PAY-2007",
      category: "Internal",
      status: "Open",
      unread: false,
      messages: [
        {
          id: "DEMO-MSG-003",
          sender: "Sales Demo User",
          body: "Review the sample exception before allocation.",
          date: "2026-10-23T15:00:00",
          internal: true,
        },
      ],
    },
  ],
  audit: [
    {
      id: "DEMO-AUD-001",
      date: "2026-10-24T10:15:00",
      actor: "Sales Demo User",
      action: "Quotation converted to order",
      type: "Quotation",
      reference: "DEMO-QUO-1003",
      previous: "Approved",
      next: "Converted to Order",
      reason: "Initial demonstration record.",
    },
    {
      id: "DEMO-AUD-002",
      date: "2026-10-21T13:05:00",
      actor: "Finance Demo User",
      action: "SAP record flagged",
      type: "SAP",
      reference: "DEMO-SAP-4003",
      previous: "Pending",
      next: "Mismatch",
      reason: "Sample reconciliation exception.",
    },
  ],
  taxRateBps: 1550,
  taxInclusive: false,
  taxCategory: "Taxable",
  taxRecordRequired: false,
  taxEffectiveDate: "2026-01-01",
  taxReason: "Demonstration starting value; verify with authorised finance/compliance staff.",
};

export function readStaffDemoWorkspace(): StaffDemoWorkspace {
  if (typeof window === "undefined") return structuredClone(INITIAL_STAFF_WORKSPACE);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(INITIAL_STAFF_WORKSPACE);
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== "object" ||
    !("quotations" in value) ||
    !Array.isArray(value.quotations) ||
    !("orders" in value) ||
    !Array.isArray(value.orders) ||
    !("prices" in value) ||
    !Array.isArray(value.prices) ||
    !("payments" in value) ||
    !Array.isArray(value.payments) ||
    !("transport" in value) ||
    !Array.isArray(value.transport) ||
    !("sapRecords" in value) ||
    !Array.isArray(value.sapRecords) ||
    !("taxAccounts" in value) ||
    !Array.isArray(value.taxAccounts) ||
    !("notifications" in value) ||
    !Array.isArray(value.notifications) ||
    !("threads" in value) ||
    !Array.isArray(value.threads) ||
    !("audit" in value) ||
    !Array.isArray(value.audit) ||
    !("taxRateBps" in value) ||
    typeof value.taxRateBps !== "number" ||
    !("taxInclusive" in value) ||
    typeof value.taxInclusive !== "boolean" ||
    !("taxCategory" in value) ||
    typeof value.taxCategory !== "string" ||
    !("taxRecordRequired" in value) ||
    typeof value.taxRecordRequired !== "boolean"
  ) {
    throw new Error("Saved staff demo workspace has an invalid format.");
  }
  return value as StaffDemoWorkspace;
}

export function saveStaffDemoWorkspace(workspace: StaffDemoWorkspace) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  window.localStorage.setItem(
    DEMO_PRODUCT_PRICES_STORAGE_KEY,
    JSON.stringify(
      Object.fromEntries(workspace.prices.map((price) => [price.productId, price.priceCents])),
    ),
  );
  window.dispatchEvent(new Event("ppc-demo-prices-updated"));
  window.dispatchEvent(new Event("ppc-staff-workspace-updated"));
}

export const DEMO_STAFF_DATE = TODAY;
