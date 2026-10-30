import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Printer } from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import { useCart } from "@/features/store/cart";
import { useDemoAccount } from "@/features/account/demo-account";
import { readStaffDemoWorkspace } from "@/features/staff/staffDemoData";
import { recordSubmittedDemoQuotation } from "@/features/account/demo-portal-quotations";
import { savePaymentCheckout } from "@/features/store/payment-checkout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONDITIONS_OF_SALE, CONDITIONS_URL } from "./conditions";
import {
  calculateQuotationTotals,
  formatQuotationUSD,
  QUOTATION_NUMBER,
  QUOTATION_PRODUCTS,
} from "./quotation-data";

const CUSTOMER_DRAFT_KEY = "ppc-zw-quotation-customer-v1";

type CustomerDetails = {
  companyOrIndividual: string;
  accountNumber: string;
  faxNumber: string;
  emailAddress: string;
};

const EMPTY_CUSTOMER_DETAILS: CustomerDetails = {
  companyOrIndividual: "",
  accountNumber: "",
  faxNumber: "",
  emailAddress: "",
};

function readCustomerDraft(
  value: string | null,
  accountProfile: CustomerDetails | null,
): CustomerDetails {
  if (!value) return accountProfile ?? EMPTY_CUSTOMER_DETAILS;

  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") return accountProfile ?? EMPTY_CUSTOMER_DETAILS;
  const draft = parsed as Partial<CustomerDetails>;

  return {
    companyOrIndividual:
      typeof draft.companyOrIndividual === "string" && draft.companyOrIndividual.trim()
        ? draft.companyOrIndividual
        : (accountProfile?.companyOrIndividual ?? ""),
    accountNumber:
      typeof draft.accountNumber === "string" && draft.accountNumber.trim()
        ? draft.accountNumber
        : (accountProfile?.accountNumber ?? ""),
    faxNumber:
      typeof draft.faxNumber === "string" && draft.faxNumber.trim()
        ? draft.faxNumber
        : (accountProfile?.faxNumber ?? ""),
    emailAddress:
      typeof draft.emailAddress === "string" && draft.emailAddress.trim()
        ? draft.emailAddress
        : (accountProfile?.emailAddress ?? ""),
  };
}

function CustomerField({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: keyof CustomerDetails;
  value: string;
  onChange: (name: keyof CustomerDetails, value: string) => void;
  type?: "text" | "email";
}) {
  return (
    <label className="grid grid-cols-[minmax(115px,0.8fr)_minmax(0,1.2fr)] items-center gap-2 border-b border-[#E5EAF0] py-2 text-sm leading-5">
      <span className="font-semibold text-[#40536A]">{label}</span>
      <input
        aria-label={label.replace(/:$/, "")}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.currentTarget.value)}
        className="min-w-0 border-0 border-b border-dashed border-[#B8C2CC] bg-transparent px-1 py-1 text-sm text-[#17212B] outline-none focus:border-[#E30613] print:border-transparent"
      />
    </label>
  );
}

export function ViewOrderPage() {
  const { isCustomerAuthenticated, accountProfile } = useDemoAccount();
  const {
    bags,
    method,
    methodSelected,
    qtyOf,
    lines: cartLines,
    priceChanges,
    refreshPrices,
  } = useCart();
  const [customerDetails, setCustomerDetails] = useState(EMPTY_CUSTOMER_DETAILS);
  const [taxSettings, setTaxSettings] = useState(() => {
    const settings = readStaffDemoWorkspace();
    return {
      rateBps: settings.taxRateBps,
      inclusive: settings.taxInclusive,
      category: settings.taxCategory,
      reason: settings.taxReason,
      taxRecordRequired: settings.taxRecordRequired,
    };
  });
  const [customerDraftLoaded, setCustomerDraftLoaded] = useState(false);
  const [draftWarning, setDraftWarning] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsReadToEnd, setTermsReadToEnd] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [continueMessage, setContinueMessage] = useState("");
  const termsScrollerRef = useRef<HTMLDivElement>(null);
  const paymentNavigationStarted = useRef(false);

  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    try {
      setCustomerDetails(
        readCustomerDraft(window.sessionStorage.getItem(CUSTOMER_DRAFT_KEY), accountProfile),
      );
    } catch {
      setDraftWarning("Customer details could not be restored from this browser session.");
    }
    setCustomerDraftLoaded(true);
  }, [accountProfile]);

  useEffect(() => {
    const refreshTaxSettings = () => {
      const settings = readStaffDemoWorkspace();
      setTaxSettings({
        rateBps: settings.taxRateBps,
        inclusive: settings.taxInclusive,
        category: settings.taxCategory,
        reason: settings.taxReason,
        taxRecordRequired: settings.taxRecordRequired,
      });
    };
    window.addEventListener("ppc-staff-workspace-updated", refreshTaxSettings);
    return () => window.removeEventListener("ppc-staff-workspace-updated", refreshTaxSettings);
  }, []);

  useEffect(() => {
    if (!customerDraftLoaded) return;

    try {
      window.sessionStorage.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify(customerDetails));
    } catch {
      setDraftWarning("Customer details could not be saved for this browser session.");
    }
  }, [customerDetails, customerDraftLoaded]);

  const quotationLines = useMemo(
    () =>
      QUOTATION_PRODUCTS.map((product) => ({
        ...product,
        unitPriceCents: Math.round(
          (cartLines.find((line) => line.id === product.id)?.price ??
            product.unitPriceCents / 100) * 100,
        ),
        qty: qtyOf(product.id),
        lineValueCents:
          qtyOf(product.id) *
          Math.round(
            (cartLines.find((line) => line.id === product.id)?.price ??
              product.unitPriceCents / 100) * 100,
          ),
      })).filter((product) => product.qty > 0),
    [cartLines, qtyOf],
  );
  const appliedTaxRate = taxSettings.category === "Taxable" ? taxSettings.rateBps : 0;
  const totals = calculateQuotationTotals(quotationLines, appliedTaxRate, taxSettings.inclusive);
  const taxRecordStatus = accountProfile?.fields["taxClearanceStatus"]?.toLowerCase() ?? "";
  const hasRequiredTaxRecord = ["compliant", "verified", "valid", "current", "exempt"].includes(
    taxRecordStatus,
  );
  const hasProducts = quotationLines.length > 0;
  const quantitiesAreValid = quotationLines.every(
    (line) => Number.isSafeInteger(line.qty) && line.qty % 40 === 0,
  );
  const minimumBags = method === "collect" ? 40 : 200;
  const methodIsSelected = methodSelected;
  const meetsMinimum = methodIsSelected && bags >= minimumBags;
  const canContinue =
    isCustomerAuthenticated &&
    hasProducts &&
    quantitiesAreValid &&
    methodIsSelected &&
    meetsMinimum &&
    (!taxSettings.taxRecordRequired || hasRequiredTaxRecord) &&
    acknowledged;

  const updateCustomerDetail = (name: keyof CustomerDetails, value: string) => {
    setCustomerDetails((current) => ({ ...current, [name]: value }));
  };

  const handleAcknowledgement = (event: ChangeEvent<HTMLInputElement>) => {
    setAcknowledged(event.currentTarget.checked);
    setContinueMessage("");
  };

  const handleTermsScroll = () => {
    const element = termsScrollerRef.current;
    if (element && element.scrollHeight - element.scrollTop <= element.clientHeight + 2) {
      setTermsReadToEnd(true);
    }
  };

  const handleContinue = () => {
    if (paymentNavigationStarted.current) return false;
    if (taxSettings.taxRecordRequired && !hasRequiredTaxRecord) {
      setContinueMessage(
        "A current customer tax record is required by the active demonstration settings. Update the customer profile before submitting.",
      );
      return false;
    }
    if (!canContinue) {
      setContinueMessage(
        "Review the order requirements and acknowledge the Conditions of Sale before continuing.",
      );
      return false;
    }

    try {
      const submittedQuotation = recordSubmittedDemoQuotation(
        quotationLines.map((line) => ({
          productId: line.id,
          quantity: line.qty,
          unitPriceCents: line.unitPriceCents,
        })),
        method,
        {
          company: customerDetails.companyOrIndividual || "Customer Portal Demo Account",
          accountNumber: customerDetails.accountNumber || "DEMO-CUSTOMER",
          email: customerDetails.emailAddress || accountProfile?.emailAddress || "demo@example.com",
          contact: customerDetails.companyOrIndividual || "Demo customer",
          destination:
            accountProfile?.fields["deliveryAddress"] ||
            accountProfile?.fields["registeredOfficeAddress"] ||
            "Not provided",
        },
        {
          rateBps: appliedTaxRate,
          inclusive: taxSettings.inclusive,
          category: taxSettings.category,
          exemptionReason: taxSettings.reason,
        },
      );
      savePaymentCheckout({
        quotationReference: QUOTATION_NUMBER,
        submissionReference: submittedQuotation.id,
        date: new Date().toISOString().slice(0, 10),
        method: method === "collect" ? "COLLECT" : "DELIVER",
        customer: {
          name: customerDetails.companyOrIndividual || "Customer",
          accountNumber: customerDetails.accountNumber,
          emailAddress: customerDetails.emailAddress || accountProfile?.emailAddress || "",
        },
        lines: quotationLines.map((line) => ({
          productId: line.id,
          quantity: line.qty,
          unitPriceCents: line.unitPriceCents,
        })),
        taxRateBps: appliedTaxRate,
        taxInclusive: taxSettings.inclusive,
      });
      paymentNavigationStarted.current = true;
      return true;
    } catch (error) {
      setContinueMessage(
        `Could not continue to payment: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  };

  if (!isCustomerAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-5 py-16 text-center text-[#17212B]">
        <h1 className="text-3xl font-bold">Development account required</h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-[#40536A]">
          The quotation is available only after linking the development demo account from the Buy
          page. This is a session-only mock, not real authentication.
        </p>
        <Link
          to="/buy"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#E30613] px-5 py-3 text-base font-semibold text-white hover:bg-[#C90016]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Return to Buy
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#17212B]">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .quotation-printable, .quotation-printable * { visibility: visible !important; }
          .quotation-printable {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .quotation-printable input { color: #17212B !important; }
          .no-print { display: none !important; }
          .quotation-table tr { break-inside: avoid; }
          .quotation-summary { break-inside: avoid; }
        }
      `}</style>

      <header className="no-print border-b border-[#E5EAF0] bg-white">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" aria-label="PPC Zimbabwe home" className="flex h-16 w-20 items-center">
            <img
              src={logoImage}
              alt="PPC Strength Guaranteed"
              className="h-full w-full object-contain"
            />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-3 text-base font-semibold sm:gap-7"
          >
            <Link to="/" className="text-[#40536A] hover:text-[#E30613]">
              Home
            </Link>
            <Link to="/buy" className="text-[#40536A] hover:text-[#E30613]">
              Buy Cement
            </Link>
            <Link to="/login" className="text-[#40536A] hover:text-[#E30613]">
              Log in
            </Link>
            <Link to="/new-user" className="text-[#40536A] hover:text-[#E30613]">
              New user
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 py-7 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="no-print mb-5 text-sm text-[#718096]">
          <Link to="/" className="hover:text-[#E30613]">
            Home
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link to="/buy" className="hover:text-[#E30613]">
            Buy
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page" className="font-semibold text-[#17212B]">
            View Order
          </span>
        </nav>

        <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Quotation / Proforma Invoice
            </h1>
            <p className="mt-2 text-base leading-7 text-[#40536A]">
              Review your quotation and confirm that you have read and understood the conditions of
              sale.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#D8DEE6] bg-white px-4 text-base font-semibold text-[#40536A] hover:border-[#E30613] hover:text-[#E30613]"
          >
            <Printer aria-hidden="true" className="size-4" />
            Print Quotation
          </button>
        </div>

        {priceChanges.length > 0 && (
          <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div>
              <p className="font-semibold">Saved draft prices differ from current prices.</p>
              <ul className="mt-1 space-y-1 text-xs">
                {priceChanges.map((change) => (
                  <li key={change.productId}>
                    {
                      QUOTATION_PRODUCTS.find((product) => product.id === change.productId)
                        ?.material
                    }
                    : {formatQuotationUSD(change.savedPriceCents)} saved →{" "}
                    {formatQuotationUSD(change.currentPriceCents)} current per bag.
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Update this draft to the current demonstration prices?")) {
                  refreshPrices();
                }
              }}
              className="rounded-md bg-[#E30613] px-4 py-2 font-semibold text-white hover:bg-[#C90016]"
            >
              Confirm price update
            </button>
          </div>
        )}

        {!hasProducts ? (
          <section className="rounded-lg border border-[#E5EAF0] bg-white p-7 text-center">
            <h2 className="text-xl font-semibold">Your quotation has no products</h2>
            <p className="mt-2 text-base text-[#718096]">
              Add cement products to the cart before viewing a quotation.
            </p>
            <Link
              to="/buy"
              className="mt-5 inline-flex rounded-md bg-[#E30613] px-5 py-3 text-base font-semibold text-white hover:bg-[#C90016]"
            >
              Return to Buy
            </Link>
          </section>
        ) : (
          <>
            <article className="quotation-printable rounded border border-[#D8DEE6] bg-white p-5 shadow-sm sm:p-8">
              <div className="grid gap-5 border-b-2 border-[#E30613] pb-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-center gap-4">
                  <img src={logoImage} alt="PPC Zimbabwe" className="h-16 w-24 object-contain" />
                  <div>
                    <h2 className="text-lg font-bold tracking-wide">PPC ZIMBABWE LIMITED</h2>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#40536A]">
                    QUOTATION / PROFORMA INVOICE
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-wide text-[#E30613]">
                    {QUOTATION_NUMBER}
                  </p>
                  <p className="mt-1 text-sm text-[#40536A]">{date}</p>
                </div>
              </div>

              <section aria-label="Customer and order details" className="mt-5">
                <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
                  <div>
                    <CustomerField
                      label="Company / Individual:"
                      name="companyOrIndividual"
                      value={customerDetails.companyOrIndividual}
                      onChange={updateCustomerDetail}
                    />
                    <CustomerField
                      label="Account Number:"
                      name="accountNumber"
                      value={customerDetails.accountNumber}
                      onChange={updateCustomerDetail}
                    />
                    <CustomerField
                      label="Fax Number:"
                      name="faxNumber"
                      value={customerDetails.faxNumber}
                      onChange={updateCustomerDetail}
                    />
                    <CustomerField
                      label="Email Address:"
                      name="emailAddress"
                      type="email"
                      value={customerDetails.emailAddress}
                      onChange={updateCustomerDetail}
                    />
                    <DetailLine label="Attention:" value="Buyer" />
                    <DetailLine label="From:" value="Diaspora Forex Sales" />
                  </div>
                  <div>
                    <DetailLine label="Reference:" value={QUOTATION_NUMBER} />
                    <DetailLine label="Date:" value={date} />
                    <DetailLine label="Payment Terms:" value="" />
                    <DetailLine
                      label="Shipping Condition:"
                      value={
                        methodSelected
                          ? method === "collect"
                            ? "COLLECT"
                            : "DELIVER"
                          : "Not selected"
                      }
                    />
                    <p className="mt-3 text-xs leading-5 text-[#718096]">
                      Customer fields are editable for this quotation draft and have not been
                      verified by PPC.
                    </p>
                    {draftWarning && (
                      <p role="status" className="mt-2 text-xs leading-5 text-[#8D1020]">
                        {draftWarning}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="conditions-heading"
                className="mt-5 border-y border-[#E5EAF0] py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id="conditions-heading" className="text-sm font-bold text-[#17212B]">
                    Pages — Conditions of Sale
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="no-print text-sm font-semibold text-[#C90016] underline underline-offset-2 hover:text-[#E30613]"
                  >
                    Read Conditions of Sale
                  </button>
                </div>
                <label className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#40536A]">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={handleAcknowledgement}
                    disabled={!termsReadToEnd}
                    className="mt-1 size-4 shrink-0 accent-[#E30613] disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and understood the Conditions of Sale
                    {!termsReadToEnd && (
                      <span className="mt-0.5 block text-xs text-[#718096]">
                        Open the conditions and scroll to the end to enable acknowledgement.
                      </span>
                    )}
                  </span>
                </label>
                <p className="mt-2 text-xs leading-5 text-[#718096]">
                  This is a simple acknowledgement for the demo and is not a legally verified
                  electronic signature.
                </p>
              </section>

              <p className="my-5 text-sm leading-6 text-[#17212B]">
                We thank you for your enquiry and have pleasure in forwarding the following price
              </p>

              <p className="mb-2 text-right text-xs font-semibold text-[#40536A]">
                All prices and values are in USD.
              </p>
              <div className="w-full overflow-x-auto">
                <table className="quotation-table w-full min-w-[600px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#FCF6F7]">
                      <th scope="col" className="border border-[#E5EAF0] px-3 py-2.5 font-bold">
                        Material
                      </th>
                      <th
                        scope="col"
                        className="border border-[#E5EAF0] px-3 py-2.5 text-right font-bold"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="border border-[#E5EAF0] px-3 py-2.5 text-right font-bold"
                      >
                        Unit Price (USD)
                      </th>
                      <th
                        scope="col"
                        className="border border-[#E5EAF0] px-3 py-2.5 text-right font-bold"
                      >
                        Curr USD Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationLines.map((line) => (
                      <tr key={line.id} className="break-inside-avoid">
                        <th scope="row" className="border border-[#E5EAF0] px-3 py-2.5 font-medium">
                          <span className="flex items-center gap-2">
                            <img
                              src={line.image}
                              alt=""
                              className="size-10 shrink-0 object-contain"
                            />
                            <span>{line.material}</span>
                          </span>
                        </th>
                        <td className="border border-[#E5EAF0] px-3 py-2.5 text-right tabular-nums">
                          {line.qty}
                        </td>
                        <td className="border border-[#E5EAF0] px-3 py-2.5 text-right tabular-nums">
                          {formatQuotationUSD(line.unitPriceCents)}
                        </td>
                        <td className="border border-[#E5EAF0] px-3 py-2.5 text-right tabular-nums">
                          {formatQuotationUSD(line.lineValueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section
                aria-label="Quotation financial summary"
                className="quotation-summary ml-auto mt-5 w-full max-w-[360px] text-sm"
              >
                <SummaryLine label="Amount excluding VAT" amount={totals.amountExcludingVatCents} />
                <SummaryLine
                  label={`Output Tax ${taxSettings.inclusive ? "(included) " : ""}${(appliedTaxRate / 100).toFixed(2)}%`}
                  amount={totals.outputTaxCents}
                />
                <SummaryLine label="Total" amount={totals.totalCents} emphasized />
                <SummaryLine
                  label="Grand Total for Quotation"
                  amount={totals.grandTotalCents}
                  emphasized
                  grandTotal
                />
              </section>
            </article>

            <section
              aria-label="Quotation actions"
              className="no-print mt-5 rounded border border-[#E5EAF0] bg-white p-4 sm:p-5"
            >
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/buy"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#D8DEE6] px-4 text-base font-semibold text-[#40536A] hover:border-[#E30613] hover:text-[#E30613]"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back to Edit Cart
                </Link>
                <Link
                  to="/payment"
                  aria-disabled={!canContinue}
                  onClick={(event) => {
                    if (!handleContinue()) event.preventDefault();
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#E30613] px-6 text-base font-semibold text-white hover:bg-[#C90016] aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                >
                  Proceed to Pay
                  <Check aria-hidden="true" className="size-4" />
                </Link>
              </div>
              {(!methodIsSelected || !hasProducts || !quantitiesAreValid || !meetsMinimum) && (
                <p className="mt-3 text-sm leading-6 text-[#8D1020]">
                  {!methodIsSelected
                    ? "Select Collect or Deliver on the Buy page."
                    : !hasProducts
                      ? "Add at least one product to the cart."
                      : !quantitiesAreValid
                        ? "Each product quantity must be a multiple of 40 bags."
                        : `${method === "collect" ? "Collection" : "Delivery"} requires at least ${minimumBags} bags; your cart currently has ${bags}.`}
                </p>
              )}
              {continueMessage && (
                <p role="status" className="mt-3 text-sm leading-6 text-[#40536A]">
                  {continueMessage}
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <Dialog
        open={termsOpen}
        onOpenChange={(open) => {
          setTermsOpen(open);
          if (open) {
            setTermsReadToEnd(false);
            requestAnimationFrame(() => {
              const element = termsScrollerRef.current;
              if (
                element &&
                element.clientHeight > 0 &&
                element.scrollHeight <= element.clientHeight + 2
              ) {
                setTermsReadToEnd(true);
              }
            });
          }
        }}
      >
        <DialogContent className="grid h-[85vh] max-h-[90vh] max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden border-[#E5EAF0] bg-white p-5 text-base sm:p-7">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-lg font-bold text-[#17212B]">
              Conditions of Sale
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#718096]">
              Read the complete supplied conditions. Scroll to the end before acknowledging.
            </DialogDescription>
          </DialogHeader>
          <div
            ref={termsScrollerRef}
            onScroll={handleTermsScroll}
            className="min-h-0 overflow-y-auto border-y border-[#E5EAF0] py-4 pr-2 text-sm leading-6 text-[#40536A]"
          >
            {CONDITIONS_OF_SALE.map((section) => (
              <section key={section.heading} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-base font-bold text-[#17212B]">{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-2 whitespace-pre-line last:mb-0">
                    {paragraph}
                    {paragraph.startsWith("1.3 ") && (
                      <>
                        {" "}
                        <a
                          href={CONDITIONS_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#C90016] underline underline-offset-2"
                        >
                          {CONDITIONS_URL}
                        </a>
                      </>
                    )}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

if (import.meta.vitest) {
  const { afterEach, beforeEach, describe, expect, it } = import.meta.vitest;

  describe("ViewOrderPage", () => {
    let mounted:
      | {
          container: HTMLDivElement;
          root: import("react-dom/client").Root;
        }
      | undefined;

    beforeEach(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    afterEach(async () => {
      if (mounted) {
        const { act: reactAct } = await import("react");
        await reactAct(async () => mounted?.root.unmount());
        mounted.container.remove();
        mounted = undefined;
      }
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    async function mountPage(isAuthenticated: boolean) {
      const [{ act: reactAct }, { createRoot }, { CartProvider }, { DemoAccountContext }] =
        await Promise.all([
          import("react"),
          import("react-dom/client"),
          import("@/features/store/cart"),
          import("@/features/account/demo-account"),
        ]);
      window.localStorage.setItem(
        "ppc-zw-cart-v1",
        JSON.stringify({
          items: {
            "surecem-32-5n": 40,
            "surecast-42-5r": 40,
            "surebuild-42-5n": 40,
          },
          method: "collect",
          methodSelected: true,
        }),
      );
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      mounted = { container, root };
      await reactAct(async () => {
        root.render(
          <DemoAccountContext.Provider
            value={{
              isLoading: false,
              isAuthenticated,
              role: isAuthenticated ? "customer" : null,
              isCustomerAuthenticated: isAuthenticated,
              isStaffAuthenticated: false,
              accountProfile: isAuthenticated
                ? {
                    companyOrIndividual: "Vespers Makado",
                    accountNumber: "1230004560098",
                    faxNumber: "",
                    emailAddress: "vespers.makado@gmail.com",
                    phoneNumber: "",
                    accountType: "individual",
                    fields: {},
                  }
                : null,
              authenticate: async () => "authenticated",
              updateProfile: () => {},
              signOut: async () => {},
            }}
          >
            <CartProvider>
              <ViewOrderPage />
            </CartProvider>
          </DemoAccountContext.Provider>,
        );
      });
      return { container, act: reactAct };
    }

    it("requires the demo account session for direct access", async () => {
      const { container } = await mountPage(false);

      expect(container.textContent).toContain("Development account required");
      expect(container.textContent).not.toContain("Grand Total for Quotation");
    });

    it("shows cart-matched products and dynamic quotation totals", async () => {
      const { container } = await mountPage(true);

      expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
      expect(container.textContent).toContain("SURECEM 32,5N");
      expect(container.textContent).toContain("SURECAST 42,5R");
      expect(container.textContent).toContain("SureBuild 42,5N");
      expect(container.textContent).toContain("COLLECT");
      expect(container.textContent).toContain("$1,560.00");
      expect(container.textContent).toContain("$241.80");
      expect(container.textContent).toContain("$1,801.80");
      expect(
        container.querySelector<HTMLInputElement>('input[aria-label="Company / Individual"]'),
      ).toHaveValue("Vespers Makado");
      expect(
        container.querySelector<HTMLInputElement>('input[aria-label="Account Number"]'),
      ).toHaveValue("1230004560098");
      expect(
        container.querySelector<HTMLInputElement>('input[aria-label="Fax Number"]'),
      ).toHaveValue("");
      expect(
        container.querySelector<HTMLInputElement>('input[aria-label="Email Address"]'),
      ).toHaveValue("vespers.makado@gmail.com");
      const continueButton = container.querySelector<HTMLAnchorElement>('a[href="/payment"]');
      expect(continueButton).toHaveAttribute("aria-disabled", "true");
    });

    it("requires opening and scrolling through the conditions before continuing", async () => {
      const { container, act: reactAct } = await mountPage(true);
      const readButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Read Conditions of Sale"),
      );
      if (!readButton) throw new Error("Conditions reader button was not rendered");

      await reactAct(async () => readButton.click());
      const dialog = document.body.querySelector('[role="dialog"]');
      if (!dialog) throw new Error("Conditions reader did not open");
      expect(dialog.textContent).toContain("STANBIC");
      expect(dialog.textContent).toContain("MANAGER SALES & MARKETING");

      const scroller = dialog.querySelector<HTMLElement>(".overflow-y-auto");
      if (!scroller) throw new Error("Conditions reader did not render its scroll area");
      await reactAct(async () => {
        scroller.scrollTop = scroller.scrollHeight;
        scroller.dispatchEvent(new Event("scroll"));
      });
      const closeButton = dialog.querySelector<HTMLButtonElement>("button");
      if (!closeButton) throw new Error("Conditions reader close button was not rendered");
      await reactAct(async () => closeButton.click());

      const acknowledgement = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (!acknowledgement) throw new Error("Acknowledgement checkbox was not rendered");
      expect(acknowledgement).toBeEnabled();
      expect(acknowledgement).not.toBeChecked();
      await reactAct(async () => acknowledgement.click());

      const continueButton = container.querySelector<HTMLAnchorElement>('a[href="/payment"]');
      if (!continueButton) throw new Error("Order submission button was not rendered");
      expect(continueButton).toHaveAttribute("aria-disabled", "false");
      continueButton.addEventListener("click", (event) => event.preventDefault(), { once: true });
      await reactAct(async () => continueButton.click());
      const { readSubmittedDemoQuotations } =
        await import("@/features/account/demo-portal-quotations");
      expect(readSubmittedDemoQuotations()).toHaveLength(1);
      expect(readSubmittedDemoQuotations()[0]?.lines).toEqual([
        { productId: "surecem-32-5n", quantity: 40, unitPriceCents: 1200 },
        { productId: "surecast-42-5r", quantity: 40, unitPriceCents: 1300 },
        { productId: "surebuild-42-5n", quantity: 40, unitPriceCents: 1400 },
      ]);
      const { readPaymentCheckout } = await import("@/features/store/payment-checkout");
      expect(readPaymentCheckout()).toMatchObject({
        quotationReference: "500550005",
        method: "COLLECT",
        customer: {
          name: "Vespers Makado",
          accountNumber: "1230004560098",
          emailAddress: "vespers.makado@gmail.com",
        },
        taxRateBps: 1550,
      });
    });
  });
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(115px,0.8fr)_minmax(0,1.2fr)] gap-2 border-b border-[#E5EAF0] py-2 text-sm leading-5">
      <span className="font-semibold text-[#40536A]">{label}</span>
      <span className="min-h-5 break-words text-[#17212B]">{value}</span>
    </div>
  );
}

function SummaryLine({
  label,
  amount,
  emphasized = false,
  grandTotal = false,
}: {
  label: string;
  amount: number;
  emphasized?: boolean;
  grandTotal?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-[#E5EAF0] py-2.5 ${
        emphasized ? "font-semibold text-[#17212B]" : "text-[#40536A]"
      } ${grandTotal ? "border-t-2 border-t-[#E30613] text-base font-bold text-[#C90016]" : ""}`}
    >
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{formatQuotationUSD(amount)}</span>
    </div>
  );
}
