import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/quotations/finished")({
  head: () => ({ meta: [{ title: "Finished Quotations | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="finished" />,
});
