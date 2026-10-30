import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/notifications/")({
  head: () => ({ meta: [{ title: "Notifications | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="notifications" />,
});
