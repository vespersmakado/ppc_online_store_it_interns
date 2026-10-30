import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

export const Route = createFileRoute("/staff/orders/")({
  head: () => ({ meta: [{ title: "Sales Orders | PPC Zimbabwe" }] }),
  component: () => <StaffPortalPage view="orders" />,
});
