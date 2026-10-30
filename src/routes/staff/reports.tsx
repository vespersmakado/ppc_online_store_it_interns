import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/reports")({
  head: () => ({ meta: [{ title: "Sales Reports | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="reports" />,
});
