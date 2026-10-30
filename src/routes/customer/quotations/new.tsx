import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/quotations/new")({
  head: () => ({ meta: [{ title: "New Quotation | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="quotation-new" />,
});
