import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/transport/calculator")({
  head: () => ({ meta: [{ title: "Transport Calculator | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="transport-calculator" />,
});
