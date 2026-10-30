import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import { useDemoAccount } from "@/features/account/demo-account";
import { readPaymentCheckout, type PaymentCheckout } from "@/features/store/payment-checkout";
import {
  calculateQuotationTotals,
  formatQuotationUSD,
  QUOTATION_PRODUCTS,
} from "@/pages/view-order/quotation-data";

const STEPS = ["Order Details", "Review Order", "Payment", "Confirmation"];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
}

export function PaymentPage() {
  const { isCustomerAuthenticated } = useDemoAccount();
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    try {
      setCheckout(readPaymentCheckout());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Saved quotation details could not be loaded.",
      );
    }
  }, []);

  const totals = useMemo(() => {
    if (!checkout) return null;
    return calculateQuotationTotals(
      checkout.lines.map((line) => ({
        id: line.productId,
        qty: line.quantity,
        unitPriceCents: line.unitPriceCents,
      })),
      checkout.taxRateBps,
      checkout.taxInclusive,
    );
  }, [checkout]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17212B]">
      <header className="border-b border-[#E5EAF0] bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
          <Link to="/" aria-label="PPC Zimbabwe home" className="flex h-16 w-28 items-center">
            <img src={logoImage} alt="PPC Zimbabwe" className="h-full w-full object-contain" />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5 text-lg font-semibold"
          >
            <Link to="/" className="text-[#40536A] hover:text-[#E30613]">
              Home
            </Link>
            <Link to="/buy" className="text-[#40536A] hover:text-[#E30613]">
              Buy Cement
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-base text-[#718096]">
          <Link to="/" className="hover:text-[#E30613]">
            Home
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link to="/buy" className="hover:text-[#E30613]">
            Checkout
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page" className="font-semibold text-[#17212B]">
            Payment
          </span>
        </nav>

        <div className="mb-7">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Complete Your Payment</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[#40536A] sm:text-lg">
            Review your quotation and continue securely through PayNow when payment services are
            available.
          </p>
        </div>

        <ol
          aria-label="Checkout progress"
          className="mb-8 grid grid-cols-4 overflow-hidden rounded-xl border border-[#E5EAF0] bg-white"
        >
          {STEPS.map((step, index) => {
            const active = step === "Payment";
            const complete = index < 2;
            return (
              <li
                key={step}
                aria-current={active ? "step" : undefined}
                className={`flex min-h-[68px] items-center justify-center gap-2 border-r border-[#E5EAF0] px-2 text-center last:border-r-0 sm:justify-start sm:px-5 ${
                  active ? "bg-[#FCF6F7] text-[#C90016]" : "text-[#718096]"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-[#E30613] text-white"
                      : complete
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#EEF1F4] text-[#718096]"
                  }`}
                >
                  {complete ? <Check aria-hidden="true" className="size-4" /> : index + 1}
                </span>
                <span className="text-sm font-semibold sm:text-base">{step}</span>
              </li>
            );
          })}
        </ol>

        {!isCustomerAuthenticated ? (
          <section className="rounded-xl border border-[#E5EAF0] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">Customer account required</h2>
            <p className="mt-2 text-base leading-7 text-[#40536A]">
              Sign in with the customer account used to review this quotation to continue.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#E30613] px-5 text-lg font-semibold text-white hover:bg-[#C90016]"
            >
              Sign in <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        ) : loadError ? (
          <section
            role="alert"
            className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-3">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#C90016]" />
              <div>
                <h2 className="text-lg font-bold">Quotation details could not be loaded</h2>
                <p className="mt-2 text-base leading-7 text-[#40536A]">{loadError}</p>
                <Link
                  to="/view-order"
                  className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#C90016]"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Return to Order Review
                </Link>
              </div>
            </div>
          </section>
        ) : !checkout || !totals ? (
          <section className="rounded-xl border border-[#E5EAF0] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">No quotation is ready for payment</h2>
            <p className="mt-2 text-base leading-7 text-[#40536A]">
              Review your cart and quotation first. Payment details will be available here after you
              continue from Order Review.
            </p>
            <Link
              to="/view-order"
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#E30613] px-5 text-lg font-semibold text-white hover:bg-[#C90016]"
            >
              Review Order <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="space-y-6">
              <section className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold">Choose Your Payment Method</h2>
                  <p className="mt-1 text-base leading-7 text-[#718096]">
                    Choose an available payment option to continue securely through PayNow.
                  </p>
                </div>

                <div
                  aria-disabled="true"
                  className="flex items-start gap-4 rounded-lg border border-[#E5EAF0] bg-[#F9FAFB] p-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#718096] ring-1 ring-[#E5EAF0]">
                    <CreditCard aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">PayNow hosted checkout</h3>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                        Unavailable
                      </span>
                    </div>
                    <p className="mt-1 text-base leading-7 text-[#718096]">
                      Mobile money and card options will be shown here when the merchant PayNow
                      account and server integration are configured.
                    </p>
                  </div>
                </div>

                <div
                  role="status"
                  className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-base leading-7 text-amber-950"
                >
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <p>
                    PayNow is not configured for this store yet. No payment can be initiated or
                    verified from this page, and your quotation has not been marked as paid.
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold">Payment security</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <LockKeyhole
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-[#40536A]"
                    />
                    <p className="text-base leading-7 text-[#40536A]">
                      Payment authentication should take place only on the provider’s secure
                      checkout.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-[#40536A]"
                    />
                    <p className="text-base leading-7 text-[#40536A]">
                      Never enter a bank password, card PIN, or one-time password on this store
                      page.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-6">
              <section className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white shadow-sm">
                <div className="border-b border-[#E5EAF0] px-5 py-4 sm:px-6">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <p className="mt-1 text-base text-[#718096]">
                    Quotation {checkout.quotationReference}
                  </p>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-base">
                    <dt className="text-[#718096]">Customer</dt>
                    <dd className="break-words text-right font-medium">{checkout.customer.name}</dd>
                    <dt className="text-[#718096]">Account number</dt>
                    <dd className="break-words text-right font-medium">
                      {checkout.customer.accountNumber || "Not provided"}
                    </dd>
                    <dt className="text-[#718096]">Order date</dt>
                    <dd className="text-right font-medium">{formatDate(checkout.date)}</dd>
                    <dt className="text-[#718096]">Shipping condition</dt>
                    <dd className="text-right font-medium">
                      {checkout.method === "COLLECT" ? "Collect" : "Deliver"}
                    </dd>
                    <dt className="text-[#718096]">Sales order number</dt>
                    <dd className="text-right font-medium">Not assigned</dd>
                  </dl>

                  <div className="border-t border-[#E5EAF0] pt-4">
                    <h3 className="mb-3 text-base font-semibold">Products</h3>
                    <ul className="space-y-4">
                      {checkout.lines.map((line) => {
                        const product = QUOTATION_PRODUCTS.find(
                          (item) => item.id === line.productId,
                        );
                        const name = product?.material ?? line.productId;
                        const lineTotal = line.quantity * line.unitPriceCents;
                        return (
                          <li
                            key={line.productId}
                            className="flex items-start justify-between gap-3 text-base"
                          >
                            <span className="min-w-0">
                              <span className="block font-medium">{name}</span>
                              <span className="mt-1 block text-sm text-[#718096]">
                                {line.quantity} bags × {formatQuotationUSD(line.unitPriceCents)}
                              </span>
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums">
                              {formatQuotationUSD(lineTotal)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="space-y-2 border-t border-[#E5EAF0] pt-4 text-base">
                    <div className="flex justify-between gap-4 text-[#40536A]">
                      <span>Amount excluding VAT</span>
                      <span className="shrink-0 tabular-nums">
                        {formatQuotationUSD(totals.amountExcludingVatCents)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-[#40536A]">
                      <span>VAT ({(checkout.taxRateBps / 100).toFixed(2)}%)</span>
                      <span className="shrink-0 tabular-nums">
                        {formatQuotationUSD(totals.outputTaxCents)}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-4 border-t-2 border-[#E30613] pt-4">
                      <span className="text-sm font-bold tracking-wide text-[#17212B]">
                        TOTAL AMOUNT PAYABLE
                        <span className="mt-1 block font-normal text-[#718096]">USD</span>
                      </span>
                      <span className="shrink-0 text-3xl font-bold tabular-nums text-[#C90016]">
                        {formatQuotationUSD(totals.grandTotalCents)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    title="PayNow server integration is not configured"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-[#E30613] px-5 text-lg font-bold text-white opacity-50"
                  >
                    Proceed to PayNow
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                  <p className="text-center text-sm leading-6 text-[#718096]">
                    A verified payment receipt will be available only after the provider confirms
                    payment.
                  </p>
                  <Link
                    to="/submit"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[#E30613] bg-white px-5 text-lg font-bold text-[#C90016] hover:bg-[#FCF6F7]"
                  >
                    Proceed to submit
                    <ArrowRight aria-hidden="true" className="size-5" />
                  </Link>
                </div>
              </section>

              <Link
                to="/view-order"
                className="inline-flex min-h-12 items-center gap-2 px-1 text-base font-semibold text-[#40536A] hover:text-[#C90016]"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Return to Order Review
              </Link>
            </aside>
          </div>
        )}
      </main>
      <footer className="mt-10 border-t border-[#E5EAF0] bg-white py-6 text-center text-sm text-[#718096]">
        PPC Zimbabwe Online Store
      </footer>
    </div>
  );
}
