import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/zimra/settings")({
  head: () => ({ meta: [{ title: "Tax Settings | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="tax-settings" />,
});
