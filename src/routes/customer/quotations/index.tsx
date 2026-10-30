import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/quotations/")({
  head: () => ({ meta: [{ title: "Quotations | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="quotations" />,
});
