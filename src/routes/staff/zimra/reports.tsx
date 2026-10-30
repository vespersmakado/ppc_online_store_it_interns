import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/zimra/reports")({
  head: () => ({ meta: [{ title: "Tax Reports | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="tax-reports" />,
});
