import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useDemoAccount } from "@/features/account/demo-account";
import {
  readSubmittedDemoQuotations,
  type DemoQuotationRecord,
} from "@/features/account/demo-portal-quotations";
import { readStaffDemoWorkspace, type StaffDemoWorkspace } from "@/features/staff/staffDemoData";
import { useCart } from "@/features/store/cart";
import {
  calculateQuotationTotals,
  QUOTATION_PRODUCTS,
  formatQuotationUSD,
} from "@/pages/view-order/quotation-data";
import logoImage from "@/assets/logo.jpg";

type PortalView =
  | "dashboard"
  | "quotations"
  | "quotation-new"
  | "drafts"
  | "finished"
  | "quotation-detail"
  | "notifications"
  | "notification-detail"
  | "orders"
  | "order-detail"
  | "transport"
  | "transport-calculator"
  | "transport-tracking"
  | "tracking-detail"
  | "profile"
  | "profile-edit"
  | "settings";

type QuotationStatus =
  | "Draft"
  | "Pending Review"
  | "Information Requested"
  | "Approved"
  | "Rejected"
  | "Converted to Order"
  | "Finished"
  | "Expired";
type DemoQuotation = DemoQuotationRecord;
type PortalNotification = {
  id: string;
  category: "Quotations" | "Payments" | "Orders" | "Transport";
  title: string;
  message: string;
  date: string;
  read: boolean;
  href: string;
  reference?: string;
};
type DemoOrder = {
  id: string;
  quotationId: string;
  date: string;
  status: string;
  paymentStatus: string;
  completionDate: string;
  products: string;
  totalCents: number;
};
type TransportEstimate = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  quantity: number;
  weightTonnes: number;
  rate: number;
  cost: number;
  date: string;
};
type NotificationPreferences = {
  email: boolean;
  orderUpdates: boolean;
  transportUpdates: boolean;
};

const QUOTATIONS: DemoQuotation[] = [
  {
    id: "500550005",
    date: "26 October 2026",
    status: "Draft",
    method: "COLLECT",
    lines: [
      { productId: "surecem-32-5n", quantity: 40, unitPriceCents: 1200 },
      { productId: "surecast-42-5r", quantity: 40, unitPriceCents: 1300 },
      { productId: "surebuild-42-5n", quantity: 40, unitPriceCents: 1400 },
    ],
  },
  {
    id: "500550004",
    date: "24 October 2026",
    status: "Pending Review",
    method: "DELIVER",
    lines: [{ productId: "surecem-32-5n", quantity: 200, unitPriceCents: 1200 }],
  },
  {
    id: "500550003",
    date: "18 October 2026",
    status: "Finished",
    method: "COLLECT",
    lines: [{ productId: "surebuild-42-5n", quantity: 80, unitPriceCents: 1400 }],
  },
];

const ORDERS: DemoOrder[] = [
  {
    id: "PPC-ORD-DEMO-002",
    quotationId: "500550004",
    date: "24 October 2026",
    status: "Processing",
    paymentStatus: "Awaiting confirmation",
    completionDate: "",
    products: "SURECEM 32,5N",
    totalCents: 276000,
  },
  {
    id: "PPC-ORD-DEMO-001",
    quotationId: "500550003",
    date: "18 October 2026",
    status: "Awaiting Payment",
    paymentStatus: "Not confirmed",
    completionDate: "",
    products: "SureBuild 42,5N",
    totalCents: 128800,
  },
];

const INITIAL_NOTIFICATIONS: PortalNotification[] = [
  {
    id: "notice-quotation-saved",
    category: "Quotations",
    title: "Quotation saved",
    message: "Sample notification: quotation 500550005 is available in your drafts.",
    date: "26 October 2026",
    read: false,
    href: "/customer/quotations/500550005",
    reference: "500550005",
  },
  {
    id: "notice-order-update",
    category: "Orders",
    title: "Order update",
    message: "Sample order status: PPC-ORD-DEMO-002 is marked as processing.",
    date: "24 October 2026",
    read: false,
    href: "/customer/orders/PPC-ORD-DEMO-002",
    reference: "PPC-ORD-DEMO-002",
  },
  {
    id: "notice-transport",
    category: "Transport",
    title: "Transport estimate available",
    message: "A saved transport estimate is not a confirmed transport booking.",
    date: "23 October 2026",
    read: true,
    href: "/customer/transport",
  },
];

const NAVIGATION = [
  { label: "Overview", to: "/customer", Icon: LayoutDashboard, prefix: "/customer" },
  {
    label: "Quotations",
    to: "/customer/quotations",
    Icon: FileText,
    prefix: "/customer/quotations",
  },
  {
    label: "Notifications",
    to: "/customer/notifications",
    Icon: Bell,
    prefix: "/customer/notifications",
  },
  { label: "Orders", to: "/customer/orders", Icon: PackageCheck, prefix: "/customer/orders" },
  {
    label: "Transport & Logistics",
    to: "/customer/transport",
    Icon: Truck,
    prefix: "/customer/transport",
  },
  { label: "My Profile", to: "/customer/profile", Icon: UserRound, prefix: "/customer/profile" },
  { label: "Settings", to: "/customer/settings", Icon: Settings, prefix: "/customer/settings" },
] as const;

const MONEY = (cents: number) => formatQuotationUSD(cents);

function totalCents(lines: DemoQuotation["lines"]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPriceCents, 0);
}

function grandTotalCents(lines: DemoQuotation["lines"], taxRateBps = 1550, taxInclusive = false) {
  return calculateQuotationTotals(
    lines.map((line) => ({
      id: line.productId,
      qty: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })),
    taxRateBps,
    taxInclusive,
  ).grandTotalCents;
}

function productSummary(quotation: DemoQuotation) {
  return quotation.lines
    .map((line) => {
      const product = QUOTATION_PRODUCTS.find((item) => item.id === line.productId);
      return `${product?.material ?? line.productId} × ${line.quantity}`;
    })
    .join(", ");
}

function loadNotifications(): PortalNotification[] {
  const stored = window.localStorage.getItem("ppc-customer-demo-notifications-v1");
  if (!stored) return INITIAL_NOTIFICATIONS;
  const parsed: unknown = JSON.parse(stored);
  if (
    Array.isArray(parsed) &&
    parsed.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.read === "boolean",
    )
  ) {
    return parsed as PortalNotification[];
  }
  throw new Error("Saved notification data has an invalid format.");
}

function loadEstimates(): TransportEstimate[] {
  const stored = window.localStorage.getItem("ppc-customer-demo-estimates-v1");
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (
    Array.isArray(parsed) &&
    parsed.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.origin === "string" &&
        typeof item.destination === "string" &&
        typeof item.cost === "number",
    )
  ) {
    return parsed as TransportEstimate[];
  }
  throw new Error("Saved transport estimate data has an invalid format.");
}

function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (!value || typeof value !== "object") return false;
  const preferences = value as Record<string, unknown>;
  return (
    typeof preferences["email"] === "boolean" &&
    typeof preferences["orderUpdates"] === "boolean" &&
    typeof preferences["transportUpdates"] === "boolean"
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17212B] sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-[#718096]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#E30613] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E30613]"
    >
      {children}
    </Link>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone = /finished|completed|delivered|read|approved|converted/i.test(value)
    ? "bg-green-50 text-green-800"
    : /draft|estimate/i.test(value)
      ? "bg-slate-100 text-slate-700"
      : /awaiting|pending|transit|processing|information requested/i.test(value)
        ? "bg-amber-50 text-amber-800"
        : "bg-rose-50 text-rose-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {value}
    </span>
  );
}

function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

function CustomerSidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <Link
        to="/"
        aria-label="PPC Zimbabwe home"
        className="flex items-center gap-3 border-b border-[#E5EAF0] px-5 py-5"
      >
        <img src={logoImage} alt="PPC Strength Guaranteed" className="h-12 w-20 object-contain" />
        <span className="text-[10px] font-bold tracking-[0.12em] text-[#718096]">
          CUSTOMER PORTAL
        </span>
      </Link>
      <nav aria-label="Customer portal navigation" className="flex-1 space-y-1 px-3 py-5">
        {NAVIGATION.map(({ label, to, Icon, prefix }) => {
          const active =
            path === prefix || (prefix !== "/customer" && path.startsWith(`${prefix}/`));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#E30613] ${
                active ? "bg-[#FCF0F1] text-[#C90016]" : "text-[#40536A] hover:bg-[#F7F9FC]"
              }`}
            >
              <Icon aria-hidden="true" className="size-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#E5EAF0] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#F7F9FC] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FCF0F1] text-sm font-bold text-[#C90016]">
            C
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#17212B]">Customer</p>
            <p className="text-xs text-[#718096]">Demo account</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerPortalPage({ view }: { view: PortalView }) {
  const { isLoading, isCustomerAuthenticated, accountProfile, signOut, updateProfile } =
    useDemoAccount();
  const { bags, restore } = useCart();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const recordId = decodeURIComponent(path.split("/").filter(Boolean).at(-1) ?? "");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>(INITIAL_NOTIFICATIONS);
  const [estimates, setEstimates] = useState<TransportEstimate[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const [estimateForm, setEstimateForm] = useState({
    origin: "",
    destination: "",
    distance: "",
    quantity: String(bags || ""),
    weight: "",
  });
  const [estimateError, setEstimateError] = useState("");
  const [estimateMessage, setEstimateMessage] = useState("");
  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    orderUpdates: true,
    transportUpdates: true,
  });
  const [submittedQuotations, setSubmittedQuotations] = useState<DemoQuotation[]>([]);
  const [staffWorkspace, setStaffWorkspace] = useState<StaffDemoWorkspace | null>(null);

  useEffect(() => {
    try {
      setSubmittedQuotations(readSubmittedDemoQuotations());
    } catch (error) {
      setNotice(
        `Could not load submitted demo quotations: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      setStaffWorkspace(readStaffDemoWorkspace());
    } catch (error) {
      setNotice(
        `Could not load staff-updated demo records: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      setNotifications(loadNotifications());
    } catch (error) {
      setNotice(
        `Could not load demo notifications: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      setEstimates(loadEstimates());
    } catch (error) {
      setNotice(
        `Could not load transport estimates: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      const storedPreferences = window.localStorage.getItem("ppc-customer-demo-preferences-v1");
      if (storedPreferences) {
        const parsed: unknown = JSON.parse(storedPreferences);
        if (isNotificationPreferences(parsed)) {
          setPreferences(parsed);
        } else {
          throw new Error("Saved preference data has an invalid format.");
        }
      }
    } catch (error) {
      setNotice(
        `Could not load demo preferences: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "ppc-customer-demo-notifications-v1",
        JSON.stringify(notifications),
      );
    } catch {
      setNotice("Notification changes could not be saved in this browser.");
    }
  }, [notifications]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ppc-customer-demo-estimates-v1", JSON.stringify(estimates));
    } catch {
      setNotice("Transport estimates could not be saved in this browser.");
    }
  }, [estimates]);

  if (isLoading) return null;
  if (!isCustomerAuthenticated) return <Navigate to="/login" replace />;

  const unreadCount = notifications.filter((item) => !item.read).length;
  const quotations = [...submittedQuotations, ...QUOTATIONS];
  const customerSubmittedIds = new Set(submittedQuotations.map((quotation) => quotation.id));
  const staffOrders: DemoOrder[] = (staffWorkspace?.orders ?? [])
    .filter(
      (order) =>
        customerSubmittedIds.has(order.quotationId) &&
        order.account === accountProfile?.accountNumber,
    )
    .map((order) => {
      const allocated = (staffWorkspace?.payments ?? [])
        .filter(
          (payment) =>
            payment.orderId === order.id &&
            ["Verified", "Allocated", "Partially Allocated"].includes(payment.status),
        )
        .reduce((sum, payment) => sum + payment.allocatedCents, 0);
      return {
        id: order.id,
        quotationId: order.quotationId,
        date: order.date,
        status: order.status,
        paymentStatus:
          allocated >= order.totalCents
            ? "Paid (demo)"
            : allocated > 0
              ? "Partially paid (demo)"
              : "Awaiting payment",
        completionDate: order.completionDate,
        products: order.lines
          .map(
            (line) =>
              QUOTATION_PRODUCTS.find((product) => product.id === line.productId)?.material ??
              line.productId,
          )
          .join(", "),
        totalCents: order.totalCents,
      };
    });
  const portalOrders = [...ORDERS, ...staffOrders];
  const selectedQuotation = quotations.find((item) => item.id === recordId);
  const selectedOrder = portalOrders.find((item) => item.id === recordId);
  const selectedNotification = notifications.find((item) => item.id === recordId);
  const selectedEstimate = estimates.find((item) => item.id === recordId);
  const activeQuotations = quotations.filter((item) =>
    ["Draft", "Pending Review", "Information Requested", "Approved"].includes(item.status),
  );
  const finishedQuotations = quotations.filter((item) =>
    ["Finished", "Rejected", "Converted to Order", "Expired"].includes(item.status),
  );
  const displayedQuotations = quotations.filter((item) => {
    if (
      view === "drafts" &&
      !["Draft", "Pending Review", "Information Requested", "Approved"].includes(item.status)
    )
      return false;
    if (
      view === "finished" &&
      !["Finished", "Rejected", "Converted to Order", "Expired"].includes(item.status)
    )
      return false;
    if (filter === "Pending Quotations (Draft)" && item.status !== "Draft") return false;
    if (
      filter === "Finished Quotations" &&
      !["Finished", "Rejected", "Converted to Order", "Expired"].includes(item.status)
    )
      return false;
    return `${item.id} ${item.status} ${productSummary(item)}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  const filteredNotifications = notifications.filter((item) => {
    if (filter === "Unread" && item.read) return false;
    if (
      ["Quotations", "Payments", "Orders", "Transport"].includes(filter) &&
      item.category !== filter
    )
      return false;
    return `${item.title} ${item.message} ${item.reference ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  const filteredOrders = portalOrders.filter((item) => {
    if (filter !== "All Orders" && item.status !== filter) return false;
    return `${item.id} ${item.quotationId} ${item.products}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  const toggleNotification = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: !item.read } : item)),
    );
  };

  const openDraft = (quotation: DemoQuotation) => {
    restore({
      items: Object.fromEntries(quotation.lines.map((line) => [line.productId, line.quantity])),
      prices: Object.fromEntries(
        quotation.lines.map((line) => [line.productId, line.unitPriceCents]),
      ),
      method: quotation.method === "COLLECT" ? "collect" : "delivery",
      methodSelected: true,
    });
    void navigate({ to: "/buy" });
  };

  const saveEstimate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstimateError("");
    setEstimateMessage("");
    const distanceKm = Number(estimateForm.distance);
    const quantity = Number(estimateForm.quantity);
    const weightTonnes = Number(estimateForm.weight);
    if (!estimateForm.origin.trim() || !estimateForm.destination.trim()) {
      setEstimateError("Enter an origin and destination.");
      return;
    }
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      setEstimateError("Enter a positive estimated distance in kilometres.");
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity % 40 !== 0) {
      setEstimateError("Enter a positive bag quantity in increments of 40.");
      return;
    }
    if (!Number.isFinite(weightTonnes) || weightTonnes <= 0) {
      setEstimateError("Enter the known total load weight in tonnes. Weight is not assumed.");
      return;
    }
    const cost = distanceKm * weightTonnes * 0.1;
    const estimate: TransportEstimate = {
      id: `EST-${Date.now()}`,
      origin: estimateForm.origin.trim(),
      destination: estimateForm.destination.trim(),
      distanceKm,
      quantity,
      weightTonnes,
      rate: 0.1,
      cost,
      date: new Date().toLocaleDateString("en-GB"),
    };
    setEstimates((current) => [estimate, ...current]);
    setEstimateMessage(
      `Estimate ${estimate.id} saved in this browser. It is not a transport booking.`,
    );
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email =
      profileDraft["workEmailAddress"] ??
      profileDraft["emailAddress"] ??
      accountProfile?.emailAddress ??
      "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice("Enter a valid email address before saving.");
      return;
    }
    if (!accountProfile) return;
    try {
      updateProfile({
        ...accountProfile,
        companyOrIndividual:
          profileDraft["fullLegalName"] ??
          profileDraft["registeredLegalName"] ??
          accountProfile.companyOrIndividual,
        emailAddress: email,
        phoneNumber:
          profileDraft["primaryPhoneNumber"] ??
          profileDraft["companyPhoneNumbers"] ??
          accountProfile.phoneNumber,
        faxNumber: profileDraft["faxNumber"] ?? accountProfile.faxNumber,
        fields: { ...accountProfile.fields, ...profileDraft },
      });
      setNotice(
        "Demo profile changes saved in this browser. PPC’s official customer record was not changed.",
      );
      void navigate({ to: "/customer/profile" });
    } catch {
      setNotice(
        "Could not save the demo profile to this browser. Your changes remain in the form.",
      );
    }
  };

  const page = renderPortalView();

  function renderPortalView(): ReactNode {
    if (view === "dashboard") {
      return (
        <>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-[30px]">
                Welcome back, {accountProfile?.companyOrIndividual || "Customer"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#718096]">
                Manage your quotations, orders, deliveries and account details from one place.
              </p>
            </div>
            <PrimaryLink to="/customer/quotations/new">
              <span aria-hidden="true">+</span> Make New Quotation
            </PrimaryLink>
          </div>
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Active Quotations"
              value={String(activeQuotations.length)}
              Icon={FileText}
              to="/customer/quotations/drafts"
            />
            <SummaryCard
              label="Completed Quotations"
              value={String(finishedQuotations.length)}
              Icon={Check}
              to="/customer/quotations/finished"
            />
            <SummaryCard
              label="Active Orders"
              value={String(portalOrders.filter((item) => item.status !== "Completed").length)}
              Icon={PackageCheck}
              to="/customer/orders"
            />
            <SummaryCard
              label="Unread Notifications"
              value={String(unreadCount)}
              Icon={Bell}
              to="/customer/notifications"
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <SectionHeader
                title="Recent Quotations"
                action={
                  <Link to="/customer/quotations" className="text-sm font-semibold text-[#C90016]">
                    View All
                  </Link>
                }
              />
              <DataTable>
                <thead>
                  <TableHeader
                    columns={["Quotation Number", "Date", "Total (USD)", "Status", "Action"]}
                  />
                </thead>
                <tbody>
                  {quotations.slice(0, 3).map((item) => (
                    <tr key={item.id} className="border-t border-[#E5EAF0]">
                      <td className="px-3 py-3 font-semibold">{item.id}</td>
                      <td className="px-3 py-3">{item.date}</td>
                      <td className="px-3 py-3">
                        {MONEY(grandTotalCents(item.lines, item.taxRateBps, item.taxInclusive))}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to="/customer/quotations/$quotationId"
                          params={{ quotationId: item.id }}
                          className="font-semibold text-[#C90016]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
            <Card>
              <SectionHeader
                title="Recent Orders"
                action={
                  <Link to="/customer/orders" className="text-sm font-semibold text-[#C90016]">
                    View All
                  </Link>
                }
              />
              <DataTable>
                <thead>
                  <TableHeader
                    columns={[
                      "Order Number",
                      "Date",
                      "Products",
                      "Total (USD)",
                      "Status",
                      "Action",
                    ]}
                  />
                </thead>
                <tbody>
                  {portalOrders.map((item) => (
                    <tr key={item.id} className="border-t border-[#E5EAF0]">
                      <td className="px-3 py-3 font-semibold">{item.id}</td>
                      <td className="px-3 py-3">{item.date}</td>
                      <td className="px-3 py-3">{item.products}</td>
                      <td className="px-3 py-3">{MONEY(item.totalCents)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to="/customer/orders/$orderId"
                          params={{ orderId: item.id }}
                          className="font-semibold text-[#C90016]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
            <Card>
              <SectionHeader
                title="Recent Notifications"
                action={
                  <Link
                    to="/customer/notifications"
                    className="text-sm font-semibold text-[#C90016]"
                  >
                    View All Notifications
                  </Link>
                }
              />
              <NotificationList items={notifications.slice(0, 3)} toggle={toggleNotification} />
            </Card>
            <Card>
              <SectionHeader title="Transport Overview" />
              {estimates.length ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#40536A]">
                    Most recent estimate: {estimates[0]?.id} — {estimates[0]?.destination}
                  </p>
                  <StatusBadge value="Estimate Only" />
                  <div>
                    <PrimaryLink to="/customer/transport/tracking">Track Delivery</PrimaryLink>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-[#40536A]">Need PPC-organised transport?</p>
                  <PrimaryLink to="/customer/transport/calculator">Calculate Transport</PrimaryLink>
                </>
              )}
            </Card>
          </div>
        </>
      );
    }

    if (view === "quotations" || view === "drafts" || view === "finished") {
      const title =
        view === "drafts"
          ? "Pending Quotations"
          : view === "finished"
            ? "Finished Quotations"
            : "My Quotations";
      return (
        <>
          <PageHeading
            title={title}
            subtitle={
              view === "drafts"
                ? "Continue quotations that are still being prepared or reviewed."
                : view === "finished"
                  ? "Review quotations that have been completed or finalised."
                  : "Create, review and manage your PPC cement quotations."
            }
            action={<PrimaryLink to="/customer/quotations/new">+ Make New Quotation</PrimaryLink>}
          />
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Draft Quotations"
              value={String(quotations.filter((item) => item.status === "Draft").length)}
            />
            <MetricCard
              label="Pending Review"
              value={String(quotations.filter((item) => item.status === "Pending Review").length)}
            />
            <MetricCard label="Finished Quotations" value={String(finishedQuotations.length)} />
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {["All Quotations", "Pending Quotations (Draft)", "Finished Quotations"].map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      aria-pressed={filter === tab}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === tab ? "bg-[#FCF0F1] text-[#C90016]" : "text-[#40536A] hover:bg-[#F7F9FC]"}`}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>
              <input
                aria-label="Search quotations"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search quotations"
                className="h-10 rounded-lg border border-[#E5EAF0] px-3 text-sm"
              />
            </div>
            {displayedQuotations.length ? (
              <DataTable>
                <thead>
                  <TableHeader
                    columns={[
                      "Quotation Number",
                      "Date Created",
                      "Shipping",
                      "Product Summary",
                      "Total (USD)",
                      "Status",
                      "Actions",
                    ]}
                  />
                </thead>
                <tbody>
                  {displayedQuotations.map((item) => (
                    <tr key={item.id} className="border-t border-[#E5EAF0]">
                      <td className="px-3 py-3 font-semibold">{item.id}</td>
                      <td className="px-3 py-3">{item.date}</td>
                      <td className="px-3 py-3">{item.method}</td>
                      <td className="max-w-[260px] px-3 py-3">{productSummary(item)}</td>
                      <td className="px-3 py-3">
                        {MONEY(grandTotalCents(item.lines, item.taxRateBps, item.taxInclusive))}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            to="/customer/quotations/$quotationId"
                            params={{ quotationId: item.id }}
                            className="font-semibold text-[#C90016]"
                          >
                            View
                          </Link>
                          {item.status === "Draft" && (
                            <button
                              type="button"
                              onClick={() => openDraft(item)}
                              className="font-semibold text-[#40536A]"
                            >
                              Continue Draft
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState
                title="No quotations in this view"
                detail="Create a quotation through the existing Buy Cement flow to get started."
                action={<PrimaryLink to="/customer/quotations/new">Make New Quotation</PrimaryLink>}
              />
            )}
            <DemoNotice />
          </Card>
        </>
      );
    }

    if (view === "quotation-new") {
      return (
        <>
          <PageHeading
            title="New Quotation"
            subtitle="Start a quotation using your existing PPC cement cart and quantity rules."
          />
          <Card>
            <h2 className="text-lg font-semibold">
              Continue with the existing Buy Cement workflow
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718096]">
              Choose products, quantities and collection or delivery in the existing Buy Cement
              page. Your cart is shared with the quotation page; no second cart is created.
            </p>
            <div className="mt-5">
              <PrimaryLink to="/buy">Open Buy Cement</PrimaryLink>
            </div>
          </Card>
        </>
      );
    }

    if (view === "quotation-detail") {
      if (!selectedQuotation)
        return (
          <NotFound
            message="This demo quotation was not found in your account."
            backTo="/customer/quotations"
          />
        );
      const quotationTotals = calculateQuotationTotals(
        selectedQuotation.lines.map((line) => ({
          id: line.productId,
          qty: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
        selectedQuotation.taxRateBps ?? 1550,
        selectedQuotation.taxInclusive ?? false,
      );
      return (
        <>
          <PageHeading
            title={`Quotation ${selectedQuotation.id}`}
            subtitle="Quotation details — demonstration record."
            action={
              <Link to="/customer/quotations" className="text-sm font-semibold text-[#C90016]">
                Return to Quotations
              </Link>
            }
          />
          <Card>
            <div className="mb-5 flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs text-[#718096]">
                  Created {selectedQuotation.date} · Shipping {selectedQuotation.method}
                </p>
                <StatusBadge value={selectedQuotation.status} />
              </div>
              {selectedQuotation.status === "Draft" && (
                <button
                  type="button"
                  onClick={() => openDraft(selectedQuotation)}
                  className="rounded-lg border border-[#E5EAF0] px-4 py-2 text-sm font-semibold"
                >
                  Continue Editing
                </button>
              )}
            </div>
            <DataTable>
              <thead>
                <TableHeader columns={["Material", "Quantity", "Unit Price", "Line Total"]} />
              </thead>
              <tbody>
                {selectedQuotation.lines.map((line) => {
                  const product = QUOTATION_PRODUCTS.find((item) => item.id === line.productId);
                  return (
                    <tr key={line.productId} className="border-t border-[#E5EAF0]">
                      <td className="px-3 py-3">{product?.material}</td>
                      <td className="px-3 py-3 text-right">{line.quantity}</td>
                      <td className="px-3 py-3 text-right">{MONEY(line.unitPriceCents)}</td>
                      <td className="px-3 py-3 text-right">
                        {MONEY(line.quantity * line.unitPriceCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <div className="ml-auto mt-5 max-w-sm space-y-2 border-t border-[#E5EAF0] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Amount excluding VAT</span>
                <span>{MONEY(quotationTotals.amountExcludingVatCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  VAT {(selectedQuotation.taxRateBps ?? 1550) / 100}%
                  {selectedQuotation.taxInclusive ? " included" : ""}
                </span>
                <span>{MONEY(quotationTotals.outputTaxCents)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span>{MONEY(quotationTotals.grandTotalCents)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#718096]">
              Conditions-of-sale acknowledgement:{" "}
              {selectedQuotation.conditionsAcknowledged || selectedQuotation.status === "Finished"
                ? "Recorded in this demo quotation."
                : "Not yet recorded."}
            </p>
            <DemoNotice />
          </Card>
        </>
      );
    }

    if (view === "notifications" || view === "notification-detail") {
      if (view === "notification-detail") {
        if (!selectedNotification)
          return <NotFound message="Notification not found." backTo="/customer/notifications" />;
        return (
          <>
            <PageHeading
              title={selectedNotification.title}
              subtitle={`${selectedNotification.category} · ${selectedNotification.date}`}
              action={
                <Link to="/customer/notifications" className="text-sm font-semibold text-[#C90016]">
                  Back to Notifications
                </Link>
              }
            />
            <Card>
              <StatusBadge value={selectedNotification.read ? "Read" : "Unread"} />
              <p className="mt-4 text-sm leading-6">{selectedNotification.message}</p>
              {selectedNotification.reference && (
                <p className="mt-3 text-sm text-[#718096]">
                  Reference: {selectedNotification.reference}
                </p>
              )}
              <Link
                to={selectedNotification.href}
                className="mt-5 inline-flex text-sm font-semibold text-[#C90016]"
              >
                Open related item <ChevronRight className="ml-1 size-4" />
              </Link>
            </Card>
          </>
        );
      }
      const notificationFilters = [
        "All",
        "Unread",
        "Quotations",
        "Payments",
        "Orders",
        "Transport",
      ];
      return (
        <>
          <PageHeading
            title="Notifications"
            subtitle="Stay up to date with your quotations, payments and orders."
            action={
              <button
                type="button"
                onClick={() =>
                  setNotifications((current) => current.map((item) => ({ ...item, read: true })))
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#E5EAF0] px-4 text-sm font-semibold"
              >
                <CheckCheck className="size-4" />
                Mark All as Read
              </button>
            }
          />
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total Notifications" value={String(notifications.length)} />
            <MetricCard label="Unread" value={String(unreadCount)} />
            <MetricCard
              label="Quotations"
              value={String(notifications.filter((item) => item.category === "Quotations").length)}
            />
            <MetricCard label="Payments" value="0" />
            <MetricCard
              label="Orders & Deliveries"
              value={String(
                notifications.filter((item) => ["Orders", "Transport"].includes(item.category))
                  .length,
              )}
            />
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap gap-2">
              {notificationFilters.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  aria-pressed={filter === tab}
                  className={`rounded-lg px-3 py-2 text-sm ${filter === tab ? "bg-[#FCF0F1] font-semibold text-[#C90016]" : "text-[#40536A]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <NotificationList items={filteredNotifications} toggle={toggleNotification} />
            <DemoNotice />
          </Card>
        </>
      );
    }

    if (view === "orders" || view === "order-detail") {
      if (view === "order-detail") {
        if (!selectedOrder)
          return (
            <NotFound message="Order not found in this demo account." backTo="/customer/orders" />
          );
        return (
          <>
            <PageHeading
              title={`Order ${selectedOrder.id}`}
              subtitle="Sales processing record · Demo data only."
              action={
                <Link
                  to="/customer/quotations/$quotationId"
                  params={{ quotationId: selectedOrder.quotationId }}
                  className="text-sm font-semibold text-[#C90016]"
                >
                  View Related Quotation
                </Link>
              }
            />
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Order date" value={selectedOrder.date} />
                <Detail label="Related quotation" value={selectedOrder.quotationId} />
                <Detail label="Products" value={selectedOrder.products} />
                <Detail label="Total" value={MONEY(selectedOrder.totalCents)} />
                <Detail label="Payment status" value={selectedOrder.paymentStatus} />
                <Detail label="Order status" value={selectedOrder.status} />
                <Detail
                  label="Completion date"
                  value={selectedOrder.completionDate || "Not completed"}
                />
              </div>
              <h2 className="mb-3 mt-7 text-base font-semibold">Order progress</h2>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  "Received by Sales",
                  "Processing",
                  "Awaiting Payment",
                  "Preparing",
                  "Ready for Collection / Dispatch",
                  "In Transit",
                  "Completed",
                ].map((step) => (
                  <li
                    key={step}
                    className={`rounded-lg border p-3 text-sm ${step === selectedOrder.status ? "border-amber-300 bg-amber-50 font-semibold" : "border-[#E5EAF0] text-[#718096]"}`}
                  >
                    {step}
                    {step === selectedOrder.status ? " · Current status (demo)" : ""}
                  </li>
                ))}
              </ol>
              <DemoNotice />
            </Card>
          </>
        );
      }
      const orderFilters = [
        "All Orders",
        "Processing",
        "Awaiting Payment",
        "Ready for Collection",
        "In Transit",
        "Completed",
        "Cancelled",
      ];
      return (
        <>
          <PageHeading
            title="My Orders"
            subtitle="Track orders submitted to and processed by the PPC sales department."
          />
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="All Orders" value={String(portalOrders.length)} />
            <MetricCard
              label="Processing"
              value={String(portalOrders.filter((item) => item.status === "Processing").length)}
            />
            <MetricCard
              label="Awaiting Payment"
              value={String(
                portalOrders.filter((item) => item.status === "Awaiting Payment").length,
              )}
            />
            <MetricCard label="Completed" value="0" />
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap gap-2">
              {orderFilters.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-lg px-3 py-2 text-sm ${filter === tab ? "bg-[#FCF0F1] font-semibold text-[#C90016]" : "text-[#40536A]"}`}
                >
                  {tab}
                </button>
              ))}
              <input
                aria-label="Search orders"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search order or quotation"
                className="ml-auto h-10 rounded-lg border border-[#E5EAF0] px-3 text-sm"
              />
            </div>
            {filteredOrders.length ? (
              <DataTable>
                <thead>
                  <TableHeader
                    columns={[
                      "Order Number",
                      "Related Quotation",
                      "Order Date",
                      "Products",
                      "Total (USD)",
                      "Payment Status",
                      "Fulfilment Status",
                      "Completion Date",
                      "Action",
                    ]}
                  />
                </thead>
                <tbody>
                  {filteredOrders.map((item) => (
                    <tr key={item.id} className="border-t border-[#E5EAF0]">
                      <td className="px-3 py-3 font-semibold">{item.id}</td>
                      <td className="px-3 py-3">{item.quotationId}</td>
                      <td className="px-3 py-3">{item.date}</td>
                      <td className="px-3 py-3">{item.products}</td>
                      <td className="px-3 py-3">{MONEY(item.totalCents)}</td>
                      <td className="px-3 py-3">{item.paymentStatus}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="px-3 py-3">{item.completionDate || "Not completed"}</td>
                      <td className="px-3 py-3">
                        <Link
                          to="/customer/orders/$orderId"
                          params={{ orderId: item.id }}
                          className="font-semibold text-[#C90016]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState
                title="No orders match this filter"
                detail="Orders are shown only when present in the sales workflow."
              />
            )}
            <DemoNotice />
          </Card>
        </>
      );
    }

    if (
      ["transport", "transport-calculator", "transport-tracking", "tracking-detail"].includes(view)
    ) {
      if (view === "transport-calculator") {
        const distance = Number(estimateForm.distance);
        const weight = Number(estimateForm.weight);
        const estimateCost = distance > 0 && weight > 0 ? distance * weight * 0.1 : null;
        return (
          <>
            <PageHeading
              title="Transport Cost Calculator"
              subtitle="Estimate the cost of PPC-organised transport based on your load and delivery distance."
            />
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <form onSubmit={saveEstimate} className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Transport origin"
                    value={estimateForm.origin}
                    onChange={(value) => setEstimateForm({ ...estimateForm, origin: value })}
                    placeholder="Enter collection point"
                  />
                  <TextField
                    label="Destination"
                    value={estimateForm.destination}
                    onChange={(value) => setEstimateForm({ ...estimateForm, destination: value })}
                    placeholder="Town/city and address"
                  />
                  <TextField
                    label="Distance (km) — manually estimated"
                    type="number"
                    value={estimateForm.distance}
                    onChange={(value) => setEstimateForm({ ...estimateForm, distance: value })}
                  />
                  <TextField
                    label="Load quantity (bags; increments of 40)"
                    type="number"
                    value={estimateForm.quantity}
                    onChange={(value) => setEstimateForm({ ...estimateForm, quantity: value })}
                  />
                  <TextField
                    label="Total load weight (tonnes; enter known weight)"
                    type="number"
                    value={estimateForm.weight}
                    onChange={(value) => setEstimateForm({ ...estimateForm, weight: value })}
                  />
                  <div className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    Provisional demonstration rate: USD $0.10 per kilometre per tonne. This
                    interprets the supplied rate for distance calculations and requires confirmation
                    by PPC; it is not an official tariff. No bag weight or depot address is assumed.
                  </div>
                  {estimateError && (
                    <p role="alert" className="sm:col-span-2 text-sm text-red-700">
                      {estimateError}
                    </p>
                  )}
                  {estimateMessage && (
                    <p role="status" className="sm:col-span-2 text-sm text-green-800">
                      {estimateMessage}
                    </p>
                  )}
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#E30613] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Save Estimate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEstimateForm({
                          origin: "",
                          destination: "",
                          distance: "",
                          quantity: String(bags || ""),
                          weight: "",
                        });
                        setEstimateError("");
                        setEstimateMessage("");
                      }}
                      className="rounded-lg border border-[#E5EAF0] px-4 py-2.5 text-sm font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </Card>
              <Card>
                <h2 className="text-base font-semibold">Estimate Summary</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <Detail label="Load quantity" value={`${estimateForm.quantity || "—"} bags`} />
                  <Detail
                    label="Total load weight"
                    value={weight > 0 ? `${weight} tonnes` : "Not provided"}
                  />
                  <Detail
                    label="Distance"
                    value={distance > 0 ? `${distance} km (estimate)` : "Not provided"}
                  />
                  <Detail label="Rate applied" value="$0.10 / km / tonne (provisional)" />
                </dl>
                <p className="mt-6 border-t border-[#E5EAF0] pt-5 text-xs font-semibold text-[#718096]">
                  Estimated transport cost
                </p>
                <p className="mt-1 text-3xl font-bold text-[#C90016]">
                  {estimateCost === null
                    ? "Enter distance and weight"
                    : formatCurrency(estimateCost)}
                </p>
                <p className="mt-3 text-xs text-[#718096]">
                  Estimate only — no transport request is submitted or booked.
                </p>
              </Card>
            </div>
          </>
        );
      }
      if (view === "transport-tracking" || view === "tracking-detail") {
        const matchingEstimate =
          selectedEstimate ??
          estimates.find((item) => item.id.toLowerCase() === trackingSearch.trim().toLowerCase());
        return (
          <>
            <PageHeading
              title="Track Your Delivery"
              subtitle="Status tracking only; live GPS and carrier updates are not connected."
            />
            <Card>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setTrackingError(
                    matchingEstimate
                      ? ""
                      : "No saved estimate or authorised tracking record matches that reference.",
                  );
                }}
                className="flex flex-wrap gap-3"
              >
                <input
                  aria-label="Transport or tracking reference"
                  value={trackingSearch}
                  onChange={(event) => setTrackingSearch(event.currentTarget.value)}
                  placeholder="Transport / tracking reference"
                  className="h-11 min-w-[250px] flex-1 rounded-lg border border-[#E5EAF0] px-3 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#E30613] px-4 text-sm font-semibold text-white"
                >
                  Track Delivery
                </button>
              </form>
              {trackingError && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {trackingError}
                </p>
              )}
              {matchingEstimate && (
                <div className="mt-5 rounded-lg border border-[#E5EAF0] p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <h2 className="font-semibold">{matchingEstimate.id}</h2>
                    <StatusBadge value="Estimate Only" />
                  </div>
                  <p className="mt-3 text-sm text-[#40536A]">
                    {matchingEstimate.origin} → {matchingEstimate.destination}
                  </p>
                  <p className="mt-1 text-xs text-[#718096]">
                    {matchingEstimate.quantity} bags · {matchingEstimate.distanceKm} km · saved{" "}
                    {matchingEstimate.date}
                  </p>
                  <p className="mt-3 text-xs text-amber-800">
                    This is a saved estimate, not a transport request. No dispatch, truck, driver,
                    GPS position, or arrival time is available.
                  </p>
                </div>
              )}
              <DemoNotice />
            </Card>
          </>
        );
      }
      return (
        <>
          <PageHeading
            title="Transport & Logistics"
            subtitle="Estimate PPC-organised transport and follow the progress of your deliveries."
            action={
              <div className="flex gap-2">
                <PrimaryLink to="/customer/transport/calculator">Calculate Transport</PrimaryLink>
                <PrimaryLink to="/customer/transport/tracking">Track a Delivery</PrimaryLink>
              </div>
            }
          />
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active Transport Requests" value="0" />
            <MetricCard label="Loads in Transit" value="0" />
            <MetricCard label="Completed Deliveries" value="0" />
            <MetricCard label="Saved Estimates" value={String(estimates.length)} />
          </div>
          <Card>
            <SectionHeader title="Recent transport estimates" />
            <TransportTable estimates={estimates} />
            <DemoNotice />
          </Card>
        </>
      );
    }

    if (view === "profile" || view === "profile-edit") {
      const profile = accountProfile;
      if (!profile) return <NotFound message="Profile not found." backTo="/customer" />;
      if (view === "profile-edit") {
        const fields: Array<[string, string, string]> =
          profile.accountType === "company"
            ? [
                ["registeredLegalName", "Registered Legal Name", "text"],
                ["tradingName", "Trading Name", "text"],
                ["companyRegistrationNumber", "Company Registration Number", "text"],
                ["taxIdentificationNumber", "Tax Identification Number (TIN / BP Number)", "text"],
                ["vatRegistrationNumber", "VAT / Sales Tax Registration Number", "text"],
                ["incorporationDetails", "Date & Place of Incorporation", "text"],
                ["registeredOfficeAddress", "Registered Physical Office Address", "text"],
                ["companyPhoneNumbers", "Phone Numbers", "tel"],
                ["industrySector", "Industry / Sector", "text"],
                ["accreditationsLicenses", "Accreditations & Licenses", "text"],
                ["accountNumber", "Account number (read-only)", "text"],
                ["emailAddress", "Email address", "email"],
                ["buyerAttention", "Attention (buyer)", "text"],
                ["deliveryAddress", "Goods delivery address", "text"],
                ["taxClearanceStatus", "Tax clearance status", "text"],
              ]
            : [
                ["fullLegalName", "Full Legal Name", "text"],
                ["dateOfBirth", "Date of Birth", "date"],
                ["placeCountryOfBirth", "Place / Country of Birth", "text"],
                ["genderIdentity", "Gender Identity", "text"],
                ["nationalityCitizenship", "Nationality / Citizenship", "text"],
                ["nationalIdNumber", "National ID / Identity Card Number", "text"],
                ["passportDetails", "Passport Details", "text"],
                ["personalTaxReference", "Tax Reference / Personal TIN", "text"],
                ["socialSecurityNumber", "Social Security / National Pension Number", "text"],
                ["primaryPhysicalAddress", "Primary Physical Address", "text"],
                ["workEmailAddress", "Work Email Address", "email"],
                ["primaryPhoneNumber", "Primary Phone / Mobile Number", "tel"],
                ["accountNumber", "Account number (read-only)", "text"],
                ["faxNumber", "Fax number", "tel"],
                ["buyerAttention", "Attention (buyer)", "text"],
                ["deliveryAddress", "Goods delivery address", "text"],
                ["taxClearanceStatus", "Tax clearance status", "text"],
              ];
        return (
          <>
            <PageHeading
              title="Edit Profile"
              subtitle="Keep your customer and delivery details up to date."
            />
            <Card>
              <form onSubmit={saveProfile}>
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {fields.map(([name, label, type]) => (
                    <label key={name} className="block text-sm font-semibold text-[#40536A]">
                      {label}
                      <input
                        type={type}
                        readOnly={name === "accountNumber"}
                        value={
                          profileDraft[name] ??
                          profile.fields[name] ??
                          (name === "emailAddress" || name === "workEmailAddress"
                            ? profile.emailAddress
                            : name === "fullLegalName" || name === "registeredLegalName"
                              ? profile.companyOrIndividual
                              : name === "faxNumber"
                                ? profile.faxNumber
                                : "")
                        }
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            [name]: event.currentTarget.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-[#E5EAF0] px-3 text-sm font-normal read-only:bg-slate-50"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs text-amber-800">
                  Demo profile data is stored in this browser only; this does not update PPC’s
                  official customer database.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#E30613] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Save Changes
                  </button>
                  <Link
                    to="/customer/profile"
                    className="rounded-lg border border-[#E5EAF0] px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </Card>
          </>
        );
      }
      return (
        <>
          <PageHeading
            title="My Profile"
            subtitle="View and manage your customer and contact information."
            action={<PrimaryLink to="/customer/profile/edit">Edit Profile</PrimaryLink>}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-base font-semibold">Customer information</h2>
              <dl className="space-y-3">
                <Detail label="Customer name" value={profile.companyOrIndividual} />
                <Detail label="Account type" value={profile.accountType} />
                <Detail label="Email address" value={profile.emailAddress} />
                <Detail label="Phone number" value={profile.phoneNumber || "Not provided"} />
                <Detail label="Account number" value={profile.accountNumber || "Not provided"} />
                <Detail label="Account status" value="Demo account" />
              </dl>
            </Card>
            <Card>
              <h2 className="mb-4 text-base font-semibold">Addresses and delivery</h2>
              <dl className="space-y-3">
                <Detail
                  label="Registered address"
                  value={
                    profile.fields["registeredOfficeAddress"] ??
                    profile.fields["primaryPhysicalAddress"] ??
                    "Not provided"
                  }
                />
                <Detail
                  label="Delivery address"
                  value={profile.fields["deliveryAddress"] ?? "Not provided"}
                />
                <Detail label="Fax number" value={profile.faxNumber || "Not provided"} />
              </dl>
              <p className="mt-5 text-xs text-amber-800">
                Displayed profile data is for demonstration and is not verified against PPC records.
              </p>
            </Card>
          </div>
        </>
      );
    }

    if (view === "settings") {
      const preferenceFields: Array<[keyof typeof preferences, string]> = [
        ["email", "Email notifications"],
        ["orderUpdates", "Order update notifications"],
        ["transportUpdates", "Transport update notifications"],
      ];
      return (
        <>
          <PageHeading
            title="Settings"
            subtitle="Manage local demonstration preferences and your session."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="text-base font-semibold">Notification preferences</h2>
              <p className="mb-4 mt-1 text-xs text-[#718096]">
                Preferences are stored in this browser only.
              </p>
              {preferenceFields.map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between border-t border-[#E5EAF0] py-4 text-sm"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={(event) => {
                      const next = { ...preferences, [key]: event.currentTarget.checked };
                      setPreferences(next);
                      try {
                        window.localStorage.setItem(
                          "ppc-customer-demo-preferences-v1",
                          JSON.stringify(next),
                        );
                        setNotice("Demo notification preference saved in this browser.");
                      } catch {
                        setNotice("Could not save preference in this browser.");
                      }
                    }}
                    className="size-4 accent-[#E30613]"
                  />
                </label>
              ))}
            </Card>
            <Card>
              <h2 className="text-base font-semibold">Account session</h2>
              <p className="mt-2 text-sm text-[#718096]">
                Password changes and production security settings require an authentication service.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#E5EAF0] px-4 py-2.5 text-sm font-semibold text-[#40536A]"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
              <p className="mt-4 text-xs text-amber-800">
                This development-only session does not provide production authentication.
              </p>
            </Card>
          </div>
        </>
      );
    }

    return (
      <EmptyState
        title="Page not found"
        detail="This customer portal page is not available."
        action={<PrimaryLink to="/customer">Return to Overview</PrimaryLink>}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#17212B] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-[#E5EAF0] lg:block">
        <CustomerSidebar path={path} />
      </aside>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="h-full w-[280px] max-w-[85vw] shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute left-[240px] top-3 z-10 rounded bg-white p-2"
            >
              <X className="size-5" />
            </button>
            <CustomerSidebar path={path} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1 lg:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#E5EAF0] bg-white px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 hover:bg-[#F7F9FC] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="truncate text-sm font-semibold sm:text-base">
              {NAVIGATION.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`))
                ?.label ?? "Customer Portal"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/customer/notifications"
              aria-label={`Notifications, ${unreadCount} unread`}
              className="relative rounded-lg p-2 text-[#40536A] hover:bg-[#F7F9FC]"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#E30613] text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-[#F7F9FC]">
                <span className="grid size-8 place-items-center rounded-full bg-[#FCF0F1] text-xs font-bold text-[#C90016]">
                  {(accountProfile?.companyOrIndividual?.[0] ?? "C").toUpperCase()}
                </span>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {accountProfile?.companyOrIndividual ?? "Customer"}
                </span>
                <ChevronRight className="size-4 rotate-90 text-[#718096]" />
              </summary>
              <div className="absolute right-0 top-11 z-40 w-44 rounded-lg border border-[#E5EAF0] bg-white p-2 shadow-lg">
                <Link
                  to="/customer/profile"
                  className="block rounded px-3 py-2 text-sm hover:bg-[#F7F9FC]"
                >
                  My Profile
                </Link>
                <Link
                  to="/customer/settings"
                  className="block rounded px-3 py-2 text-sm hover:bg-[#F7F9FC]"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[#F7F9FC]"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-[#E5EAF0] bg-white px-4 py-3 text-sm text-[#40536A]"
            >
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
                className="float-right"
              >
                <X className="size-4" />
              </button>
            </p>
          )}
          {page}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  Icon,
  to,
}: {
  label: string;
  value: string;
  Icon: typeof Bell;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[128px] items-center justify-between rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div>
        <p className="text-sm text-[#718096]">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-lg bg-[#FCF6F7] text-[#C90016]">
        <Icon className="size-5" />
      </span>
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5EAF0] bg-white p-4">
      <p className="text-xs text-[#718096]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}

function TableHeader({ columns }: { columns: string[] }) {
  return (
    <tr className="bg-[#F7F9FC] text-xs font-semibold text-[#40536A]">
      {columns.map((column) => (
        <th key={column} scope="col" className="px-3 py-3">
          {column}
        </th>
      ))}
    </tr>
  );
}

function NotificationList({
  items,
  toggle,
}: {
  items: PortalNotification[];
  toggle: (id: string) => void;
}) {
  if (!items.length)
    return (
      <p className="py-6 text-center text-sm text-[#718096]">No notifications match this filter.</p>
    );
  return (
    <ul className="divide-y divide-[#E5EAF0]">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-start gap-3 py-4 ${item.read ? "" : "rounded-lg bg-[#FCF6F7] px-3"}`}
        >
          <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#C90016]">
            {item.category === "Transport" ? (
              <Truck className="size-4" />
            ) : item.category === "Orders" ? (
              <PackageCheck className="size-4" />
            ) : item.category === "Payments" ? (
              <Check className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-between gap-2">
              <Link
                to="/customer/notifications/$notificationId"
                params={{ notificationId: item.id }}
                className="text-sm font-semibold hover:text-[#C90016]"
              >
                {item.title}
                {!item.read && (
                  <span
                    className="ml-2 inline-block size-2 rounded-full bg-[#E30613]"
                    aria-label="Unread"
                  />
                )}
              </Link>
              <span className="text-xs text-[#718096]">{item.date}</span>
            </div>
            <p className="mt-1 text-sm leading-5 text-[#40536A]">{item.message}</p>
            {item.reference && (
              <p className="mt-1 text-xs text-[#718096]">Reference: {item.reference}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-4">
              <Link to={item.href} className="text-xs font-semibold text-[#C90016]">
                Open Related Item
              </Link>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="text-xs font-semibold text-[#40536A]"
              >
                {item.read ? "Mark as Unread" : "Mark as Read"}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-[#E5EAF0] py-2 text-sm">
      <dt className="text-[#718096]">{label}</dt>
      <dd className="font-medium text-right">{value || "—"}</dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#40536A]">
      {label}
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-[#E5EAF0] px-3 text-sm font-normal text-[#17212B] focus:border-[#E30613] focus:outline-none focus:ring-2 focus:ring-[#E30613]/15"
      />
    </label>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function TransportTable({ estimates }: { estimates: TransportEstimate[] }) {
  if (!estimates.length)
    return (
      <p className="py-6 text-sm text-[#718096]">
        No saved transport estimates yet. Use the calculator to create one; estimates do not book
        transport.
      </p>
    );
  return (
    <DataTable>
      <thead>
        <TableHeader
          columns={[
            "Transport Reference",
            "Load",
            "Origin",
            "Destination",
            "Distance",
            "Estimated Cost",
            "Status",
          ]}
        />
      </thead>
      <tbody>
        {estimates.map((estimate) => (
          <tr key={estimate.id} className="border-t border-[#E5EAF0]">
            <td className="px-3 py-3">
              <Link
                to="/customer/transport/tracking/$trackingId"
                params={{ trackingId: estimate.id }}
                className="font-semibold text-[#C90016]"
              >
                {estimate.id}
              </Link>
            </td>
            <td className="px-3 py-3">
              {estimate.quantity} bags · {estimate.weightTonnes} t
            </td>
            <td className="px-3 py-3">{estimate.origin}</td>
            <td className="px-3 py-3">{estimate.destination}</td>
            <td className="px-3 py-3">{estimate.distanceKm} km</td>
            <td className="px-3 py-3">{formatCurrency(estimate.cost)}</td>
            <td className="px-3 py-3">
              <StatusBadge value="Estimate Only" />
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

function DemoNotice() {
  return (
    <p className="mt-5 border-t border-[#E5EAF0] pt-3 text-xs text-[#718096]">
      Demonstration data only. No quotation has been sent to PPC Sales and no payment or delivery
      event is confirmed.
    </p>
  );
}

function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-8 text-center">
      <CircleHelp aria-hidden="true" className="mx-auto size-7 text-[#718096]" />
      <h2 className="mt-2 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#718096]">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function NotFound({ message, backTo }: { message: string; backTo: string }) {
  return (
    <Card>
      <EmptyState
        title="Record not found"
        detail={message}
        action={<PrimaryLink to={backTo}>Return</PrimaryLink>}
      />
    </Card>
  );
}
