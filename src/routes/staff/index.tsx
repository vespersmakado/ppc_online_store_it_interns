import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Sales Department | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="overview" />,
});
