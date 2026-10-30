import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/transport/")({
  head: () => ({ meta: [{ title: "Transport & Logistics | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="transport" />,
});
