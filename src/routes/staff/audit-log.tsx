import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="audit-log" />,
});
