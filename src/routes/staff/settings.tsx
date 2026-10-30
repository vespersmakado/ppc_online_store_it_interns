import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/settings")({
  head: () => ({ meta: [{ title: "Staff Settings | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="settings" />,
});
