import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/zimra/accounts")({
  head: () => ({ meta: [{ title: "Tax Accounts | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="tax-accounts" />,
});
