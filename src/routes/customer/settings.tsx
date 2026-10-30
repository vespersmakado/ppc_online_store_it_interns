import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/settings")({
  head: () => ({ meta: [{ title: "Settings | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="settings" />,
});
