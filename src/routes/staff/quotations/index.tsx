import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/quotations/")({
  head: () => ({ meta: [{ title: "Submitted Quotations | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="quotations" />,
});
