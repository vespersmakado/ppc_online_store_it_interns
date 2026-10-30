import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalPage } from "@/pages/staff/StaffPortalPage";

function StaffQuotationDetailRoute() {
  const { quotationId } = Route.useParams();
  return <StaffPortalPage view="quotation-detail" recordId={quotationId} />;
}

export const Route = createFileRoute("/staff/quotations/$quotationId")({
  head: () => ({ meta: [{ title: "Quotation Review | PPC Zimbabwe" }] }),
  component: StaffQuotationDetailRoute,
});
