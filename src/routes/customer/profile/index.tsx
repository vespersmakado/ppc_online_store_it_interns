import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/profile/")({
  head: () => ({ meta: [{ title: "My Profile | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="profile" />,
});
