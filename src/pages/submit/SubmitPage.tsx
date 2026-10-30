import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Download,
  FileText,
  LoaderCircle,
} from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import { useDemoAccount } from "@/features/account/demo-account";
import { readPaymentCheckout, type PaymentCheckout } from "@/features/store/payment-checkout";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateQuotationTotals,
  formatQuotationUSD,
  QUOTATION_PRODUCTS,
} from "@/pages/view-order/quotation-data";

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

function pdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function downloadPaymentSummary(checkout: PaymentCheckout, totalCents: number) {
  const paymentReference = `UNVERIFIED-${checkout.submissionReference}`;
  const lines = [
    "PPC ZIMBABWE ONLINE STORE",
    "PAYMENT SUMMARY",
    "Payment status: UNVERIFIED",
    `Customer: ${checkout.customer.name}`,
    `Account: ${checkout.customer.accountNumber || "Not provided"}`,
    `Quotation reference: ${checkout.quotationReference}`,
    `Order reference: ${checkout.submissionReference}`,
    `Payment reference: ${paymentReference}`,
    "Payment method: Not recorded",
    `Date generated: ${new Date().toLocaleString("en-GB")}`,
    `Order total: ${formatQuotationUSD(totalCents)}`,
    "Amount received: USD 0.00",
  ];
  const content = lines
    .map(
      (line, index) =>
        `BT /F1 ${index === 0 ? 16 : index === 1 ? 12 : 10} Tf 48 ${790 - index * 48} Td (${pdfText(line)}) Tj ET`,
    )
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const url = URL.createObjectURL(new Blob([document], { type: "application/pdf" }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `PPC_PAYMENT_SUMMARY_${checkout.submissionReference}.pdf`;
  window.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SubmitPage() {
  const { isCustomerAuthenticated } = useDemoAccount();
  const [checkout, setCheckout] = useState<PaymentCheckout | null>(null);
  const [loadError, setLoadError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const submitQuotation = () => {
    if (!checkout || submitting || submitted) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const storageKey = "ppc-quotation-submission-records-v1";
      const raw = window.localStorage.getItem(storageKey);
      const existing: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) {
        throw new Error("Saved submission records have an invalid format.");
      }
      const alreadyRecorded = existing.some(
        (record) =>
          record &&
          typeof record === "object" &&
          "submissionReference" in record &&
          record.submissionReference === checkout.submissionReference,
      );
      if (!alreadyRecorded) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify([
            {
              quotationReference: checkout.quotationReference,
              submissionReference: checkout.submissionReference,
              customer: checkout.customer.name,
              recordedAt: new Date().toISOString(),
              status: "Recorded locally - awaiting PPC review",
              paymentStatus: "Unverified",
            },
            ...existing,
          ]),
        );
      }
      setSubmitted(true);
      setConfirmationOpen(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "The quotation could not be recorded.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    try {
      setCheckout(readPaymentCheckout());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Quotation details could not be loaded.",
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

  if (!isCustomerAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F7FA] p-5 text-[#17212B]">
        <section className="max-w-xl rounded-xl border border-[#E5EAF0] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Customer account required</h1>
          <p className="mt-3 text-base leading-7 text-[#40536A]">
            Sign in with the customer account used to review this quotation.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex min-h-12 items-center rounded-md bg-[#E30613] px-5 text-lg font-semibold text-white hover:bg-[#C90016]"
          >
            Log In
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="submit-page min-h-screen bg-[#F5F7FA] text-[#17212B]">
      <style>{`
        .submit-page { font-size: 1.125rem; }
        .submit-page .text-xs { font-size: 1rem; line-height: 1.5rem; }
        .submit-page .text-sm { font-size: 1.125rem; line-height: 1.75rem; }
        .submit-page .text-base { font-size: 1.25rem; line-height: 1.875rem; }
        .submit-page .text-lg { font-size: 1.375rem; line-height: 2rem; }
        .submit-page .text-xl { font-size: 1.625rem; line-height: 2.125rem; }
        .submit-page .text-2xl { font-size: 1.875rem; line-height: 2.25rem; }
        .submit-page .text-4xl { font-size: 2.75rem; line-height: 1.1; }
        .submit-page .text-5xl { font-size: 3.25rem; line-height: 1.1; }
        @media print {
          body * { visibility: hidden !important; }
          .quotation-document, .quotation-document * { visibility: visible !important; }
          .quotation-document {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      <header className="no-print border-b border-[#E5EAF0] bg-white">
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

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Breadcrumb" className="no-print mb-6 text-base text-[#718096]">
          <Link to="/" className="hover:text-[#E30613]">
            Home
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link to="/payment" className="hover:text-[#E30613]">
            Payment
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page" className="font-semibold text-[#17212B]">
            Final Review
          </span>
        </nav>

        <div className="no-print mb-7">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Review Your Quotation</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[#40536A]">
            Review the quotation details and payment status before submission.
          </p>
        </div>

        {loadError ? (
          <section role="alert" className="rounded-xl border border-rose-200 bg-white p-7">
            <h2 className="text-xl font-bold">Quotation details could not be loaded</h2>
            <p className="mt-2 text-base leading-7 text-[#40536A]">{loadError}</p>
            <Link
              to="/view-order"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-[#C90016]"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Return to Order Review
            </Link>
          </section>
        ) : !checkout || !totals ? (
          <section className="rounded-xl border border-[#E5EAF0] bg-white p-7">
            <h2 className="text-2xl font-bold">No quotation is ready for review</h2>
            <p className="mt-2 text-base leading-7 text-[#40536A]">
              Return to Order Review and continue with a quotation first.
            </p>
            <Link
              to="/view-order"
              className="mt-5 inline-flex min-h-12 items-center rounded-md bg-[#E30613] px-5 text-lg font-semibold text-white hover:bg-[#C90016]"
            >
              Review Order
            </Link>
          </section>
        ) : (
          <>
            <section
              role="status"
              className="no-print mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base leading-7 text-amber-950"
            >
              <CircleAlert aria-hidden="true" className="mt-1 size-5 shrink-0" />
              <div>
                <h2 className="font-bold">
                  {submitted ? "Submission recorded" : "Payment awaiting verification"}
                </h2>
                <p>
                  {submitted
                    ? "This quotation submission has been saved in this browser. It has not been transmitted to PPC, and payment remains unverified."
                    : "A payment has not been confirmed by a payment provider. The payment record below is unverified."}
                </p>
              </div>
            </section>

            <article className="quotation-document rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-5 border-b-2 border-[#E30613] pb-5">
                <div className="flex items-center gap-4">
                  <img src={logoImage} alt="PPC Zimbabwe" className="h-16 w-28 object-contain" />
                  <div>
                    <p className="text-lg font-bold">PPC ZIMBABWE</p>
                    <p className="text-base text-[#718096]">Online Store</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#40536A]">
                    Quotation / Proforma Invoice
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#C90016]">
                    {checkout.quotationReference}
                  </p>
                  <p className="mt-1 text-base text-[#40536A]">{formatDate(checkout.date)}</p>
                </div>
              </div>

              <dl className="my-6 grid gap-x-8 gap-y-3 text-base sm:grid-cols-2">
                <div>
                  <dt className="text-[#718096]">Customer</dt>
                  <dd className="font-semibold">{checkout.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-[#718096]">Account number</dt>
                  <dd className="font-semibold">
                    {checkout.customer.accountNumber || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#718096]">Email address</dt>
                  <dd className="break-all font-semibold">
                    {checkout.customer.emailAddress || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#718096]">Shipping condition</dt>
                  <dd className="font-semibold">
                    {checkout.method === "COLLECT" ? "Collect" : "Deliver"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#718096]">Submission reference</dt>
                  <dd className="font-semibold">{checkout.submissionReference}</dd>
                </div>
                <div>
                  <dt className="text-[#718096]">Payment status</dt>
                  <dd className="font-semibold text-amber-800">
                    {submitted ? "Unverified" : "Awaiting verification"}
                  </dd>
                </div>
              </dl>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-base">
                  <thead>
                    <tr className="bg-[#FCF6F7]">
                      <th className="border border-[#E5EAF0] px-3 py-3">Product</th>
                      <th className="border border-[#E5EAF0] px-3 py-3 text-right">Quantity</th>
                      <th className="border border-[#E5EAF0] px-3 py-3 text-right">Unit price</th>
                      <th className="border border-[#E5EAF0] px-3 py-3 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkout.lines.map((line) => {
                      const product = QUOTATION_PRODUCTS.find((item) => item.id === line.productId);
                      return (
                        <tr key={line.productId}>
                          <th scope="row" className="border border-[#E5EAF0] px-3 py-3 font-medium">
                            {product?.material ?? line.productId}
                          </th>
                          <td className="border border-[#E5EAF0] px-3 py-3 text-right">
                            {line.quantity} bags
                          </td>
                          <td className="border border-[#E5EAF0] px-3 py-3 text-right">
                            {formatQuotationUSD(line.unitPriceCents)}
                          </td>
                          <td className="border border-[#E5EAF0] px-3 py-3 text-right">
                            {formatQuotationUSD(line.quantity * line.unitPriceCents)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-6 max-w-sm space-y-3 text-base">
                <div className="flex justify-between gap-4">
                  <span>Amount excluding VAT</span>
                  <span>{formatQuotationUSD(totals.amountExcludingVatCents)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>VAT ({(checkout.taxRateBps / 100).toFixed(2)}%)</span>
                  <span>{formatQuotationUSD(totals.outputTaxCents)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t-2 border-[#E30613] pt-3 text-lg font-bold">
                  <span>Total payable</span>
                  <span>{formatQuotationUSD(totals.grandTotalCents)}</span>
                </div>
              </div>
            </article>

            <section className="no-print mt-6 rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText aria-hidden="true" className="mt-1 size-6 shrink-0 text-[#C90016]" />
                  <div>
                    <h2 className="text-xl font-bold">Payment Summary</h2>
                    <p className="mt-1 text-base leading-7 text-[#40536A]">
                      Payment has not been confirmed by a payment provider. Amount received is USD
                      0.00.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!checkout || !totals) return;
                    try {
                      setReceiptError("");
                      downloadPaymentSummary(checkout, totals.grandTotalCents);
                    } catch (error) {
                      setReceiptError(
                        error instanceof Error
                          ? error.message
                          : "The payment summary PDF could not be downloaded.",
                      );
                    }
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#D9E1E8] px-5 text-base font-semibold text-[#40536A] hover:border-[#E30613] hover:text-[#C90016]"
                >
                  <Download aria-hidden="true" className="size-5" />
                  Download Payment Summary (PDF)
                </button>
              </div>
              <div className="mt-5 rounded-lg border-2 border-dashed border-[#C90016] bg-[#FCF6F7] p-5 text-base leading-7 text-[#8D1020]">
                <p className="text-lg font-extrabold tracking-wide">
                  PAYMENT STATUS: UNVERIFIED
                </p>
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Customer</dt>
                    <dd>{checkout.customer.name}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Account</dt>
                    <dd>{checkout.customer.accountNumber || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Quotation</dt>
                    <dd>{checkout.quotationReference}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Payment reference</dt>
                    <dd>UNVERIFIED-{checkout.submissionReference}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Status</dt>
                    <dd>Unverified - USD 0.00 received</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Order total</dt>
                    <dd>{formatQuotationUSD(totals.grandTotalCents)}</dd>
                  </div>
                </dl>
                {receiptError && (
                  <p role="alert" className="mt-3 font-semibold">
                    {receiptError}
                  </p>
                )}
              </div>
            </section>

            <section className="no-print mt-6 rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-2xl font-bold">Ready to Submit Your Quotation?</h2>
              <p className="mt-2 text-base leading-7 text-[#40536A]">
                Record this quotation for the next processing step. No payment is represented as
                received by this action.
              </p>
              {submitError && (
                <p role="alert" className="mt-3 text-base font-semibold text-[#C90016]">
                  {submitError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting || submitted}
                  onClick={submitQuotation}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#E30613] px-5 text-lg font-bold text-white hover:bg-[#C90016] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  )}
                  {submitted ? "Submission recorded" : "Submit to PPC Zimbabwe Team"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#D9E1E8] bg-white px-5 text-base font-semibold text-[#40536A] hover:border-[#E30613] hover:text-[#C90016]"
                >
                  <Download aria-hidden="true" className="size-5" />
                  Print / Save Quotation PDF
                </button>
                <Link
                  to="/payment"
                  className="inline-flex min-h-12 items-center gap-2 rounded-md px-4 text-base font-semibold text-[#40536A] hover:text-[#C90016]"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Return to Payment
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="no-print mt-10 border-t border-[#E5EAF0] bg-white py-6 text-center text-sm text-[#718096]">
        PPC Zimbabwe Online Store
      </footer>
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="max-w-xl border-[#E5EAF0] bg-white p-7 sm:p-9">
          <DialogHeader className="text-left">
            <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#17212B]">
              Quotation submission recorded
            </DialogTitle>
            <DialogDescription className="text-base leading-7 text-[#40536A]">
              The submission has been saved in this browser. It has not been sent to PPC, and the
              payment is still unverified.
            </DialogDescription>
          </DialogHeader>
          {checkout && (
            <dl className="grid gap-3 rounded-lg bg-[#F5F7FA] p-4 text-base sm:grid-cols-2">
              <div>
                <dt className="text-[#718096]">Quotation</dt>
                <dd className="font-semibold">{checkout.quotationReference}</dd>
              </div>
              <div>
                <dt className="text-[#718096]">Reference</dt>
                <dd className="break-all font-semibold">{checkout.submissionReference}</dd>
              </div>
              <div>
                <dt className="text-[#718096]">Status</dt>
                <dd className="font-semibold">Awaiting PPC review</dd>
              </div>
              <div>
                <dt className="text-[#718096]">Payment</dt>
                <dd className="font-semibold text-amber-800">Unverified</dd>
              </div>
            </dl>
          )}
          <DialogFooter className="gap-2 sm:flex-wrap">
            <Link
              to="/customer/quotations/new"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#E30613] px-4 text-base font-semibold text-white hover:bg-[#C90016]"
            >
              Make New Quotation
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#D9E1E8] px-4 text-base font-semibold text-[#40536A] hover:border-[#E30613]"
            >
              Log In
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#D9E1E8] px-4 text-base font-semibold text-[#40536A] hover:border-[#E30613]"
            >
              Home
            </Link>
            <DialogClose className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#D9E1E8] px-4 text-base font-semibold text-[#40536A] hover:border-[#E30613]">
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
