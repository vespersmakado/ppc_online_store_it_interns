import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/notifications/$notificationId")({
  head: () => ({ meta: [{ title: "Notification | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="notification-detail" />,
});
