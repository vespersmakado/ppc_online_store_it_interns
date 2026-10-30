import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/zimra/")({
  head: () => ({ meta: [{ title: "ZIMRA Tax & Compliance | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="zimra" />,
});
