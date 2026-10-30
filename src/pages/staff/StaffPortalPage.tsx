import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  Bell,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  PackageCheck,
  ReceiptText,
  Search,
  Settings,
  Tags,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoAccount } from "@/features/account/demo-account";
import {
  readSubmittedDemoQuotations,
  updateSubmittedDemoQuotationStatus,
} from "@/features/account/demo-portal-quotations";
import {
  DEMO_STAFF_DATE,
  readStaffDemoWorkspace,
  saveStaffDemoWorkspace,
  type StaffAuditEntry,
  type StaffDemoWorkspace,
  type StaffNotification,
  type StaffOrder,
  type StaffOrderStatus,
  type StaffPayment,
  type StaffQuotation,
  type StaffQuotationStatus,
  type StaffTransport,
  type StaffTransportStatus,
} from "@/features/staff/staffDemoData";
import {
  calculateQuotationTotals,
  QUOTATION_PRODUCTS,
  formatQuotationUSD,
} from "@/pages/view-order/quotation-data";
import logoImage from "@/assets/logo.jpg";

export type StaffPortalView =
  | "overview"
  | "notifications"
  | "prices"
  | "price-history"
  | "quotations"
  | "quotation-detail"
  | "orders"
  | "order-detail"
  | "transport"
  | "transport-detail"
  | "sap"
  | "sap-records"
  | "sap-reconciliation"
  | "zimra"
  | "tax-settings"
  | "tax-transactions"
  | "tax-accounts"
  | "tax-reports"
  | "payments"
  | "payment-detail"
  | "communications"
  | "communication-detail"
  | "reports"
  | "audit-log"
  | "settings";

type Props = { view: StaffPortalView; recordId?: string };

const NAVIGATION = [
  { label: "Overview", to: "/staff", Icon: LayoutDashboard, prefix: "/staff", view: "overview" },
  {
    label: "Notifications",
    to: "/staff/notifications",
    Icon: Bell,
    prefix: "/staff/notifications",
    view: "notifications",
  },
  {
    label: "Manage Prices",
    to: "/staff/prices",
    Icon: Tags,
    prefix: "/staff/prices",
    view: "prices",
  },
  {
    label: "Quotations",
    to: "/staff/quotations",
    Icon: FileText,
    prefix: "/staff/quotations",
    view: "quotations",
  },
  {
    label: "Orders",
    to: "/staff/orders",
    Icon: PackageCheck,
    prefix: "/staff/orders",
    view: "orders",
  },
  {
    label: "Transport & Logistics",
    to: "/staff/transport",
    Icon: Truck,
    prefix: "/staff/transport",
    view: "transport",
  },
  { label: "SAP Records", to: "/staff/sap", Icon: Database, prefix: "/staff/sap", view: "sap" },
  {
    label: "ZIMRA Tax",
    to: "/staff/zimra",
    Icon: ReceiptText,
    prefix: "/staff/zimra",
    view: "zimra",
  },
  {
    label: "Payments",
    to: "/staff/payments",
    Icon: CreditCard,
    prefix: "/staff/payments",
    view: "payments",
  },
  {
    label: "Communications",
    to: "/staff/communications",
    Icon: MessagesSquare,
    prefix: "/staff/communications",
    view: "communications",
  },
  {
    label: "Reports",
    to: "/staff/reports",
    Icon: Activity,
    prefix: "/staff/reports",
    view: "reports",
  },
  {
    label: "Audit Log",
    to: "/staff/audit-log",
    Icon: ClipboardList,
    prefix: "/staff/audit-log",
    view: "audit-log",
  },
  {
    label: "Settings",
    to: "/staff/settings",
    Icon: Settings,
    prefix: "/staff/settings",
    view: "settings",
  },
] as const;

const PRODUCT_NAMES: Record<string, string> = {
  "surecem-32-5n": "SURECEM 32,5N",
  "surecast-42-5r": "SURECAST 42,5R",
  "surebuild-42-5n": "SureBuild 42,5N",
};

const PAGE_TITLES: Record<StaffPortalView, string> = {
  overview: "Sales Department Overview",
  notifications: "Notifications",
  prices: "Manage Product Prices",
  "price-history": "Price History",
  quotations: "Submitted Quotations",
  "quotation-detail": "Quotation Details",
  orders: "Sales Orders",
  "order-detail": "Order Details",
  transport: "Transport & Logistics",
  "transport-detail": "Transport Details",
  sap: "SAP Records & Reconciliation",
  "sap-records": "SAP Records",
  "sap-reconciliation": "SAP Reconciliation",
  zimra: "ZIMRA Tax & Compliance",
  "tax-settings": "Tax Settings",
  "tax-transactions": "Tax Transactions",
  "tax-accounts": "Tax Accounts",
  "tax-reports": "Tax Reports",
  payments: "Payments & Reconciliation",
  "payment-detail": "Payment Details",
  communications: "Communications",
  "communication-detail": "Conversation",
  reports: "Sales Reports & Analytics",
  "audit-log": "Audit Log",
  settings: "Staff Settings",
};

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function timeLabel(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB");
}

function bagsIn(lines: StaffQuotation["lines"]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

function outstandingCents(order: StaffOrder, payments: StaffPayment[]) {
  if (order.status === "Cancelled") return 0;
  const paid = payments
    .filter(
      (payment) =>
        payment.orderId === order.id &&
        ["Verified", "Allocated", "Partially Allocated"].includes(payment.status),
    )
    .reduce((sum, payment) => sum + payment.allocatedCents, 0);
  return Math.max(0, order.totalCents - paid);
}

function withAudit(
  current: StaffDemoWorkspace,
  action: string,
  type: string,
  reference: string,
  previous = "",
  next = "",
  reason = "",
): StaffAuditEntry {
  return {
    id: `DEMO-AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    actor: "Sales Demo User",
    action,
    type,
    reference,
    previous,
    next,
    reason,
  };
}

function addNotification(
  current: StaffDemoWorkspace,
  category: StaffNotification["category"],
  title: string,
  message: string,
  reference: string,
): StaffNotification {
  return {
    id: `DEMO-NOT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    title,
    message,
    reference,
    date: new Date().toISOString(),
    read: false,
  };
}

function notifyCustomerPortal(
  category: "Quotations" | "Orders" | "Transport",
  title: string,
  message: string,
  reference: string,
  href: string,
) {
  const key = "ppc-customer-demo-notifications-v1";
  const raw = window.localStorage.getItem(key);
  const notifications: unknown = raw ? JSON.parse(raw) : [];
  if (
    !Array.isArray(notifications) ||
    !notifications.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string" &&
        "read" in item &&
        typeof item.read === "boolean",
    )
  ) {
    throw new Error("Saved customer demo notifications have an invalid format.");
  }
  window.localStorage.setItem(
    key,
    JSON.stringify([
      {
        id: `staff-update-${Date.now()}`,
        category,
        title,
        message,
        reference,
        href,
        date: new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date()),
        read: false,
      },
      ...notifications,
    ]),
  );
}

function StatusBadge({ children }: { children: string }) {
  const key = children.toLowerCase();
  const tone = /completed|matched|allocated|verified|compliant|approved|ready/.test(key)
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : /review|pending|awaiting|scheduled|processing|transit|requested/.test(key)
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : /reject|cancel|exception|mismatch|delayed|non-compliant/.test(key)
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}

function PageHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17212B] sm:text-[30px]">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#718096]">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white shadow-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#E5EAF0] px-5 py-3">
        <h2 className="text-base font-semibold text-[#17212B]">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  Icon,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: typeof Activity;
  to?: string;
}) {
  const body = (
    <div className="flex min-h-[122px] items-start justify-between gap-3 rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-[#718096]">{label}</p>
        <p className="mt-3 text-[26px] font-bold leading-none text-[#17212B]">{value}</p>
        {hint && <p className="mt-2 text-xs text-[#718096]">{hint}</p>}
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FCF6F7] text-[#E30613]">
        <Icon aria-hidden="true" className="size-5" />
      </span>
    </div>
  );
  return to ? (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E30613]"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function TableFrame({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5EAF0] text-xs font-semibold uppercase tracking-wide text-[#718096]">
            {headers.map((header) => (
              <th key={header} className="px-3 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF1F4]">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-3.5 align-middle text-[#40536A] ${className}`}>{children}</td>;
}

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-[#718096]">{label}</span>
      <span
        className={`break-words text-sm ${strong ? "font-bold text-[#17212B]" : "font-medium text-[#40536A]"}`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#D8E0E8] px-5 py-10 text-center text-sm text-[#718096]">
      {children}
    </div>
  );
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_STAFF_PREFERENCES = {
  email: true,
  quotationAlerts: true,
  paymentAlerts: true,
  transportAlerts: true,
};

function readStaffPreferences() {
  if (typeof window === "undefined") return DEFAULT_STAFF_PREFERENCES;
  try {
    const saved = window.localStorage.getItem("ppc-staff-demo-preferences-v1");
    return saved
      ? { ...DEFAULT_STAFF_PREFERENCES, ...JSON.parse(saved) }
      : DEFAULT_STAFF_PREFERENCES;
  } catch (error) {
    console.error("Could not read staff demo preferences.", error);
    return DEFAULT_STAFF_PREFERENCES;
  }
}

export function StaffPortalPage({ view, recordId }: Props) {
  const { isStaffAuthenticated, signOut } = useDemoAccount();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [data, setData] = useState<StaffDemoWorkspace>(readStaffDemoWorkspace);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [priceEditId, setPriceEditId] = useState("");
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState((data.taxRateBps / 100).toFixed(2));
  const [taxReasonInput, setTaxReasonInput] = useState("");
  const [taxInclusiveInput, setTaxInclusiveInput] = useState(data.taxInclusive);
  const [taxCategoryInput, setTaxCategoryInput] = useState(data.taxCategory);
  const [taxRecordRequiredInput, setTaxRecordRequiredInput] = useState(data.taxRecordRequired);
  const [reportDateRange, setReportDateRange] = useState({ from: "", to: "" });
  const [reportProduct, setReportProduct] = useState("All");
  const [reportQuotationStatus, setReportQuotationStatus] = useState("All");
  const [reportPaymentStatus, setReportPaymentStatus] = useState("All");
  const [reportShipping, setReportShipping] = useState("All");
  const [preferences, setPreferences] = useState(readStaffPreferences);

  useEffect(() => {
    saveStaffDemoWorkspace(data);
  }, [data]);

  useEffect(() => {
    try {
      const submitted = readSubmittedDemoQuotations();
      setData((current) => {
        let changed = false;
        const additions = submitted
          .filter((record) => !current.quotations.some((quote) => quote.id === record.id))
          .map((record): StaffQuotation => {
            const date = new Date(record.date);
            const submittedDate = Number.isNaN(date.getTime())
              ? DEMO_STAFF_DATE
              : date.toISOString().slice(0, 10);
            const customer = record.customer;
            const lines = record.lines.map((line) => ({ ...line }));
            const taxRateBps = record.taxRateBps ?? 1550;
            const taxInclusive = record.taxInclusive ?? false;
            const totals = calculateQuotationTotals(
              lines.map((line) => ({
                id: line.productId,
                qty: line.quantity,
                unitPriceCents: line.unitPriceCents,
              })),
              taxRateBps,
              taxInclusive,
            );
            changed = true;
            return {
              id: record.id,
              company: customer?.company || "Customer Portal Demo Account",
              contact: customer?.contact || "Demo customer",
              email: customer?.email || "demo@example.com",
              account: customer?.accountNumber || "DEMO-CUSTOMER",
              date: submittedDate,
              method: record.method,
              destination: customer?.destination || "Not provided",
              lines,
              netCents: totals.amountExcludingVatCents,
              taxRateBps,
              taxInclusive,
              taxCategory: record.taxCategory ?? (taxRateBps === 0 ? "Exempt" : "Taxable"),
              ...(record.exemptionReason ? { exemptionReason: record.exemptionReason } : {}),
              taxCents: totals.outputTaxCents,
              totalCents: totals.totalCents,
              status:
                record.status === "Information Requested" ||
                record.status === "Approved" ||
                record.status === "Rejected" ||
                record.status === "Converted to Order"
                  ? record.status
                  : "Awaiting Review",
              conditionsAcknowledged: record.conditionsAcknowledged === true,
              notes: "",
              source: "customer-portal",
            };
          });
        return changed
          ? { ...current, quotations: [...additions, ...current.quotations] }
          : current;
      });
    } catch (error) {
      console.error(
        "Could not import customer-submitted demo quotations into the staff workspace.",
        error,
      );
      setMessage("Submitted demo quotations could not be loaded from this browser.");
    }
  }, []);

  if (!isStaffAuthenticated) return <Navigate to="/login" replace />;

  const unreadCount = data.notifications.filter((item) => !item.read).length;
  const byOrder = (id: string) => data.orders.find((order) => order.id === id);
  const byQuotation = (id: string) => data.quotations.find((quotation) => quotation.id === id);
  const byProduct = (id: string) => QUOTATION_PRODUCTS.find((product) => product.id === id);
  const routeFor = (target: string) => {
    const notification = data.notifications.find((item) => item.reference === target);
    if (notification?.category === "Quotations" || target.startsWith("DEMO-QUO")) {
      void navigate({ to: "/staff/quotations/$quotationId", params: { quotationId: target } });
    } else if (notification?.category === "Payments" || target.startsWith("DEMO-PAY")) {
      void navigate({ to: "/staff/payments/$paymentId", params: { paymentId: target } });
    } else if (notification?.category === "Transport" || target.startsWith("DEMO-TRN")) {
      void navigate({ to: "/staff/transport/$transportId", params: { transportId: target } });
    } else if (target.startsWith("DEMO-ORD")) {
      void navigate({ to: "/staff/orders/$orderId", params: { orderId: target } });
    } else if (target.startsWith("DEMO-THR")) {
      void navigate({ to: "/staff/communications/$threadId", params: { threadId: target } });
    } else if (target.startsWith("DEMO-SAP")) {
      void navigate({ to: "/staff/sap/records" });
    } else {
      void navigate({ to: "/staff/zimra/accounts" });
    }
  };
  const commit = (next: StaffDemoWorkspace) => {
    setData(next);
    setMessage("Demo workspace updated locally.");
  };
  const recordAudit = (
    current: StaffDemoWorkspace,
    action: string,
    type: string,
    reference: string,
    previous = "",
    next = "",
    reason = "",
  ) => [withAudit(current, action, type, reference, previous, next, reason), ...current.audit];
  const protectSignOut = () => {
    signOut();
    void navigate({ to: "/login" });
  };
  const createOrder = (quote: StaffQuotation) => {
    if (quote.orderId || data.orders.some((order) => order.quotationId === quote.id)) {
      setMessage("This quotation already has a sales order.");
      return;
    }
    const id = `DEMO-ORD-${quote.id.slice(-4)}`;
    const newOrder: StaffOrder = {
      id,
      quotationId: quote.id,
      customer: quote.company,
      account: quote.account,
      date: DEMO_STAFF_DATE,
      method: quote.method,
      destination: quote.destination,
      lines: quote.lines.map((line) => ({ ...line })),
      netCents: quote.netCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      status: "Processing",
      completionDate: "",
      note: "",
    };
    const updatedQuote = { ...quote, status: "Converted to Order" as const, orderId: id };
    const audit = recordAudit(
      data,
      "Quotation converted to sales order",
      "Quotation",
      quote.id,
      quote.status,
      "Converted to Order",
    );
    const notification = addNotification(
      data,
      "Orders",
      "Sales order created",
      `A sales order was created from ${quote.id}.`,
      id,
    );
    commit({
      ...data,
      quotations: data.quotations.map((item) => (item.id === quote.id ? updatedQuote : item)),
      orders: [newOrder, ...data.orders],
      audit,
      notifications: [notification, ...data.notifications],
    });
    updateSubmittedDemoQuotationStatus(quote.id, "Converted to Order");
    if (quote.source === "customer-portal") {
      notifyCustomerPortal(
        "Orders",
        "Quotation processed",
        `Your quotation ${quote.id} was converted to a demo sales order.`,
        quote.id,
        `/customer/orders/${encodeURIComponent(id)}`,
      );
    }
  };
  const updateQuotation = (quote: StaffQuotation, status: StaffQuotationStatus, reason = "") => {
    const audit = recordAudit(
      data,
      `Quotation ${status.toLowerCase()}`,
      "Quotation",
      quote.id,
      quote.status,
      status,
      reason,
    );
    const updatedQuote = { ...quote, status, notes: reason || quote.notes };
    const notifications = [
      addNotification(
        data,
        "Quotations",
        `Quotation ${status.toLowerCase()}`,
        `${quote.id} is now ${status.toLowerCase()}.`,
        quote.id,
      ),
      ...data.notifications,
    ];
    commit({
      ...data,
      quotations: data.quotations.map((item) => (item.id === quote.id ? updatedQuote : item)),
      audit,
      notifications,
    });
    updateSubmittedDemoQuotationStatus(
      quote.id,
      status === "Awaiting Review" ? "Pending Review" : status,
    );
    if (quote.source === "customer-portal") {
      notifyCustomerPortal(
        "Quotations",
        `Quotation ${status.toLowerCase()}`,
        `Your quotation ${quote.id} is now ${status.toLowerCase()}.${reason ? ` ${reason}` : ""}`,
        quote.id,
        `/customer/quotations/${encodeURIComponent(quote.id)}`,
      );
    }
  };
  const setOrderStatus = (order: StaffOrder, status: StaffOrderStatus) => {
    const allowed: Record<StaffOrderStatus, StaffOrderStatus[]> = {
      Processing: ["Awaiting Payment", "Cancelled"],
      "Awaiting Payment": ["Processing", "Ready for Collection", "Ready for Dispatch", "Cancelled"],
      "Ready for Collection": ["Completed", "Cancelled"],
      "Ready for Dispatch": ["Dispatched", "Cancelled"],
      Dispatched: ["Completed"],
      Completed: [],
      Cancelled: [],
    };
    if (!allowed[order.status].includes(status)) {
      setMessage(`The ${order.status} to ${status} transition is not available.`);
      return;
    }
    if (
      ["Ready for Collection", "Ready for Dispatch", "Dispatched", "Completed"].includes(status) &&
      outstandingCents(order, data.payments) > 0
    ) {
      setMessage(
        "A positive outstanding balance remains. The order status cannot advance to fulfilment.",
      );
      return;
    }
    const reason =
      status === "Cancelled"
        ? window.prompt("Enter the required reason for cancellation:")?.trim()
        : "";
    if (status === "Cancelled" && !reason) return;
    if (!window.confirm(`Confirm changing ${order.id} from ${order.status} to ${status}?`)) return;
    const updatedOrder = {
      ...order,
      status,
      completionDate:
        status === "Completed" ? new Date().toISOString().slice(0, 10) : order.completionDate,
    };
    if (reason) updatedOrder.note = reason;
    const audit = recordAudit(
      data,
      "Order status changed",
      "Order",
      order.id,
      order.status,
      status,
      reason || "",
    );
    const notifications = [
      addNotification(
        data,
        "Orders",
        "Order status updated",
        `${order.id} is now ${status}.`,
        order.id,
      ),
      ...data.notifications,
    ];
    commit({
      ...data,
      orders: data.orders.map((item) => (item.id === order.id ? updatedOrder : item)),
      audit,
      notifications,
    });
    if (byQuotation(order.quotationId)?.source === "customer-portal") {
      notifyCustomerPortal(
        "Orders",
        "Order status updated",
        `Your order ${order.id} is now ${status}.`,
        order.id,
        `/customer/orders/${encodeURIComponent(order.id)}`,
      );
    }
  };
  const setTransportStatus = (record: StaffTransport, status: StaffTransportStatus) => {
    const allowed: Record<StaffTransportStatus, StaffTransportStatus[]> = {
      "Awaiting Scheduling": ["Scheduled", "Cancelled"],
      Scheduled: ["Truck Assigned", "Cancelled", "Delayed"],
      "Truck Assigned": ["In Transit", "Cancelled", "Delayed"],
      "In Transit": ["Completed", "Delayed"],
      Completed: [],
      Delayed: ["Scheduled", "Truck Assigned", "In Transit", "Cancelled"],
      Cancelled: [],
    };
    if (!allowed[record.status].includes(status)) {
      setMessage(`The ${record.status} to ${status} transition is not available.`);
      return;
    }
    const reason =
      status === "Cancelled"
        ? window.prompt("Enter the required reason for cancellation:")?.trim()
        : "";
    if (status === "Cancelled" && !reason) return;
    if (!window.confirm(`Confirm marking ${record.id} as ${status}?`)) return;
    const updated = {
      ...record,
      status,
      completedDate:
        status === "Completed" ? new Date().toISOString().slice(0, 10) : record.completedDate,
      ...(reason ? { note: reason } : {}),
    };
    const audit = recordAudit(
      data,
      "Transport status changed",
      "Transport",
      record.id,
      record.status,
      status,
      reason || "",
    );
    const notifications = [
      addNotification(
        data,
        "Transport",
        `Transport ${status.toLowerCase()}`,
        `${record.id} is now ${status}.`,
        record.id,
      ),
      ...data.notifications,
    ];
    commit({
      ...data,
      transport: data.transport.map((item) => (item.id === record.id ? updated : item)),
      audit,
      notifications,
    });
    if (byQuotation(byOrder(record.orderId)?.quotationId ?? "")?.source === "customer-portal") {
      notifyCustomerPortal(
        "Transport",
        "Transport status updated",
        `${record.id} is now ${status}.`,
        record.orderId,
        `/customer/orders/${encodeURIComponent(record.orderId)}`,
      );
    }
  };
  const openDetail = (target: string) => routeFor(target);
  const actionButton = (label: string, onClick: () => void, secondary = false) => (
    <Button
      type="button"
      variant={secondary ? "outline" : "default"}
      size="sm"
      onClick={onClick}
      className={
        secondary ? "border-[#D9E1E8] text-[#40536A]" : "bg-[#E30613] text-white hover:bg-[#C90016]"
      }
    >
      {label}
    </Button>
  );
  const heading = (
    <PageHeading
      title={PAGE_TITLES[view]}
      {...(view === "overview"
        ? {
            subtitle:
              "Monitor quotations, orders, payments, transport and compliance from one place.",
          }
        : {})}
    />
  );

  const renderNotifications = () => {
    const categories = [
      "All",
      "Unread",
      "Quotations",
      "Orders",
      "Payments",
      "Transport",
      "Tax / Compliance",
      "SAP",
    ];
    const filtered = data.notifications.filter((item) => {
      const categoryMatch =
        filter === "All" || (filter === "Unread" ? !item.read : item.category === filter);
      return (
        categoryMatch &&
        `${item.title} ${item.message} ${item.reference}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
    const markRead = (id: string, read: boolean) =>
      commit({
        ...data,
        notifications: data.notifications.map((item) =>
          item.id === id ? { ...item, read } : item,
        ),
      });
    return (
      <>
        {heading}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Total Notifications"
            value={String(data.notifications.length)}
            Icon={Bell}
          />
          <Metric label="Unread Notifications" value={String(unreadCount)} Icon={CircleAlert} />
          <Metric
            label="Quotations"
            value={String(
              data.notifications.filter((item) => item.category === "Quotations").length,
            )}
            Icon={FileText}
          />
          <Metric
            label="Payments"
            value={String(data.notifications.filter((item) => item.category === "Payments").length)}
            Icon={CreditCard}
          />
          <Metric
            label="Transport & Orders"
            value={String(
              data.notifications.filter((item) => ["Transport", "Orders"].includes(item.category))
                .length,
            )}
            Icon={Truck}
          />
        </div>
        <Panel
          title="Notification centre"
          action={actionButton(
            "Mark all as read",
            () =>
              commit({
                ...data,
                notifications: data.notifications.map((item) => ({ ...item, read: true })),
              }),
            true,
          )}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          {filtered.length ? (
            <div className="divide-y divide-[#EEF1F4]">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 py-4 ${!item.read ? "bg-[#FCF6F7]/70" : ""}`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F4F8] text-[#40536A]">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#17212B]">{item.title}</p>
                      {!item.read && <span className="size-2 rounded-full bg-[#E30613]" />}
                    </div>
                    <p className="mt-1 text-sm text-[#718096]">{item.message}</p>
                    <p className="mt-1 text-xs text-[#718096]">
                      {item.category} · {item.reference} · {timeLabel(item.date)}
                    </p>
                  </div>
                  {actionButton("Open", () => openDetail(item.reference), true)}
                  {actionButton(
                    item.read ? "Mark unread" : "Mark read",
                    () => markRead(item.id, !item.read),
                    true,
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No notifications match your filters.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderOverview = () => {
    const submitted = data.quotations.filter((quote) =>
      ["Awaiting Review", "Information Requested"].includes(quote.status),
    );
    const processing = data.orders.filter(
      (order) => !["Completed", "Cancelled"].includes(order.status),
    );
    const outstanding = data.orders.reduce(
      (sum, order) => sum + outstandingCents(order, data.payments),
      0,
    );
    const inTransit = data.transport.filter((record) =>
      ["Dispatched", "In Transit"].includes(record.status),
    ).length;
    const taxReview = data.taxAccounts.filter((account) =>
      ["Non-Compliant", "Pending Verification", "Unverified"].includes(account.status),
    ).length;
    const sapReview = data.sapRecords.filter((record) => record.status !== "Matched").length;
    const recentQuotes = data.quotations.slice(0, 5);
    const recentOrders = data.orders.slice(0, 4);
    const recentTransport = data.transport.slice(0, 4);
    const activity = data.audit.slice(0, 6);
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10);
      return {
        date,
        quotes: data.quotations.filter((quote) => quote.date === date).length,
        orders: data.orders.filter((order) => order.date === date).length,
      };
    });
    const max = Math.max(1, ...daily.map((item) => item.quotes + item.orders));
    return (
      <>
        {heading}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            label="Submitted Quotations"
            value={String(submitted.length)}
            Icon={FileText}
            to="/staff/quotations"
            hint="Awaiting staff attention"
          />
          <Metric
            label="Orders Processing"
            value={String(processing.length)}
            Icon={PackageCheck}
            to="/staff/orders"
          />
          <Metric
            label="Payments Outstanding"
            value={formatQuotationUSD(outstanding)}
            Icon={CreditCard}
            to="/staff/payments"
            hint="Calculated from verified allocations"
          />
          <Metric
            label="Transport In Progress"
            value={String(inTransit)}
            Icon={Truck}
            to="/staff/transport"
          />
          <Metric
            label="Tax Review Required"
            value={String(taxReview)}
            Icon={ReceiptText}
            to="/staff/zimra"
          />
          <Metric
            label="SAP Reconciliation"
            value={String(sapReview)}
            Icon={Database}
            to="/staff/sap/reconciliation"
          />
        </div>
        <div className="mb-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Sales activity · last 7 days">
            <p className="mb-4 text-xs text-[#718096]">
              Demonstration quotation and order counts by date.
            </p>
            <div className="flex h-44 items-end gap-3 border-b border-[#E5EAF0] px-2">
              {daily.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div className="flex h-[78%] w-full max-w-10 items-end gap-1">
                    <div
                      className="w-1/2 rounded-t bg-[#E30613]"
                      style={{ height: `${Math.max(4, (day.quotes / max) * 100)}%` }}
                      title={`${day.quotes} quotations`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-[#93A4B8]"
                      style={{ height: `${Math.max(4, (day.orders / max) * 100)}%` }}
                      title={`${day.orders} orders`}
                    />
                  </div>
                  <span className="text-[10px] text-[#718096]">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-5 text-xs text-[#718096]">
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-[#E30613]" />
                Quotations
              </span>
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-[#93A4B8]" />
                Orders
              </span>
            </div>
          </Panel>
          <Panel title="Recent activity">
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#E30613]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#17212B]">{item.action}</p>
                    <p className="mt-1 text-xs text-[#718096]">
                      {item.reference} · {timeLabel(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel
            title="Recent quotations"
            action={
              <Link to="/staff/quotations" className="text-sm font-semibold text-[#E30613]">
                View all
              </Link>
            }
          >
            <TableFrame
              headers={["Quotation", "Customer", "Submitted", "Bags", "Total USD", "Status", ""]}
            >
              {recentQuotes.map((quote) => (
                <tr key={quote.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(quote.id)}
                    >
                      {quote.id}
                    </button>
                  </Cell>
                  <Cell>{quote.company}</Cell>
                  <Cell>{formatDate(quote.date)}</Cell>
                  <Cell>{bagsIn(quote.lines)}</Cell>
                  <Cell>{formatQuotationUSD(quote.totalCents)}</Cell>
                  <Cell>
                    <StatusBadge>{quote.status}</StatusBadge>
                  </Cell>
                  <Cell>{actionButton("View", () => openDetail(quote.id), true)}</Cell>
                </tr>
              ))}
            </TableFrame>
          </Panel>
          <Panel
            title="Recent orders"
            action={
              <Link to="/staff/orders" className="text-sm font-semibold text-[#E30613]">
                View all
              </Link>
            }
          >
            <TableFrame headers={["Order", "Customer", "Date", "Total USD", "Payment", "Status"]}>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(order.id)}
                    >
                      {order.id}
                    </button>
                  </Cell>
                  <Cell>{order.customer}</Cell>
                  <Cell>{formatDate(order.date)}</Cell>
                  <Cell>{formatQuotationUSD(order.totalCents)}</Cell>
                  <Cell>
                    {formatQuotationUSD(order.totalCents - outstandingCents(order, data.payments))}{" "}
                    paid
                  </Cell>
                  <Cell>
                    <StatusBadge>{order.status}</StatusBadge>
                  </Cell>
                </tr>
              ))}
            </TableFrame>
          </Panel>
        </div>
        <div className="mt-5">
          <Panel
            title="Recent transport"
            action={
              <Link to="/staff/transport" className="text-sm font-semibold text-[#E30613]">
                View all
              </Link>
            }
          >
            <TableFrame
              headers={[
                "Transport Reference",
                "Related Order",
                "Destination",
                "Truck Status",
                "Estimated Arrival",
              ]}
            >
              {recentTransport.map((record) => (
                <tr key={record.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(record.id)}
                    >
                      {record.id}
                    </button>
                  </Cell>
                  <Cell>{record.orderId}</Cell>
                  <Cell>{record.destination}</Cell>
                  <Cell>
                    <StatusBadge>{record.status}</StatusBadge>
                  </Cell>
                  <Cell>{formatDate(record.eta)}</Cell>
                </tr>
              ))}
            </TableFrame>
          </Panel>
        </div>
      </>
    );
  };

  const renderPrices = () => {
    const editing = data.prices.find((price) => price.productId === priceEditId);
    const product = editing && byProduct(editing.productId);
    const savePrice = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editing) return;
      const form = new FormData(event.currentTarget);
      const price = Number(form.get("newPrice"));
      const reason = String(form.get("reason") ?? "").trim();
      if (!Number.isFinite(price) || price <= 0 || !reason) {
        setMessage("Enter a positive price and a reason for the change.");
        return;
      }
      const nextCents = Math.round(price * 100);
      if (
        !window.confirm(
          `Confirm the new price of ${formatQuotationUSD(nextCents)} for ${product?.material ?? editing.productId}?`,
        )
      )
        return;
      const now = new Date().toISOString();
      const updatedPrice = {
        ...editing,
        priceCents: nextCents,
        updatedAt: now.slice(0, 10),
        updatedBy: "Sales Demo User",
        history: [
          {
            previousCents: editing.priceCents,
            nextCents,
            date: now,
            actor: "Sales Demo User",
            reason,
          },
          ...editing.history,
        ],
      };
      const audit = recordAudit(
        data,
        "Product price updated",
        "Product",
        editing.productId,
        formatQuotationUSD(editing.priceCents),
        formatQuotationUSD(nextCents),
        reason,
      );
      commit({
        ...data,
        prices: data.prices.map((priceItem) =>
          priceItem.productId === editing.productId ? updatedPrice : priceItem,
        ),
        audit,
      });
      setPriceEditId("");
    };
    return (
      <>
        {heading}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span>
            Prices shown here are local demonstration settings. Existing quotations and orders keep
            their saved prices; changes apply only to new quotation activity.
          </span>
          <Link to="/staff/prices/history" className="font-semibold text-[#C90016]">
            View price history →
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.prices.map((price) => {
            const item = byProduct(price.productId);
            if (!item) return null;
            return (
              <article
                key={price.productId}
                className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white shadow-sm"
              >
                <div className="flex h-44 items-center justify-center bg-[#F6F7F9] p-5">
                  <img
                    src={item.image}
                    alt={item.material}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="font-semibold text-[#17212B]">{item.material}</h2>
                    <p className="mt-1 text-xs text-[#718096]">SKU: {price.productId}</p>
                  </div>
                  <div className="text-2xl font-bold text-[#17212B]">
                    {formatQuotationUSD(price.priceCents)}{" "}
                    <span className="text-sm font-medium text-[#718096]">per bag</span>
                  </div>
                  <p className="text-xs leading-5 text-[#718096]">
                    Last updated {timeLabel(price.updatedAt)} by {price.updatedBy}
                  </p>
                  {actionButton("Edit price", () => setPriceEditId(price.productId))}
                </div>
              </article>
            );
          })}
        </div>
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#17212B]/45 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPriceEditId("");
            }}
          >
            <form
              onSubmit={savePrice}
              className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="price-dialog-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="price-dialog-title" className="text-lg font-bold text-[#17212B]">
                    Edit product price
                  </h2>
                  <p className="mt-1 text-sm text-[#718096]">{product?.material}</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setPriceEditId("")}>
                  <X className="size-5" />
                </button>
              </div>
              <p className="rounded-lg bg-[#F5F7FA] p-3 text-sm text-[#40536A]">
                Current price: <strong>{formatQuotationUSD(editing.priceCents)}</strong>
              </p>
              <div>
                <Label htmlFor="new-price">New price (USD per bag)</Label>
                <Input
                  id="new-price"
                  name="newPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={(editing.priceCents / 100).toFixed(2)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price-reason">Reason for change</Label>
                <textarea
                  id="price-reason"
                  name="reason"
                  required
                  className="mt-1.5 min-h-20 w-full rounded-md border border-[#D9E1E8] p-3 text-sm"
                />
              </div>
              <p className="text-xs text-[#718096]">
                The change is recorded in price history and the demo audit log. Historical records
                are not rewritten.
              </p>
              <div className="flex justify-end gap-2">
                {actionButton("Cancel", () => setPriceEditId(""), true)}
                <Button type="submit" className="bg-[#E30613] text-white hover:bg-[#C90016]">
                  Save price
                </Button>
              </div>
            </form>
          </div>
        )}
      </>
    );
  };

  const renderPriceHistory = () => {
    const records = data.prices.flatMap((price) =>
      price.history.map((entry) => ({ ...entry, productId: price.productId })),
    );
    return (
      <>
        {heading}
        <Panel title="Price changes">
          {records.length ? (
            <TableFrame
              headers={[
                "Product",
                "Previous Price",
                "New Price",
                "Currency",
                "Change Date",
                "Changed By",
                "Reason",
              ]}
            >
              {records.map((record, index) => (
                <tr key={`${record.productId}-${index}`}>
                  <Cell>{PRODUCT_NAMES[record.productId]}</Cell>
                  <Cell>{formatQuotationUSD(record.previousCents)}</Cell>
                  <Cell>{formatQuotationUSD(record.nextCents)}</Cell>
                  <Cell>USD</Cell>
                  <Cell>{timeLabel(record.date)}</Cell>
                  <Cell>{record.actor}</Cell>
                  <Cell>{record.reason}</Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No price changes have been recorded in this demo workspace.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderQuotations = () => {
    const statuses = [
      "All",
      "Awaiting Review",
      "Information Requested",
      "Approved",
      "Rejected",
      "Converted to Order",
    ];
    const quotes = data.quotations.filter(
      (quote) =>
        (filter === "All" || quote.status === filter) &&
        `${quote.id} ${quote.company} ${quote.account}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    return (
      <>
        {heading}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total Submitted" value={String(data.quotations.length)} Icon={FileText} />
          <Metric
            label="Awaiting Review"
            value={String(
              data.quotations.filter((quote) => quote.status === "Awaiting Review").length,
            )}
            Icon={CircleAlert}
          />
          <Metric
            label="Information Requested"
            value={String(
              data.quotations.filter((quote) => quote.status === "Information Requested").length,
            )}
            Icon={MessagesSquare}
          />
          <Metric
            label="Approved / Ready"
            value={String(data.quotations.filter((quote) => quote.status === "Approved").length)}
            Icon={Check}
          />
          <Metric
            label="Rejected / Returned"
            value={String(data.quotations.filter((quote) => quote.status === "Rejected").length)}
            Icon={X}
          />
        </div>
        <Panel
          title="Submitted quotations"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search quotation, company or account"
                className="w-64 pl-9"
              />
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === status ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
              >
                {status}
              </button>
            ))}
          </div>
          {quotes.length ? (
            <TableFrame
              headers={[
                "Quotation Number",
                "Customer / Company",
                "Submitted",
                "Shipping",
                "Bags",
                "Net USD",
                "VAT",
                "Total USD",
                "Status",
                "Actions",
              ]}
            >
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(quote.id)}
                    >
                      {quote.id}
                    </button>
                  </Cell>
                  <Cell>
                    <span className="font-medium text-[#17212B]">{quote.company}</span>
                    <span className="block text-xs text-[#718096]">{quote.account}</span>
                  </Cell>
                  <Cell>{formatDate(quote.date)}</Cell>
                  <Cell>{quote.method}</Cell>
                  <Cell>{bagsIn(quote.lines)}</Cell>
                  <Cell>{formatQuotationUSD(quote.netCents)}</Cell>
                  <Cell>{formatQuotationUSD(quote.taxCents)}</Cell>
                  <Cell className="font-semibold text-[#17212B]">
                    {formatQuotationUSD(quote.totalCents)}
                  </Cell>
                  <Cell>
                    <StatusBadge>{quote.status}</StatusBadge>
                  </Cell>
                  <Cell>
                    <div className="flex gap-2">
                      {actionButton("View", () => openDetail(quote.id), true)}
                      {quote.status === "Approved" &&
                        actionButton("Process", () => createOrder(quote))}
                    </div>
                  </Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No quotations match the current filters.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderQuotationDetail = () => {
    const quote = data.quotations.find((item) => item.id === recordId);
    if (!quote)
      return (
        <>
          {heading}
          <EmptyState>This quotation is not available in the demo dataset.</EmptyState>
        </>
      );
    const askReason = (action: "Information Requested" | "Rejected") => {
      const reason = window.prompt(
        action === "Rejected"
          ? "Enter the required reason for rejection:"
          : "Enter the information required from the customer:",
      );
      if (!reason?.trim()) return;
      updateQuotation(quote, action, reason.trim());
    };
    return (
      <>
        {heading}
        <button
          onClick={() => void navigate({ to: "/staff/quotations" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E30613]"
        >
          <ArrowLeft className="size-4" />
          All quotations
        </button>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            <Panel title="Quotation summary">
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Quotation number" value={quote.id} />
                <Info label="Customer / company" value={quote.company} />
                <Info label="Contact" value={quote.contact} />
                <Info label="Email" value={quote.email} />
                <Info label="Account number" value={quote.account} />
                <Info label="Submission date" value={formatDate(quote.date)} />
                <Info label="Shipping condition" value={quote.method} />
                <Info label="Destination" value={quote.destination} />
                <Info
                  label="Conditions of Sale"
                  value={quote.conditionsAcknowledged ? "Acknowledged" : "Not acknowledged"}
                />
                <Info label="Customer notes" value={quote.notes || "None supplied"} />
              </div>
            </Panel>
            <Panel title="Product lines">
              <TableFrame headers={["Product", "Quantity", "Unit Price", "Line Total"]}>
                {quote.lines.map((line) => (
                  <tr key={line.productId}>
                    <Cell>{PRODUCT_NAMES[line.productId] ?? line.productId}</Cell>
                    <Cell>{line.quantity} bags</Cell>
                    <Cell>{formatQuotationUSD(line.unitPriceCents)}</Cell>
                    <Cell>{formatQuotationUSD(line.quantity * line.unitPriceCents)}</Cell>
                  </tr>
                ))}
              </TableFrame>
              <div className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
                <Info label="Amount excluding VAT" value={formatQuotationUSD(quote.netCents)} />
                <Info
                  label={`VAT (${(quote.taxRateBps / 100).toFixed(2)}% demo rate)`}
                  value={formatQuotationUSD(quote.taxCents)}
                />
                <Info label="Grand total USD" value={formatQuotationUSD(quote.totalCents)} strong />
              </div>
            </Panel>
          </div>
          <Panel title="Review actions">
            <div className="space-y-3">
              <StatusBadge>{quote.status}</StatusBadge>
              <p className="text-sm leading-6 text-[#718096]">
                Opening this record does not change its approval status.
              </p>
              {quote.status === "Awaiting Review" &&
                actionButton("Approve / mark ready", () => updateQuotation(quote, "Approved"))}
              {["Awaiting Review", "Approved"].includes(quote.status) &&
                actionButton(
                  "Request more information",
                  () => askReason("Information Requested"),
                  true,
                )}
              {["Awaiting Review", "Information Requested", "Approved"].includes(quote.status) &&
                actionButton("Reject with reason", () => askReason("Rejected"), true)}
              {quote.status === "Approved" &&
                !quote.orderId &&
                actionButton("Create sales order", () => createOrder(quote))}
              {quote.orderId && (
                <button
                  className="block text-sm font-semibold text-[#E30613]"
                  onClick={() => openDetail(quote.orderId!)}
                >
                  Open linked order {quote.orderId} →
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="w-full"
              >
                Print quotation
              </Button>
            </div>
          </Panel>
        </div>
      </>
    );
  };

  const renderOrders = () => {
    const statuses = [
      "All",
      "Processing",
      "Awaiting Payment",
      "Ready for Collection",
      "Dispatched",
      "Completed",
      "Cancelled",
    ];
    const orders = data.orders.filter(
      (order) =>
        (filter === "All" || order.status === filter) &&
        `${order.id} ${order.quotationId} ${order.customer}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    const count = (status: string) =>
      data.orders.filter((order) => (status === "All" ? true : order.status === status)).length;
    return (
      <>
        {heading}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total Orders" value={String(count("All"))} Icon={PackageCheck} />
          <Metric label="Processing" value={String(count("Processing"))} Icon={Activity} />
          <Metric
            label="Awaiting Payment"
            value={String(count("Awaiting Payment"))}
            Icon={CreditCard}
          />
          <Metric
            label="Ready for Collection / Dispatch"
            value={String(
              data.orders.filter((order) =>
                ["Ready for Collection", "Ready for Dispatch"].includes(order.status),
              ).length,
            )}
            Icon={Truck}
          />
          <Metric label="Completed" value={String(count("Completed"))} Icon={CheckCheck} />
          <Metric label="Cancelled" value={String(count("Cancelled"))} Icon={X} />
        </div>
        <Panel
          title="Sales orders"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order or customer"
                className="w-60 pl-9"
              />
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === status ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
              >
                {status}
              </button>
            ))}
          </div>
          {orders.length ? (
            <TableFrame
              headers={[
                "Order Number",
                "Quotation",
                "Customer",
                "Order Date",
                "Bags",
                "Total USD",
                "Outstanding",
                "Payment Status",
                "Order Status",
                "Completion",
                "Action",
              ]}
            >
              {orders.map((order) => {
                const outstanding = outstandingCents(order, data.payments);
                const paid = order.totalCents - outstanding;
                return (
                  <tr key={order.id}>
                    <Cell>
                      <button
                        className="font-semibold text-[#E30613]"
                        onClick={() => openDetail(order.id)}
                      >
                        {order.id}
                      </button>
                    </Cell>
                    <Cell>{order.quotationId}</Cell>
                    <Cell>{order.customer}</Cell>
                    <Cell>{formatDate(order.date)}</Cell>
                    <Cell>{bagsIn(order.lines)}</Cell>
                    <Cell>{formatQuotationUSD(order.totalCents)}</Cell>
                    <Cell>{formatQuotationUSD(outstanding)}</Cell>
                    <Cell>
                      <StatusBadge>
                        {outstanding === 0
                          ? "Paid"
                          : paid > 0
                            ? "Partially Paid"
                            : "Awaiting Payment"}
                      </StatusBadge>
                    </Cell>
                    <Cell>
                      <StatusBadge>{order.status}</StatusBadge>
                    </Cell>
                    <Cell>{formatDate(order.completionDate)}</Cell>
                    <Cell>{actionButton("View", () => openDetail(order.id), true)}</Cell>
                  </tr>
                );
              })}
            </TableFrame>
          ) : (
            <EmptyState>No orders match the current filters.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderOrderDetail = () => {
    const order = data.orders.find((item) => item.id === recordId);
    if (!order)
      return (
        <>
          {heading}
          <EmptyState>This sales order is not available in the demo dataset.</EmptyState>
        </>
      );
    const paymentRows = data.payments.filter((payment) => payment.orderId === order.id);
    const relatedTransport = data.transport.find((item) => item.orderId === order.id);
    const availableByStatus: Record<StaffOrderStatus, StaffOrderStatus[]> = {
      Processing: ["Awaiting Payment", "Cancelled"],
      "Awaiting Payment": ["Processing", "Ready for Collection", "Ready for Dispatch", "Cancelled"],
      "Ready for Collection": ["Completed", "Cancelled"],
      "Ready for Dispatch": ["Dispatched", "Cancelled"],
      Dispatched: ["Completed"],
      Completed: [],
      Cancelled: [],
    };
    const available = availableByStatus[order.status];
    return (
      <>
        {heading}
        <button
          onClick={() => void navigate({ to: "/staff/orders" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E30613]"
        >
          <ArrowLeft className="size-4" />
          All orders
        </button>
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <Panel title="Order details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Order reference" value={order.id} />
                <Info label="Related quotation" value={order.quotationId} />
                <Info label="Customer" value={order.customer} />
                <Info label="Account" value={order.account} />
                <Info label="Order date" value={formatDate(order.date)} />
                <Info label="Shipping condition" value={order.method} />
                <Info label="Destination" value={order.destination} />
                <Info label="Fulfilment status" value={order.status} />
                <Info label="Completion date" value={formatDate(order.completionDate)} />
                <Info label="Transport reference" value={relatedTransport?.id ?? "Not assigned"} />
              </div>
              <div className="mt-5">
                <TableFrame headers={["Product", "Quantity", "Saved Unit Price", "Line Total"]}>
                  {order.lines.map((line) => (
                    <tr key={line.productId}>
                      <Cell>{PRODUCT_NAMES[line.productId] ?? line.productId}</Cell>
                      <Cell>{line.quantity} bags</Cell>
                      <Cell>{formatQuotationUSD(line.unitPriceCents)}</Cell>
                      <Cell>{formatQuotationUSD(line.quantity * line.unitPriceCents)}</Cell>
                    </tr>
                  ))}
                </TableFrame>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-6 text-sm">
                <Info label="Net" value={formatQuotationUSD(order.netCents)} />
                <Info label="Tax saved" value={formatQuotationUSD(order.taxCents)} />
                <Info label="Total" value={formatQuotationUSD(order.totalCents)} strong />
                <Info
                  label="Outstanding"
                  value={formatQuotationUSD(outstandingCents(order, data.payments))}
                  strong
                />
              </div>
            </Panel>
            <Panel title="Payment records">
              {paymentRows.length ? (
                <TableFrame
                  headers={["Reference", "Date", "Amount", "Verification / Allocation", "Notes"]}
                >
                  {paymentRows.map((payment) => (
                    <tr key={payment.id}>
                      <Cell>{payment.id}</Cell>
                      <Cell>{formatDate(payment.date)}</Cell>
                      <Cell>{formatQuotationUSD(payment.amountCents)}</Cell>
                      <Cell>
                        <StatusBadge>{payment.status}</StatusBadge>
                      </Cell>
                      <Cell>{payment.note}</Cell>
                    </tr>
                  ))}
                </TableFrame>
              ) : (
                <EmptyState>No payments are linked to this order.</EmptyState>
              )}
            </Panel>
            <Panel title="Status history">
              {data.audit.filter((item) => item.reference === order.id).length ? (
                <div className="space-y-3">
                  {data.audit
                    .filter((item) => item.reference === order.id)
                    .map((item) => (
                      <div key={item.id} className="border-l-2 border-[#E30613] pl-3">
                        <p className="text-sm font-medium">
                          {item.previous} → {item.next}
                        </p>
                        <p className="text-xs text-[#718096]">
                          {timeLabel(item.date)} · {item.actor}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState>No status changes recorded yet.</EmptyState>
              )}
            </Panel>
          </div>
          <Panel title="Processing actions">
            <div className="space-y-3">
              <StatusBadge>{order.status}</StatusBadge>
              <p className="text-sm leading-6 text-[#718096]">
                Payment status is calculated separately from fulfilment. Only verified/allocated
                amounts count toward the balance.
              </p>
              {available.map((status) =>
                actionButton(
                  status === "Cancelled" ? "Cancel order" : `Mark ${status}`,
                  () => setOrderStatus(order, status),
                  status === "Cancelled",
                ),
              )}
              {order.status === "Awaiting Payment" &&
                outstandingCents(order, data.payments) > 0 && (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    Fulfilment actions remain blocked while a balance is outstanding.
                  </p>
                )}
              <p className="text-xs text-[#718096]">
                There is no bank or PPC order integration in this demonstration.
              </p>
            </div>
          </Panel>
        </div>
      </>
    );
  };

  const renderTransport = () => {
    const tabs = [
      "All",
      "Awaiting Scheduling",
      "Scheduled",
      "Truck Assigned",
      "In Transit",
      "Completed",
      "Delayed",
      "Cancelled",
    ];
    const records = data.transport.filter(
      (item) =>
        (filter === "All" || item.status === filter) &&
        `${item.id} ${item.orderId} ${item.customer} ${item.destination}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    const count = (status: string) =>
      data.transport.filter((item) => (status === "All" ? true : item.status === status)).length;
    return (
      <>
        {heading}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total Transport Requests" value={String(count("All"))} Icon={Truck} />
          <Metric
            label="Awaiting Scheduling"
            value={String(count("Awaiting Scheduling"))}
            Icon={Activity}
          />
          <Metric
            label="Truck Assigned"
            value={String(count("Truck Assigned"))}
            Icon={PackageCheck}
          />
          <Metric label="In Transit" value={String(count("In Transit"))} Icon={Truck} />
          <Metric
            label="Completed Deliveries"
            value={String(count("Completed"))}
            Icon={CheckCheck}
          />
          <Metric
            label="Exceptions / Delayed"
            value={String(count("Delayed"))}
            Icon={CircleAlert}
          />
        </div>
        <Panel
          title="Transport register"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, order or destination"
                className="w-64 pl-9"
              />
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === tab ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {records.length ? (
            <TableFrame
              headers={[
                "Transport Reference",
                "Order",
                "Customer",
                "Origin",
                "Destination",
                "Load",
                "Distance",
                "Est. Cost",
                "Truck",
                "ETA",
                "Completed",
                "Status",
                "Action",
              ]}
            >
              {records.map((item) => (
                <tr key={item.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(item.id)}
                    >
                      {item.id}
                    </button>
                  </Cell>
                  <Cell>{item.orderId}</Cell>
                  <Cell>{item.customer}</Cell>
                  <Cell>{item.origin}</Cell>
                  <Cell>{item.destination}</Cell>
                  <Cell>{item.bags} bags</Cell>
                  <Cell>{item.distanceKm} km</Cell>
                  <Cell>{formatQuotationUSD(item.estimatedCostCents)}</Cell>
                  <Cell>{item.vehicle}</Cell>
                  <Cell>{formatDate(item.eta)}</Cell>
                  <Cell>{formatDate(item.completedDate)}</Cell>
                  <Cell>
                    <StatusBadge>{item.status}</StatusBadge>
                  </Cell>
                  <Cell>{actionButton("View", () => openDetail(item.id), true)}</Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No transport records match the current filters.</EmptyState>
          )}
          <p className="mt-4 text-xs text-[#718096]">
            Status and timestamp history only. No live GPS tracking is connected.
          </p>
        </Panel>
      </>
    );
  };

  const renderTransportDetail = () => {
    const item = data.transport.find((record) => record.id === recordId);
    if (!item)
      return (
        <>
          {heading}
          <EmptyState>This transport record is not available.</EmptyState>
        </>
      );
    const possibleByStatus: Record<StaffTransportStatus, StaffTransportStatus[]> = {
      "Awaiting Scheduling": ["Scheduled", "Cancelled"],
      Scheduled: ["Truck Assigned", "Delayed", "Cancelled"],
      "Truck Assigned": ["In Transit", "Delayed", "Cancelled"],
      "In Transit": ["Completed", "Delayed"],
      Completed: [],
      Delayed: ["Scheduled", "Truck Assigned", "In Transit", "Cancelled"],
      Cancelled: [],
    };
    const possible = possibleByStatus[item.status];
    const timeline = [
      "Awaiting Scheduling",
      "Scheduled",
      "Truck Assigned",
      "In Transit",
      "Completed",
    ];
    const index = timeline.indexOf(item.status);
    return (
      <>
        {heading}
        <button
          onClick={() => void navigate({ to: "/staff/transport" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E30613]"
        >
          <ArrowLeft className="size-4" />
          All transport
        </button>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Panel title="Transport details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Transport reference" value={item.id} />
                <Info label="Related sales order" value={item.orderId} />
                <Info label="Customer" value={item.customer} />
                <Info label="Destination" value={item.destination} />
                <Info label="Origin" value={item.origin} />
                <Info label="Load quantity" value={`${item.bags} bags`} />
                <Info label="Estimated distance" value={`${item.distanceKm} km`} />
                <Info label="Estimated cost" value={formatQuotationUSD(item.estimatedCostCents)} />
                <Info label="Confirmed charge" value="Not recorded" />
                <Info label="Truck / vehicle" value={item.vehicle} />
                <Info label="Dispatch date" value={formatDate(item.dispatchDate)} />
                <Info label="Estimated arrival" value={formatDate(item.eta)} />
                <Info label="Actual completion" value={formatDate(item.completedDate)} />
                <Info label="Internal notes" value={item.note || "None"} />
              </div>
            </Panel>
            <Panel title="Status timeline">
              <div className="space-y-4">
                {timeline.map((status, i) => (
                  <div key={status} className="flex items-center gap-3">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full ${i < index || status === item.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                    >
                      {i < index ? (
                        <Check className="size-4" />
                      ) : (
                        <span className="size-2 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={
                        status === item.status ? "font-semibold text-[#17212B]" : "text-[#718096]"
                      }
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[#718096]">
                Recorded status only; live location is unavailable.
              </p>
            </Panel>
          </div>
          <Panel title="Transport actions">
            <div className="space-y-3">
              <StatusBadge>{item.status}</StatusBadge>
              {possible.map((status) =>
                actionButton(
                  status === "Completed" ? "Mark delivered / completed" : `Mark ${status}`,
                  () => setTransportStatus(item, status),
                  status === "Cancelled",
                ),
              )}
            </div>
          </Panel>
        </div>
      </>
    );
  };

  const renderSap = () => {
    const records = data.sapRecords.filter((item) => {
      const statusMatch = view !== "sap-reconciliation" || item.status !== "Matched";
      const searchMatch = `${item.id} ${item.document} ${item.orderId} ${item.account}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
    const setSapStatus = (
      id: string,
      status: StaffDemoWorkspace["sapRecords"][number]["status"],
    ) => {
      const item = data.sapRecords.find((record) => record.id === id);
      const relatedOrder = item && byOrder(item.orderId);
      if (
        status === "Matched" &&
        (!item ||
          !relatedOrder ||
          relatedOrder.netCents !== item.netCents ||
          relatedOrder.taxCents !== item.taxCents ||
          relatedOrder.account !== item.account ||
          item.document === "Missing SAP Record" ||
          item.status === "Duplicate Review Required")
      ) {
        setMessage(
          "This SAP record cannot be marked matched until the source values and document reference agree.",
        );
        return;
      }
      if (!item || !window.confirm(`Confirm changing ${item.id} from ${item.status} to ${status}?`))
        return;
      const audit = recordAudit(
        data,
        status === "Matched" ? "SAP record reconciled" : "SAP record flagged for review",
        "SAP",
        id,
        item.status,
        status,
      );
      commit({
        ...data,
        sapRecords: data.sapRecords.map((record) =>
          record.id === id ? { ...record, status } : record,
        ),
        audit,
      });
    };
    const addSapNote = (id: string) => {
      const note = window.prompt("Add a reconciliation note:");
      if (!note?.trim()) return;
      const item = data.sapRecords.find((record) => record.id === id);
      if (!item) return;
      const audit = recordAudit(
        data,
        "SAP reconciliation note added",
        "SAP",
        id,
        "",
        "",
        note.trim(),
      );
      commit({
        ...data,
        sapRecords: data.sapRecords.map((record) =>
          record.id === id ? { ...record, note: `${record.note}\n${note.trim()}`.trim() } : record,
        ),
        audit,
      });
    };
    const title =
      view === "sap"
        ? "SAP Records & Reconciliation"
        : view === "sap-records"
          ? "All SAP Records"
          : "SAP Reconciliation";
    return (
      <>
        <PageHeading
          title={title}
          subtitle="Application-side records for demonstration only; SAP is not connected."
        />
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Total SAP Records"
            value={String(data.sapRecords.length)}
            Icon={Database}
          />
          <Metric
            label="Matched"
            value={String(data.sapRecords.filter((item) => item.status === "Matched").length)}
            Icon={CheckCheck}
          />
          <Metric
            label="Pending Reconciliation"
            value={String(
              data.sapRecords.filter((item) =>
                ["Pending", "Missing SAP Record"].includes(item.status),
              ).length,
            )}
            Icon={Activity}
          />
          <Metric
            label="Exceptions"
            value={String(
              data.sapRecords.filter((item) =>
                ["Mismatch", "Duplicate Review Required"].includes(item.status),
              ).length,
            )}
            Icon={CircleAlert}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            to="/staff/sap"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "sap" ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
          >
            Overview
          </Link>
          <Link
            to="/staff/sap/records"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "sap-records" ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
          >
            All Records
          </Link>
          <Link
            to="/staff/sap/reconciliation"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "sap-reconciliation" ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
          >
            Reconciliation
          </Link>
        </div>
        <Panel
          title="Demonstration SAP register"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search records"
                className="w-56 pl-9"
              />
            </div>
          }
        >
          {records.length ? (
            <TableFrame
              headers={[
                "Internal ID",
                "SAP Document",
                "Order",
                "Customer Account",
                "Date",
                "Net USD",
                "Tax USD",
                "Gross USD",
                "Status",
                "Discrepancy / Notes",
                "Actions",
              ]}
            >
              {records.map((item) => {
                const order = byOrder(item.orderId);
                const discrepancy =
                  order && (order.netCents !== item.netCents || order.taxCents !== item.taxCents);
                const canMatch = Boolean(
                  order &&
                  !discrepancy &&
                  order.account === item.account &&
                  item.document !== "Missing SAP Record" &&
                  item.status !== "Duplicate Review Required",
                );
                return (
                  <tr key={item.id}>
                    <Cell>{item.id}</Cell>
                    <Cell>{item.document}</Cell>
                    <Cell>
                      <button className="text-[#E30613]" onClick={() => openDetail(item.orderId)}>
                        {item.orderId}
                      </button>
                    </Cell>
                    <Cell>{item.account}</Cell>
                    <Cell>{formatDate(item.date)}</Cell>
                    <Cell>{formatQuotationUSD(item.netCents)}</Cell>
                    <Cell>{formatQuotationUSD(item.taxCents)}</Cell>
                    <Cell>{formatQuotationUSD(item.netCents + item.taxCents)}</Cell>
                    <Cell>
                      <StatusBadge>{item.status}</StatusBadge>
                    </Cell>
                    <Cell>
                      {discrepancy ? "Amount/tax differs from the order" : item.note || "—"}
                    </Cell>
                    <Cell>
                      <div className="flex flex-wrap gap-1">
                        {item.status !== "Matched" &&
                          canMatch &&
                          actionButton(
                            item.status === "Pending" ? "Mark matched" : "Resolve exception",
                            () => setSapStatus(item.id, "Matched"),
                          )}
                        {item.status === "Pending" &&
                          actionButton(
                            "Flag review",
                            () => setSapStatus(item.id, "Mismatch"),
                            true,
                          )}
                        {actionButton("Add note", () => addSapNote(item.id), true)}
                        {item.status !== "Matched" && !canMatch && (
                          <span className="text-xs text-[#718096]">
                            Requires corrected source data
                          </span>
                        )}
                      </div>
                    </Cell>
                  </tr>
                );
              })}
            </TableFrame>
          ) : (
            <EmptyState>No SAP records match the current search.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const taxRows = data.orders
    .filter((order) => order.status !== "Cancelled")
    .map((order) => {
      const quote = byQuotation(order.quotationId);
      const account = data.taxAccounts.find((item) => item.account === order.account);
      const rate = quote?.taxRateBps ?? data.taxRateBps;
      const expectedTax = calculateQuotationTotals(
        order.lines.map((line) => ({
          id: line.productId,
          qty: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
        rate,
        quote?.taxInclusive ?? false,
      ).outputTaxCents;
      return {
        id: `DEMO-TAX-${order.id.slice(-4)}`,
        order,
        account,
        rate,
        category: quote?.taxCategory ?? (rate === 0 ? "Exempt" : "Taxable"),
        expectedTax,
        discrepancy: expectedTax !== order.taxCents,
      };
    });

  const renderTaxOverview = () => {
    const taxable = taxRows.filter((row) => row.rate > 0);
    const compliant = data.taxAccounts.filter((account) => account.status === "Compliant").length;
    const requiresReview = data.taxAccounts.filter((account) =>
      ["Non-Compliant", "Pending Verification", "Unverified"].includes(account.status),
    ).length;
    const recorded = taxRows.reduce((sum, row) => sum + row.order.taxCents, 0);
    return (
      <>
        {heading}
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
          Tax settings and amounts are demonstration values only. Confirm current requirements with
          authorised finance/compliance staff; this is not an official ZIMRA filing.
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total Taxable Orders" value={String(taxable.length)} Icon={ReceiptText} />
          <Metric
            label="Non-Taxable / Exempt Orders"
            value={String(taxRows.filter((row) => row.category !== "Taxable").length)}
            Icon={FileCheck2}
            hint="Sample exemption requires evidence review"
          />
          <Metric
            label="Tax Review Required"
            value={String(requiresReview + taxRows.filter((row) => row.discrepancy).length)}
            Icon={CircleAlert}
          />
          <Metric label="Tax-Compliant Accounts" value={String(compliant)} Icon={CheckCheck} />
          <Metric
            label="Non-Compliant / Unverified"
            value={String(requiresReview)}
            Icon={Building2}
          />
          <Metric label="Tax Recorded USD" value={formatQuotationUSD(recorded)} Icon={CreditCard} />
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          <Link
            to="/staff/zimra"
            className="rounded-full bg-[#E30613] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Overview
          </Link>
          <Link
            to="/staff/zimra/settings"
            className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#40536A]"
          >
            Tax settings
          </Link>
          <Link
            to="/staff/zimra/transactions"
            className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#40536A]"
          >
            Transactions
          </Link>
          <Link
            to="/staff/zimra/accounts"
            className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#40536A]"
          >
            Accounts
          </Link>
          <Link
            to="/staff/zimra/reports"
            className="rounded-full bg-[#F2F4F7] px-3 py-1.5 text-xs font-semibold text-[#40536A]"
          >
            Reports
          </Link>
        </div>
        <Panel title="Tax review queue">
          <TableFrame
            headers={[
              "Order",
              "Customer",
              "Net USD",
              "Saved Rate",
              "Tax USD",
              "Compliance",
              "Review",
            ]}
          >
            {taxRows.slice(0, 6).map((row) => (
              <tr key={row.id}>
                <Cell>{row.order.id}</Cell>
                <Cell>{row.order.customer}</Cell>
                <Cell>{formatQuotationUSD(row.order.netCents)}</Cell>
                <Cell>{(row.rate / 100).toFixed(2)}% demo</Cell>
                <Cell>{formatQuotationUSD(row.order.taxCents)}</Cell>
                <Cell>
                  <StatusBadge>{row.account?.status ?? "Unverified"}</StatusBadge>
                </Cell>
                <Cell>
                  {row.discrepancy ? (
                    <StatusBadge>Review Required</StatusBadge>
                  ) : (
                    <span className="text-xs text-[#718096]">No discrepancy</span>
                  )}
                </Cell>
              </tr>
            ))}
          </TableFrame>
        </Panel>
      </>
    );
  };

  const renderTaxSettings = () => {
    const saveTaxSettings = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const rate = Number(taxRateInput);
      const reason = taxReasonInput.trim();
      if (!Number.isFinite(rate) || rate < 0 || rate > 100 || !reason) {
        setMessage("Enter a tax rate from 0% to 100% and a reason.");
        return;
      }
      if (
        !window.confirm(
          `Confirm applying the demonstration tax rate of ${rate.toFixed(2)}% from the effective date below?`,
        )
      )
        return;
      const nextRate = Math.round(rate * 100);
      const categoryValue = String(form.get("taxCategory") ?? "Taxable");
      if (!["Taxable", "Non-Taxable / Exempt", "Zero-rated (demo only)"].includes(categoryValue)) {
        setMessage("Select a valid demonstration tax category.");
        return;
      }
      const taxCategory = categoryValue as StaffDemoWorkspace["taxCategory"];
      const taxInclusive = form.get("priceHandling") === "Inclusive";
      const taxRecordRequired = form.get("taxRecordRequired") === "on";
      const audit = recordAudit(
        data,
        "Tax settings changed",
        "Tax Settings",
        "DEMO-TAX-RATE",
        `${(data.taxRateBps / 100).toFixed(2)}% ${data.taxCategory} ${data.taxInclusive ? "inclusive" : "exclusive"}`,
        `${(nextRate / 100).toFixed(2)}% ${taxCategory} ${taxInclusive ? "inclusive" : "exclusive"}`,
        reason,
      );
      commit({
        ...data,
        taxRateBps: nextRate,
        taxInclusive,
        taxCategory,
        taxRecordRequired,
        taxEffectiveDate: String(form.get("effectiveDate") ?? DEMO_STAFF_DATE),
        taxReason: reason,
        audit,
      });
      setTaxInclusiveInput(taxInclusive);
      setTaxCategoryInput(taxCategory);
      setTaxRecordRequiredInput(taxRecordRequired);
      setTaxReasonInput("");
    };
    return (
      <>
        {heading}
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
          Configuration is a front-end demo. No rate is represented as current law, and no
          historical transaction calculation is changed by editing this setting.
        </div>
        <Panel title="Demonstration tax configuration">
          <form onSubmit={saveTaxSettings} className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="tax-rate">Default VAT / tax rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRateInput}
                onChange={(event) => setTaxRateInput(event.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="tax-effective">Effective date</Label>
              <Input
                id="tax-effective"
                name="effectiveDate"
                type="date"
                defaultValue={data.taxEffectiveDate}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="tax-category">Default tax category</Label>
              <select
                id="tax-category"
                name="taxCategory"
                value={taxCategoryInput}
                onChange={(event) =>
                  setTaxCategoryInput(event.target.value as StaffDemoWorkspace["taxCategory"])
                }
                className="mt-1.5 h-10 w-full rounded-md border border-[#D9E1E8] px-3 text-sm"
              >
                <option>Taxable</option>
                <option>Non-Taxable / Exempt</option>
                <option>Zero-rated (demo only)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tax-treatment">Price treatment</Label>
              <select
                id="tax-treatment"
                name="priceHandling"
                value={taxInclusiveInput ? "Inclusive" : "Exclusive"}
                onChange={(event) => setTaxInclusiveInput(event.target.value === "Inclusive")}
                className="mt-1.5 h-10 w-full rounded-md border border-[#D9E1E8] px-3 text-sm"
              >
                <option value="Exclusive">Tax-exclusive</option>
                <option value="Inclusive">Tax-inclusive</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#40536A] md:col-span-2">
              <input
                type="checkbox"
                name="taxRecordRequired"
                checked={taxRecordRequiredInput}
                onChange={(event) => setTaxRecordRequiredInput(event.target.checked)}
                className="size-4 accent-[#E30613]"
              />
              Require a customer tax record for transactions (demo setting)
            </label>
            <div className="md:col-span-2">
              <Label htmlFor="tax-reason">Reason for change</Label>
              <textarea
                id="tax-reason"
                value={taxReasonInput}
                onChange={(event) => setTaxReasonInput(event.target.value)}
                className="mt-1.5 min-h-20 w-full rounded-md border border-[#D9E1E8] p-3 text-sm"
                required
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[#718096]">
                Current demo rate: <strong>{(data.taxRateBps / 100).toFixed(2)}%</strong> ·
                Effective {formatDate(data.taxEffectiveDate)}
                <br />
                Access is limited to the demo finance/compliance account; role permissions require a
                real identity service.
              </p>
              <Button type="submit" className="bg-[#E30613] text-white hover:bg-[#C90016]">
                Confirm tax settings
              </Button>
            </div>
          </form>
        </Panel>
      </>
    );
  };

  const renderTaxTransactions = () => {
    const filtered = taxRows.filter((row) => {
      const status = row.account?.status ?? "Unverified";
      let criterion = true;
      if (filter === "Taxable") criterion = row.category === "Taxable";
      else if (filter === "Non-Taxable / Exempt") criterion = row.category !== "Taxable";
      else if (filter === "Review Required")
        criterion =
          row.discrepancy ||
          ["Non-Compliant", "Pending Verification", "Unverified"].includes(status);
      else if (filter === "Tax Compliant") criterion = status === "Compliant";
      else if (
        filter === "Unverified" ||
        filter === "Non-Compliant" ||
        filter === "Pending Verification"
      )
        criterion = status === filter;
      return (
        criterion &&
        `${row.id} ${row.order.id} ${row.order.customer} ${row.order.account}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
    const filters = [
      "All",
      "Taxable",
      "Non-Taxable / Exempt",
      "Review Required",
      "Tax Compliant",
      "Non-Compliant",
      "Unverified",
      "Pending Verification",
    ];
    return (
      <>
        <PageHeading
          title="Tax Transactions"
          subtitle="Order-based tax records and compliance status from the shared demonstration dataset."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Panel
          title="Tax transaction register"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Order, account or customer"
                className="w-56 pl-9"
              />
            </div>
          }
        >
          {filtered.length ? (
            <TableFrame
              headers={[
                "Transaction / Invoice",
                "Order",
                "Customer",
                "Account",
                "Date",
                "Net USD",
                "Taxable USD",
                "Rate",
                "Tax USD",
                "Gross USD",
                "Category",
                "Tax Status",
                "Compliance",
              ]}
            >
              {filtered.map((row) => (
                <tr key={row.id}>
                  <Cell>{row.id}</Cell>
                  <Cell>{row.order.id}</Cell>
                  <Cell>{row.order.customer}</Cell>
                  <Cell>{row.order.account}</Cell>
                  <Cell>{formatDate(row.order.date)}</Cell>
                  <Cell>{formatQuotationUSD(row.order.netCents)}</Cell>
                  <Cell>
                    {row.category === "Taxable"
                      ? formatQuotationUSD(row.order.netCents)
                      : formatQuotationUSD(0)}
                  </Cell>
                  <Cell>{(row.rate / 100).toFixed(2)}%</Cell>
                  <Cell>{formatQuotationUSD(row.order.taxCents)}</Cell>
                  <Cell>{formatQuotationUSD(row.order.totalCents)}</Cell>
                  <Cell>
                    {row.category}
                    {row.category !== "Taxable"
                      ? `: ${byQuotation(row.order.quotationId)?.exemptionReason ?? "reason recorded"}`
                      : ""}
                  </Cell>
                  <Cell>
                    {row.discrepancy ? (
                      <StatusBadge>Review Required</StatusBadge>
                    ) : (
                      <StatusBadge>Recorded</StatusBadge>
                    )}
                  </Cell>
                  <Cell>
                    <StatusBadge>{row.account?.status ?? "Unverified"}</StatusBadge>
                  </Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No tax transactions match these filters.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderTaxAccounts = () => {
    const updateTaxAccount = (
      accountId: string,
      status: StaffDemoWorkspace["taxAccounts"][number]["status"],
    ) => {
      const account = data.taxAccounts.find((item) => item.account === accountId);
      if (!account) return;
      const reason =
        status === "Exempt"
          ? window.prompt("Enter the recorded basis / evidence for exempt status:")?.trim()
          : "";
      if (status === "Exempt" && !reason) return;
      if (!window.confirm(`Confirm updating ${account.customer} to ${status}?`)) return;
      const audit = recordAudit(
        data,
        "Tax account reviewed",
        "Tax Account",
        account.account,
        account.status,
        status,
        reason || "",
      );
      commit({
        ...data,
        taxAccounts: data.taxAccounts.map((item) =>
          item.account === accountId ? { ...item, status, lastReviewed: DEMO_STAFF_DATE } : item,
        ),
        audit,
      });
    };
    return (
      <>
        <PageHeading
          title="Tax Account Compliance"
          subtitle="Review demo customer tax records; account status is not inferred solely from a tax number."
        />
        <Panel title="Customer tax accounts">
          <TableFrame
            headers={[
              "Company",
              "Account",
              "Tax Registration",
              "Compliance Status",
              "Outstanding Items",
              "Orders",
              "Taxable Sales",
              "Tax Recorded",
              "Last Reviewed",
              "Action",
            ]}
          >
            {data.taxAccounts.map((account) => {
              const orders = data.orders.filter((order) => order.account === account.account);
              const taxTotal = orders.reduce((sum, order) => sum + order.taxCents, 0);
              return (
                <tr key={account.account}>
                  <Cell>{account.customer}</Cell>
                  <Cell>{account.account}</Cell>
                  <Cell>{account.taxNumber || "Not supplied"}</Cell>
                  <Cell>
                    <StatusBadge>{account.status}</StatusBadge>
                  </Cell>
                  <Cell>{account.outstanding}</Cell>
                  <Cell>{orders.length}</Cell>
                  <Cell>
                    {formatQuotationUSD(orders.reduce((sum, order) => sum + order.netCents, 0))}
                  </Cell>
                  <Cell>{formatQuotationUSD(taxTotal)}</Cell>
                  <Cell>{formatDate(account.lastReviewed)}</Cell>
                  <Cell>
                    <select
                      aria-label={`Review status for ${account.customer}`}
                      value={account.status}
                      onChange={(event) =>
                        updateTaxAccount(
                          account.account,
                          event.target.value as StaffDemoWorkspace["taxAccounts"][number]["status"],
                        )
                      }
                      className="max-w-40 rounded-md border border-[#D9E1E8] px-2 py-1.5 text-xs"
                    >
                      <option>Compliant</option>
                      <option>Non-Compliant</option>
                      <option>Pending Verification</option>
                      <option>Exempt</option>
                      <option>Unverified</option>
                    </select>
                  </Cell>
                </tr>
              );
            })}
          </TableFrame>
        </Panel>
      </>
    );
  };

  const renderTaxReports = () => {
    const [start, end] = filter === "All" ? ["", ""] : filter.split("|");
    const rows = taxRows.filter(
      (row) => (!start || row.order.date >= start) && (!end || row.order.date <= end),
    );
    const net = rows
      .filter((row) => row.category === "Taxable")
      .reduce((sum, row) => sum + row.order.netCents, 0);
    const nonTaxable = rows
      .filter((row) => row.category !== "Taxable")
      .reduce((sum, row) => sum + row.order.netCents, 0);
    const tax = rows.reduce((sum, row) => sum + row.order.taxCents, 0);
    return (
      <>
        <PageHeading
          title="Tax Reports"
          subtitle="Demonstration summaries only—not an official ZIMRA return or certified financial statement."
        />
        <Panel
          title="Reporting period"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadCsv("ppc-demo-tax-report.csv", [
                  [
                    "Order",
                    "Customer",
                    "Account",
                    "Date",
                    "Net cents",
                    "Tax cents",
                    "Tax rate bps",
                  ],
                  ...rows.map((row) => [
                    row.order.id,
                    row.order.customer,
                    row.order.account,
                    row.order.date,
                    row.order.netCents,
                    row.order.taxCents,
                    row.rate,
                  ]),
                ])
              }
            >
              <ArrowDownToLine className="mr-2 size-4" />
              Export CSV
            </Button>
          }
        >
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-[#40536A]">
              From{" "}
              <Input
                type="date"
                value={start}
                onChange={(event) => setFilter(`${event.target.value}|${end}`)}
                className="mt-1 block"
              />
            </label>
            <label className="text-xs font-semibold text-[#40536A]">
              To{" "}
              <Input
                type="date"
                value={end}
                onChange={(event) => setFilter(`${start}|${event.target.value}`)}
                className="mt-1 block"
              />
            </label>
            <Button type="button" variant="outline" onClick={() => setFilter("All")}>
              Reset
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Net Sales"
              value={formatQuotationUSD(net + nonTaxable)}
              Icon={CreditCard}
            />
            <Metric label="Taxable Sales" value={formatQuotationUSD(net)} Icon={ReceiptText} />
            <Metric
              label="Non-Taxable Sales"
              value={formatQuotationUSD(nonTaxable)}
              Icon={FileCheck2}
            />
            <Metric label="Tax Recorded" value={formatQuotationUSD(tax)} Icon={CheckCheck} />
          </div>
          <p className="mt-4 text-xs text-[#718096]">
            {rows.filter((row) => row.discrepancy).length} transaction(s) require a tax review.
          </p>
        </Panel>
      </>
    );
  };

  const renderPayments = () => {
    const records = data.payments.filter((payment) =>
      `${payment.id} ${payment.customer} ${payment.account} ${payment.orderId} ${payment.quotationId} ${payment.reference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const allocatePayment = (payment: StaffPayment) => {
      if (!["Verified", "Partially Allocated"].includes(payment.status)) {
        setMessage("Only verified payments can be allocated to an order.");
        return;
      }
      const order = byOrder(payment.orderId);
      if (!order) {
        setMessage("This payment has no linked order to receive an allocation.");
        return;
      }
      const room = outstandingCents(order, data.payments);
      const unallocated = Math.max(0, payment.amountCents - payment.allocatedCents);
      const amount = Math.min(room, unallocated);
      if (amount <= 0) {
        setMessage("There is no outstanding balance available for this payment.");
        return;
      }
      if (!window.confirm(`Allocate ${formatQuotationUSD(amount)} to ${order.id}?`)) return;
      const totalAllocated = payment.allocatedCents + amount;
      const status: StaffPayment["status"] =
        totalAllocated >= payment.amountCents ? "Allocated" : "Partially Allocated";
      const audit = recordAudit(
        data,
        "Payment allocated",
        "Payment",
        payment.id,
        formatQuotationUSD(payment.allocatedCents),
        formatQuotationUSD(totalAllocated),
        "Allocated to linked demo order.",
      );
      commit({
        ...data,
        payments: data.payments.map((item) =>
          item.id === payment.id ? { ...item, allocatedCents: totalAllocated, status } : item,
        ),
        audit,
      });
    };
    const verifiedTotal = data.payments
      .filter((payment) =>
        ["Verified", "Allocated", "Partially Allocated"].includes(payment.status),
      )
      .reduce((sum, payment) => sum + payment.amountCents, 0);
    const waiting = data.payments.filter(
      (payment) => payment.status === "Awaiting Verification",
    ).length;
    const outstanding = data.orders.reduce(
      (sum, order) => sum + outstandingCents(order, data.payments),
      0,
    );
    const matched = data.payments.filter(
      (payment) => payment.orderId && payment.allocatedCents > 0,
    ).length;
    const exceptions = data.payments.filter((payment) =>
      ["Exception", "Unallocated"].includes(payment.status),
    ).length;
    return (
      <>
        {heading}
        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-900">
          All payment entries are demonstration records. No bank verification or money transfer is
          performed by this portal.
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Total Recorded Payments"
            value={formatQuotationUSD(
              data.payments.reduce((sum, payment) => sum + payment.amountCents, 0),
            )}
            Icon={CreditCard}
          />
          <Metric label="Awaiting Verification" value={String(waiting)} Icon={CircleAlert} />
          <Metric
            label="Outstanding Balance"
            value={formatQuotationUSD(outstanding)}
            Icon={Activity}
          />
          <Metric
            label="Verified Payments"
            value={formatQuotationUSD(verifiedTotal)}
            Icon={CheckCheck}
          />
          <Metric label="Exceptions / Unallocated" value={String(exceptions)} Icon={CircleAlert} />
        </div>
        <Panel
          title="Payment register"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payment, customer, order"
                className="w-64 pl-9"
              />
            </div>
          }
        >
          {records.length ? (
            <TableFrame
              headers={[
                "Payment Reference",
                "Customer",
                "Account",
                "Order",
                "Quotation",
                "Date",
                "Method",
                "Amount",
                "Allocation",
                "Verification",
                "Action",
              ]}
            >
              {records.map((payment) => (
                <tr key={payment.id}>
                  <Cell>
                    <button
                      className="font-semibold text-[#E30613]"
                      onClick={() => openDetail(payment.id)}
                    >
                      {payment.id}
                    </button>
                  </Cell>
                  <Cell>{payment.customer}</Cell>
                  <Cell>{payment.account}</Cell>
                  <Cell>{payment.orderId || "Unlinked"}</Cell>
                  <Cell>{payment.quotationId || "—"}</Cell>
                  <Cell>{formatDate(payment.date)}</Cell>
                  <Cell>{payment.method}</Cell>
                  <Cell>{formatQuotationUSD(payment.amountCents)}</Cell>
                  <Cell>
                    <StatusBadge>{payment.status}</StatusBadge>
                  </Cell>
                  <Cell>
                    {["Verified", "Allocated", "Partially Allocated"].includes(payment.status)
                      ? "Demo verified"
                      : payment.status === "Awaiting Verification"
                        ? "Awaiting source verification"
                        : "Not verified"}
                  </Cell>
                  <Cell>
                    <div className="flex gap-2">
                      {actionButton("View", () => openDetail(payment.id), true)}
                      {["Verified", "Partially Allocated"].includes(payment.status) &&
                        actionButton("Allocate", () => allocatePayment(payment))}
                    </div>
                  </Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No payment records match your search.</EmptyState>
          )}
        </Panel>
      </>
    );
  };

  const renderPaymentDetail = () => {
    const payment = data.payments.find((item) => item.id === recordId);
    if (!payment)
      return (
        <>
          {heading}
          <EmptyState>This payment is not available in the demo dataset.</EmptyState>
        </>
      );
    const order = byOrder(payment.orderId);
    const allocate = () => {
      if (!["Verified", "Partially Allocated"].includes(payment.status) || !order) {
        setMessage("This payment is not eligible for allocation.");
        return;
      }
      const available = Math.min(
        payment.amountCents - payment.allocatedCents,
        outstandingCents(order, data.payments),
      );
      if (
        available <= 0 ||
        !window.confirm(`Allocate ${formatQuotationUSD(available)} to ${order.id}?`)
      )
        return;
      const nextAllocated = payment.allocatedCents + available;
      const status: StaffPayment["status"] =
        nextAllocated >= payment.amountCents ? "Allocated" : "Partially Allocated";
      const audit = recordAudit(
        data,
        "Payment allocated",
        "Payment",
        payment.id,
        formatQuotationUSD(payment.allocatedCents),
        formatQuotationUSD(nextAllocated),
      );
      commit({
        ...data,
        payments: data.payments.map((item) =>
          item.id === payment.id ? { ...item, allocatedCents: nextAllocated, status } : item,
        ),
        audit,
      });
    };
    const addPaymentNote = () => {
      const note = window.prompt("Add a demonstration note:");
      if (!note?.trim()) return;
      const audit = recordAudit(
        data,
        "Payment note recorded",
        "Payment",
        payment.id,
        "",
        "",
        note.trim(),
      );
      commit({
        ...data,
        payments: data.payments.map((item) =>
          item.id === payment.id ? { ...item, note: `${item.note}\n${note.trim()}`.trim() } : item,
        ),
        audit,
      });
    };
    const flagPaymentException = () => {
      const reason = window.prompt("Enter the reason this payment needs exception review:")?.trim();
      if (!reason) return;
      if (!window.confirm(`Flag ${payment.id} for review?`)) return;
      const audit = recordAudit(
        data,
        "Payment flagged for exception review",
        "Payment",
        payment.id,
        payment.status,
        "Exception",
        reason,
      );
      commit({
        ...data,
        payments: data.payments.map((item) =>
          item.id === payment.id
            ? { ...item, status: "Exception", note: `${item.note}\n${reason}`.trim() }
            : item,
        ),
        audit,
      });
    };
    return (
      <>
        {heading}
        <button
          onClick={() => void navigate({ to: "/staff/payments" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E30613]"
        >
          <ArrowLeft className="size-4" />
          All payments
        </button>
        <div className="grid gap-5 xl:grid-cols-[1fr_0.6fr]">
          <Panel title="Payment record">
            <div className="grid gap-5 sm:grid-cols-2">
              <Info label="Payment reference" value={payment.id} />
              <Info label="Customer" value={payment.customer} />
              <Info label="Account" value={payment.account} />
              <Info label="Related order" value={payment.orderId || "Unlinked"} />
              <Info label="Related quotation" value={payment.quotationId || "Unlinked"} />
              <Info label="Recorded amount" value={formatQuotationUSD(payment.amountCents)} />
              <Info label="Allocated amount" value={formatQuotationUSD(payment.allocatedCents)} />
              <Info
                label="Unallocated amount"
                value={formatQuotationUSD(
                  Math.max(0, payment.amountCents - payment.allocatedCents),
                )}
              />
              <Info label="Payment date" value={formatDate(payment.date)} />
              <Info label="Method" value={payment.method} />
              <Info label="Reference / transaction ID" value={payment.reference} />
              <Info label="Verification status" value={payment.status} />
              <Info label="Notes" value={payment.note} />
            </div>
          </Panel>
          <Panel title="Payment actions">
            <div className="space-y-3">
              <StatusBadge>{payment.status}</StatusBadge>
              <p className="text-sm leading-6 text-[#718096]">
                Demo verification status is illustrative. Only records already marked verified in
                the shared demo data may be allocated; customer messages cannot verify a payment.
              </p>
              {["Verified", "Partially Allocated"].includes(payment.status) &&
                actionButton("Allocate to linked order", allocate)}
              {payment.status === "Awaiting Verification" && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  No bank connection is available to verify this entry.
                </p>
              )}
              {actionButton("Add note", addPaymentNote, true)}
              {payment.status !== "Exception" &&
                actionButton("Flag exception", flagPaymentException, true)}
            </div>
          </Panel>
        </div>
      </>
    );
  };

  const renderCommunications = () => {
    const threads = data.threads.filter(
      (thread) =>
        `${thread.customer} ${thread.subject} ${thread.reference} ${thread.category}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All" || (filter === "Unread" ? thread.unread : thread.category === filter)),
    );
    const filters = [
      "All",
      "Unread",
      "Customer Enquiries",
      "Quotations",
      "Orders",
      "Payments",
      "Internal",
    ];
    return (
      <>
        {heading}
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-[#E30613] text-white" : "bg-[#F2F4F7] text-[#40536A]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Panel
          title="Inbox"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="w-56 pl-9"
              />
            </div>
          }
        >
          {threads.length ? (
            <div className="divide-y divide-[#EEF1F4]">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openDetail(thread.id)}
                  className="flex w-full flex-wrap items-center gap-4 py-4 text-left hover:bg-[#FCF6F7]"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#F1F4F8] text-sm font-bold text-[#40536A]">
                    {thread.customer.slice(0, 1)}
                  </span>
                  <span className="min-w-[200px] flex-1">
                    <span className="flex items-center gap-2 font-semibold text-[#17212B]">
                      {thread.customer}
                      {thread.unread && <i className="size-2 rounded-full bg-[#E30613]" />}
                    </span>
                    <span className="mt-1 block text-sm text-[#40536A]">{thread.subject}</span>
                    <span className="mt-1 block text-xs text-[#718096]">
                      {thread.reference} · {thread.category} · {thread.messages.at(-1)?.body}
                    </span>
                  </span>
                  <StatusBadge>{thread.status}</StatusBadge>
                  <span className="text-xs text-[#718096]">
                    {timeLabel(thread.messages.at(-1)?.date ?? "")}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState>No conversations match the selected filter.</EmptyState>
          )}
          <p className="mt-4 text-xs leading-5 text-[#718096]">
            Messages are saved locally as demonstration content. Sending does not deliver email
            externally.
          </p>
        </Panel>
      </>
    );
  };

  const renderCommunicationDetail = () => {
    const thread = data.threads.find((item) => item.id === recordId);
    if (!thread)
      return (
        <>
          {heading}
          <EmptyState>This conversation is not available.</EmptyState>
        </>
      );
    const send = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const body = reply.trim();
      if (!body) return;
      const date = new Date().toISOString();
      const entry = {
        id: `DEMO-MSG-${Date.now()}`,
        sender: internalNote ? "Sales Demo User · Internal note" : "Sales Demo User",
        body,
        date,
        internal: internalNote,
      };
      const audit = recordAudit(
        data,
        internalNote
          ? "Internal communication note recorded"
          : "Demo customer communication recorded",
        "Communication",
        thread.id,
        "",
        "",
        body,
      );
      commit({
        ...data,
        threads: data.threads.map((item) =>
          item.id === thread.id
            ? {
                ...item,
                messages: [...item.messages, entry],
                unread: false,
                status: internalNote ? item.status : "Awaiting Customer",
              }
            : item,
        ),
        audit,
      });
      setReply("");
    };
    const markRead = () =>
      commit({
        ...data,
        threads: data.threads.map((item) =>
          item.id === thread.id ? { ...item, unread: false } : item,
        ),
      });
    return (
      <>
        {heading}
        <button
          onClick={() => void navigate({ to: "/staff/communications" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E30613]"
        >
          <ArrowLeft className="size-4" />
          Inbox
        </button>
        <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
          <Panel title={thread.subject}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-[#17212B]">{thread.customer}</p>
                <p className="text-xs text-[#718096]">
                  {thread.reference} · {thread.category} · DEMO CONVERSATION
                </p>
              </div>
              {actionButton("Mark as read", markRead, true)}
            </div>
            <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-lg bg-[#F5F7FA] p-4">
              {thread.messages.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[85%] rounded-xl p-3 ${item.internal ? "border border-amber-200 bg-amber-50" : "bg-white shadow-sm"}`}
                >
                  <p className="text-xs font-semibold text-[#40536A]">
                    {item.sender}
                    {item.internal ? " · Internal note" : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#17212B]">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[11px] text-[#718096]">{timeLabel(item.date)}</p>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="mt-4 space-y-3">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={internalNote ? "Write an internal note..." : "Write a demo reply..."}
                className="min-h-24 w-full rounded-lg border border-[#D9E1E8] p-3 text-sm"
                required
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-[#40536A]">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(event) => setInternalNote(event.target.checked)}
                  />
                  Internal note (not customer-visible)
                </label>
                <Button type="submit" className="bg-[#E30613] text-white hover:bg-[#C90016]">
                  {internalNote ? "Save internal note" : "Add demo reply"}
                </Button>
              </div>
            </form>
          </Panel>
          <Panel title="Related record">
            <Info label="Customer / sender" value={thread.customer} />
            <div className="mt-4">
              <Info label="Reference" value={thread.reference} />
            </div>
            <button
              onClick={() => openDetail(thread.reference)}
              className="mt-4 text-sm font-semibold text-[#E30613]"
            >
              Open linked record →
            </button>
            <p className="mt-5 text-xs leading-5 text-[#718096]">
              No email delivery service or attachment upload is connected.
            </p>
          </Panel>
        </div>
      </>
    );
  };

  const renderReports = () => {
    const matchesDate = (date: string) =>
      (!reportDateRange.from || date >= reportDateRange.from) &&
      (!reportDateRange.to || date <= reportDateRange.to);
    const orderPaymentStatus = (order: StaffOrder) => {
      if (order.status === "Cancelled") return "Cancelled";
      const outstanding = outstandingCents(order, data.payments);
      return outstanding === 0
        ? "Paid"
        : outstanding < order.totalCents
          ? "Partially Paid"
          : "Outstanding";
    };
    const orders = data.orders.filter((order) => {
      const quote = byQuotation(order.quotationId);
      return (
        (filter === "All" || order.status === filter) &&
        `${order.id} ${order.customer} ${order.account}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        matchesDate(order.date) &&
        (reportProduct === "All" || order.lines.some((line) => line.productId === reportProduct)) &&
        (reportQuotationStatus === "All" || quote?.status === reportQuotationStatus) &&
        (reportPaymentStatus === "All" || orderPaymentStatus(order) === reportPaymentStatus) &&
        (reportShipping === "All" || order.method === reportShipping)
      );
    });
    const quotations = data.quotations.filter(
      (quote) =>
        `${quote.id} ${quote.company} ${quote.account}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        matchesDate(quote.date) &&
        (reportProduct === "All" || quote.lines.some((line) => line.productId === reportProduct)) &&
        (reportQuotationStatus === "All" || quote.status === reportQuotationStatus) &&
        (reportShipping === "All" || quote.method === reportShipping),
    );
    const byStatus = (statuses: string[], value: string) =>
      statuses.filter((status) => status === value).length;
    const productSales = data.prices.map((price) => ({
      product: PRODUCT_NAMES[price.productId] ?? price.productId,
      bags: orders.reduce(
        (sum, order) =>
          sum +
          order.lines
            .filter((line) => line.productId === price.productId)
            .reduce((bagSum, line) => bagSum + line.quantity, 0),
        0,
      ),
      value: orders.reduce(
        (sum, order) =>
          sum +
          order.lines
            .filter((line) => line.productId === price.productId)
            .reduce((lineSum, line) => lineSum + line.quantity * line.unitPriceCents, 0),
        0,
      ),
    }));
    const maxBags = Math.max(1, ...productSales.map((item) => item.bags));
    const relevantOrderIds = new Set(orders.map((order) => order.id));
    const verified = data.payments
      .filter(
        (payment) =>
          relevantOrderIds.has(payment.orderId) &&
          ["Verified", "Allocated", "Partially Allocated"].includes(payment.status),
      )
      .reduce((sum, payment) => sum + payment.amountCents, 0);
    const outstanding = orders.reduce(
      (sum, order) => sum + outstandingCents(order, data.payments),
      0,
    );
    const totalTax = orders.reduce((sum, order) => sum + order.taxCents, 0);
    const exportRows = [
      ["Order", "Quotation", "Customer", "Date", "Status", "Net cents", "Tax cents", "Total cents"],
      ...orders.map((order) => [
        order.id,
        order.quotationId,
        order.customer,
        order.date,
        order.status,
        order.netCents,
        order.taxCents,
        order.totalCents,
      ]),
    ];
    return (
      <>
        {heading}
        <div className="mb-5 flex flex-wrap gap-3">
          <label className="text-xs font-semibold text-[#40536A]">
            From
            <Input
              type="date"
              value={reportDateRange.from}
              onChange={(event) =>
                setReportDateRange((current) => ({ ...current, from: event.target.value }))
              }
              className="mt-1 block"
            />
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            To
            <Input
              type="date"
              value={reportDateRange.to}
              onChange={(event) =>
                setReportDateRange((current) => ({ ...current, to: event.target.value }))
              }
              className="mt-1 block"
            />
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            Product
            <select
              value={reportProduct}
              onChange={(event) => setReportProduct(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-[#D9E1E8] px-2"
            >
              <option>All</option>
              {data.prices.map((price) => (
                <option key={price.productId} value={price.productId}>
                  {PRODUCT_NAMES[price.productId]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            Quotation status
            <select
              value={reportQuotationStatus}
              onChange={(event) => setReportQuotationStatus(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-[#D9E1E8] px-2"
            >
              <option>All</option>
              {[
                "Awaiting Review",
                "Information Requested",
                "Approved",
                "Rejected",
                "Converted to Order",
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            Payment status
            <select
              value={reportPaymentStatus}
              onChange={(event) => setReportPaymentStatus(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-[#D9E1E8] px-2"
            >
              <option>All</option>
              <option>Paid</option>
              <option>Partially Paid</option>
              <option>Outstanding</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            Shipping
            <select
              value={reportShipping}
              onChange={(event) => setReportShipping(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-[#D9E1E8] px-2"
            >
              <option>All</option>
              <option value="COLLECT">Collection</option>
              <option value="DELIVER">Delivery</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#40536A]">
            Filter orders{" "}
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="ml-2 h-9 rounded-md border border-[#D9E1E8] px-2"
            >
              <option>All</option>
              {[
                "Processing",
                "Awaiting Payment",
                "Ready for Collection",
                "Ready for Dispatch",
                "Dispatched",
                "Completed",
                "Cancelled",
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer/account"
              className="w-56 pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadCsv("ppc-demo-sales-report.csv", exportRows)}
          >
            <ArrowDownToLine className="mr-2 size-4" />
            Export filtered orders
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilter("All");
              setSearch("");
              setReportDateRange({ from: "", to: "" });
              setReportProduct("All");
              setReportQuotationStatus("All");
              setReportPaymentStatus("All");
              setReportShipping("All");
            }}
          >
            Reset filters
          </Button>
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total Quotations" value={String(quotations.length)} Icon={FileText} />
          <Metric
            label="Converted to Orders"
            value={String(
              quotations.filter((quote) => quote.status === "Converted to Order").length,
            )}
            Icon={PackageCheck}
          />
          <Metric
            label="Filtered Order Value"
            value={formatQuotationUSD(orders.reduce((sum, order) => sum + order.totalCents, 0))}
            Icon={CreditCard}
          />
          <Metric
            label="Verified Payments"
            value={formatQuotationUSD(verified)}
            Icon={CheckCheck}
          />
          <Metric
            label="Outstanding Balances"
            value={formatQuotationUSD(outstanding)}
            Icon={CircleAlert}
          />
          <Metric label="Tax Recorded" value={formatQuotationUSD(totalTax)} Icon={ReceiptText} />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Product sales comparison">
            {productSales.map((item) => (
              <div key={item.product} className="mb-4">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="font-medium text-[#40536A]">{item.product}</span>
                  <span>
                    {item.bags} bags · {formatQuotationUSD(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
                  <div
                    className="h-full rounded-full bg-[#E30613]"
                    style={{ width: `${(item.bags / maxBags) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </Panel>
          <Panel title="Orders and quotations by status">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Orders</h3>
                {[
                  "Processing",
                  "Awaiting Payment",
                  "Ready for Collection",
                  "Dispatched",
                  "Completed",
                  "Cancelled",
                ].map((status) => (
                  <div key={status} className="mb-2 flex justify-between text-xs text-[#40536A]">
                    <span>{status}</span>
                    <span>
                      {byStatus(
                        orders.map((order) => order.status),
                        status,
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold">Quotations</h3>
                {[
                  "Awaiting Review",
                  "Information Requested",
                  "Approved",
                  "Rejected",
                  "Converted to Order",
                ].map((status) => (
                  <div key={status} className="mb-2 flex justify-between text-xs text-[#40536A]">
                    <span>{status}</span>
                    <span>
                      {byStatus(
                        quotations.map((quote) => quote.status),
                        status,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <Panel title="Payment allocation status">
            {[
              "Allocated",
              "Partially Allocated",
              "Awaiting Verification",
              "Unallocated",
              "Exception",
            ].map((status) => (
              <div key={status} className="mb-2 flex justify-between text-sm text-[#40536A]">
                <span>{status}</span>
                <span>
                  {
                    data.payments.filter(
                      (payment) =>
                        relevantOrderIds.has(payment.orderId) && payment.status === status,
                    ).length
                  }
                </span>
              </div>
            ))}
          </Panel>
          <Panel title="Transport cost summary">
            <Info
              label="Estimated transport costs"
              value={formatQuotationUSD(
                data.transport
                  .filter((item) => relevantOrderIds.has(item.orderId))
                  .reduce((sum, item) => sum + item.estimatedCostCents, 0),
              )}
            />
            <p className="mt-2 text-xs text-[#718096]">
              Estimate only; no confirmed tariffs or actual charges are connected.
            </p>
          </Panel>
        </div>
        <p className="mt-4 text-xs text-[#718096]">
          Demonstration analytics only—not an official financial statement or audited report.
        </p>
      </>
    );
  };

  const renderAuditLog = () => {
    const records = data.audit.filter(
      (item) =>
        `${item.actor} ${item.action} ${item.type} ${item.reference} ${item.reason}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All" || item.type === filter || item.action === filter),
    );
    const filterValues = [
      "All",
      ...Array.from(new Set(data.audit.flatMap((item) => [item.type, item.action]))),
    ];
    return (
      <>
        {heading}
        <Panel
          title="Read-only audit history"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter user, action, type, reference"
                className="w-64 pl-9"
              />
            </div>
          }
        >
          <div className="mb-4">
            <Label htmlFor="audit-filter">Action / record type</Label>
            <select
              id="audit-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="ml-2 h-9 rounded-md border border-[#D9E1E8] px-2 text-xs"
            >
              {filterValues.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          {records.length ? (
            <TableFrame
              headers={[
                "Date / Time",
                "Staff User",
                "Action",
                "Record Type",
                "Reference",
                "Previous Value",
                "New Value",
                "Reason / Notes",
              ]}
            >
              {records.map((item) => (
                <tr key={item.id}>
                  <Cell>{timeLabel(item.date)}</Cell>
                  <Cell>{item.actor}</Cell>
                  <Cell>{item.action}</Cell>
                  <Cell>{item.type}</Cell>
                  <Cell>{item.reference}</Cell>
                  <Cell>{item.previous || "—"}</Cell>
                  <Cell>{item.next || "—"}</Cell>
                  <Cell>{item.reason || "—"}</Cell>
                </tr>
              ))}
            </TableFrame>
          ) : (
            <EmptyState>No audit entries match the current filters.</EmptyState>
          )}
          <p className="mt-4 text-xs text-[#718096]">
            Local demonstration log. The interface provides no delete or edit action.
          </p>
        </Panel>
      </>
    );
  };

  const renderSettings = () => {
    const toggle = (key: keyof typeof DEFAULT_STAFF_PREFERENCES) => {
      const updated = { ...preferences, [key]: !preferences[key] };
      window.localStorage.setItem("ppc-staff-demo-preferences-v1", JSON.stringify(updated));
      setPreferences(updated);
    };
    return (
      <>
        {heading}
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Staff profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Name" value="Sales Demo User" />
              <Info label="Email" value="sales@ppc.co.zw" />
              <Info label="Role" value="Sales Department · Demo access" />
              <Info label="Session type" value="Development-only, memory-only" />
            </div>
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Role and permission management requires a production identity service; this demo does
              not provide real access control.
            </p>
          </Panel>
          <Panel title="Notification preferences">
            <div className="space-y-4">
              {(
                [
                  ["email", "Email notifications (local preference)"],
                  ["quotationAlerts", "Quotation updates"],
                  ["paymentAlerts", "Payment updates"],
                  ["transportAlerts", "Transport updates"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-sm text-[#40536A]"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => toggle(key)}
                    className="size-4 accent-[#E30613]"
                  />
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#718096]">
              Preferences are saved in this browser; no email notifications are sent.
            </p>
          </Panel>
          <Panel title="Security and session">
            <p className="text-sm leading-6 text-[#40536A]">
              This account uses a front-end-only demo sign-in while running in development. It has
              no password management, server session, or production security controls.
            </p>
            <Button type="button" variant="outline" onClick={protectSignOut} className="mt-4">
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </Panel>
          <Panel title="Integration readiness">
            <p className="text-sm leading-6 text-[#718096]">
              Production access roles, SAP synchronisation, ZIMRA configuration, payment
              verification, and transport tracking require authorised services and credentials. They
              are not simulated as live integrations here.
            </p>
          </Panel>
        </div>
      </>
    );
  };

  let page: ReactNode;
  switch (view) {
    case "overview":
      page = renderOverview();
      break;
    case "notifications":
      page = renderNotifications();
      break;
    case "prices":
      page = renderPrices();
      break;
    case "price-history":
      page = renderPriceHistory();
      break;
    case "quotations":
      page = renderQuotations();
      break;
    case "quotation-detail":
      page = renderQuotationDetail();
      break;
    case "orders":
      page = renderOrders();
      break;
    case "order-detail":
      page = renderOrderDetail();
      break;
    case "transport":
      page = renderTransport();
      break;
    case "transport-detail":
      page = renderTransportDetail();
      break;
    case "sap":
    case "sap-records":
    case "sap-reconciliation":
      page = renderSap();
      break;
    case "zimra":
      page = renderTaxOverview();
      break;
    case "tax-settings":
      page = renderTaxSettings();
      break;
    case "tax-transactions":
      page = renderTaxTransactions();
      break;
    case "tax-accounts":
      page = renderTaxAccounts();
      break;
    case "tax-reports":
      page = renderTaxReports();
      break;
    case "payments":
      page = renderPayments();
      break;
    case "payment-detail":
      page = renderPaymentDetail();
      break;
    case "communications":
      page = renderCommunications();
      break;
    case "communication-detail":
      page = renderCommunicationDetail();
      break;
    case "reports":
      page = renderReports();
      break;
    case "audit-log":
      page = renderAuditLog();
      break;
    case "settings":
      page = renderSettings();
      break;
    default:
      page = renderOverview();
  }

  const sidebar = (mobile = false) => (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[88px] items-center gap-3 border-b border-[#E5EAF0] px-5">
        <img src={logoImage} alt="PPC Zimbabwe" className="h-12 w-[100px] object-contain" />
        <div className="min-w-0 border-l border-[#E5EAF0] pl-3">
          <p className="text-[10px] font-bold tracking-[0.13em] text-[#E30613]">SALES</p>
          <p className="text-[10px] font-semibold tracking-[0.08em] text-[#40536A]">DEPARTMENT</p>
        </div>
        {mobile && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto rounded-md p-2 text-[#718096] hover:bg-[#F5F7FA]"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <nav aria-label="Staff navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAVIGATION.map(({ label, to, Icon, prefix }) => {
          const active = path === prefix || (prefix !== "/staff" && path.startsWith(`${prefix}/`));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileNavOpen(false)}
              className={`flex min-h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${active ? "bg-[#FCF0F1] text-[#C90016]" : "text-[#40536A] hover:bg-[#F5F7FA] hover:text-[#17212B]"}`}
            >
              <Icon
                aria-hidden="true"
                className={`size-[18px] ${active ? "text-[#E30613]" : "text-[#718096]"}`}
              />
              <span className="flex-1">{label}</span>
              {label === "Notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-[#E30613] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#E5EAF0] p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#FCF0F1] text-sm font-bold text-[#C90016]">
            SD
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-[#17212B]">
              Sales Demo User
            </span>
            <span className="block text-[11px] text-[#718096]">Sales Department</span>
          </span>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={protectSignOut}
            className="rounded-md p-2 text-[#718096] hover:bg-[#F5F7FA] hover:text-[#E30613]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17212B]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-[#E5EAF0] bg-white lg:block">
        {sidebar()}
      </aside>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#17212B]/40 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileNavOpen(false);
          }}
        >
          <aside className="h-full w-[min(85vw,300px)] shadow-xl">{sidebar(true)}</aside>
        </div>
      )}
      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-[#E5EAF0] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md p-2 text-[#40536A] hover:bg-[#F5F7FA] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#17212B]">{PAGE_TITLES[view]}</p>
              <p className="hidden text-xs text-[#718096] sm:block">
                PPC Zimbabwe · Sales Department
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 size-4 text-[#718096]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search current records"
                placeholder="Search records"
                className="h-9 w-[220px] pl-9 lg:w-[260px]"
              />
            </div>
            <Link
              to="/staff/notifications"
              aria-label={`${unreadCount} unread notifications`}
              className="relative flex size-9 items-center justify-center rounded-lg text-[#40536A] hover:bg-[#F5F7FA]"
            >
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-[#E30613] ring-2 ring-white" />
              )}
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-[#F5F7FA]"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-[#FCF0F1] text-xs font-bold text-[#C90016]">
                  SD
                </span>
                <span className="hidden sm:block">
                  <span className="block text-xs font-semibold">Sales Demo User</span>
                  <span className="block text-[10px] text-[#718096]">Sales Department</span>
                </span>
                <ChevronDown className="hidden size-4 text-[#718096] sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 z-40 w-48 rounded-lg border border-[#E5EAF0] bg-white p-1 shadow-lg">
                  <Link
                    to="/staff/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-[#40536A] hover:bg-[#F5F7FA]"
                  >
                    <UserRound className="mr-2 inline size-4" />
                    Profile & settings
                  </Link>
                  <button
                    type="button"
                    onClick={protectSignOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#40536A] hover:bg-[#F5F7FA]"
                  >
                    <LogOut className="mr-2 inline size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {message && (
            <div
              role="status"
              className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
            >
              <span>{message}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}>
                <X className="size-4" />
              </button>
            </div>
          )}
          {page}
        </main>
      </div>
    </div>
  );
}
