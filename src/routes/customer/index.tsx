import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/")({
  head: () => ({ meta: [{ title: "Customer Portal | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="dashboard" />,
});
