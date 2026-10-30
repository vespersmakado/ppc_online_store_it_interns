import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/transport/tracking/")({
  head: () => ({ meta: [{ title: "Delivery Tracking | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="transport-tracking" />,
});
