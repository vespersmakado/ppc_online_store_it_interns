import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/prices/history")({
  head: () => ({ meta: [{ title: "Price History | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="price-history" />,
});
