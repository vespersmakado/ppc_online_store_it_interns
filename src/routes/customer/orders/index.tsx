import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/orders/")({
  head: () => ({ meta: [{ title: "Orders | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="orders" />,
});
