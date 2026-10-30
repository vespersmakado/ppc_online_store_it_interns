import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/communications/")({
  head: () => ({ meta: [{ title: "Communications | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="communications" />,
});
