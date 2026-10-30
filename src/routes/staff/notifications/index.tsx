import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/notifications/")({
  head: () => ({ meta: [{ title: "Staff Notifications | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="notifications" />,
});
