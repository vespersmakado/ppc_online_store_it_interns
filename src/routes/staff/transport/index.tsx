import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/transport/")({
  head: () => ({ meta: [{ title: "Transport & Logistics | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="transport" />,
});
