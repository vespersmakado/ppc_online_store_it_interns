import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/payments/")({
  head: () => ({ meta: [{ title: "Payments & Reconciliation | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="payments" />,
});
