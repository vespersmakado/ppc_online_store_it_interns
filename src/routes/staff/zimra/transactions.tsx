import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/zimra/transactions")({
  head: () => ({ meta: [{ title: "Tax Transactions | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="tax-transactions" />,
});
