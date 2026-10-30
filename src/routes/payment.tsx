import { createFileRoute } from "@tanstack/react-router";
import { PaymentPage } from "@/pages/payment/PaymentPage";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Complete Your Payment | PPC Zimbabwe Online Store" },
      {
        name: "description",
        content: "Review your PPC Zimbabwe quotation and continue to payment.",
      },
    ],
  }),
  component: PaymentPage,
});
