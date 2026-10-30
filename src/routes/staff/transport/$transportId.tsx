import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

function StaffTransportDetailRoute() {
  const { transportId } = Route.useParams();
  return <StaffPortalPage view="transport-detail" recordId={transportId} />;
}

export const Route = createFileRoute("/staff/transport/$transportId")({
  head: () => ({ meta: [{ title: "Transport Details | PPC Zimbabwe" }] }),
  component: StaffTransportDetailRoute,
});
