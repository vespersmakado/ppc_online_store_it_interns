import { createFileRoute } from "@tanstack/react-router";
import { ViewOrderPage } from "@/pages/view-order/ViewOrderPage";

export const Route = createFileRoute("/view-order")({
  head: () => ({
    meta: [{ title: "Quotation | PPC Zimbabwe Online Store" }],
  }),
  component: ViewOrderPage,
});
