import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/quotations/$quotationId")({
  head: () => ({ meta: [{ title: "Quotation Details | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="quotation-detail" />,
});
