import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Details | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="order-detail" />,
});
