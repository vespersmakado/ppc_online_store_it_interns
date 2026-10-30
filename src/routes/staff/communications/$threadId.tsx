import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

function StaffCommunicationDetailRoute() {
  const { threadId } = Route.useParams();
  return <StaffPortalPage view="communication-detail" recordId={threadId} />;
}

export const Route = createFileRoute("/staff/communications/$threadId")({
  head: () => ({ meta: [{ title: "Conversation | PPC Zimbabwe" }] }),
  component: StaffCommunicationDetailRoute,
});
