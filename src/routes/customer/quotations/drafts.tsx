import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/quotations/drafts")({
  head: () => ({ meta: [{ title: "Pending Quotations | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="drafts" />,
});
