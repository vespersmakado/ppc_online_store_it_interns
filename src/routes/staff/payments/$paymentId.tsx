import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

function StaffPaymentDetailRoute() {
  const { paymentId } = Route.useParams();
  return <StaffPortalPage view="payment-detail" recordId={paymentId} />;
}

export const Route = createFileRoute("/staff/payments/$paymentId")({
  head: () => ({ meta: [{ title: "Payment Details | PPC Zimbabwe" }] }),
  component: StaffPaymentDetailRoute,
});
