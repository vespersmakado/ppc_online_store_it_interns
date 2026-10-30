import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

function StaffOrderDetailRoute() {
  const { orderId } = Route.useParams();
  return <StaffPortalPage view="order-detail" recordId={orderId} />;
}

export const Route = createFileRoute("/staff/orders/$orderId")({
  head: () => ({ meta: [{ title: "Sales Order | PPC Zimbabwe" }] }),
  component: StaffOrderDetailRoute,
});
