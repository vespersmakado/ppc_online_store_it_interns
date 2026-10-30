import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/sap/reconciliation")({
  head: () => ({ meta: [{ title: "SAP Reconciliation | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="sap-reconciliation" />,
});
