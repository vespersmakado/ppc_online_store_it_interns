import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/sap/records")({
  head: () => ({ meta: [{ title: "SAP Records | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="sap-records" />,
});
