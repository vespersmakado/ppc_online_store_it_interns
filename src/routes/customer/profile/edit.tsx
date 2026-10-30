import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortalPage } from "@/pages/customer/CustomerPortalPage";

export const Route = createFileRoute("/customer/profile/edit")({
  head: () => ({ meta: [{ title: "Edit Profile | PPC Zimbabwe" }] }),
  component: () => <CustomerPortalPage view="profile-edit" />,
});
