import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/prices/")({
  head: () => ({ meta: [{ title: "Manage Prices | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="prices" />,
});
