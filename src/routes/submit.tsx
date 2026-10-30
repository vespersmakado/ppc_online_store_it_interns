import { createFileRoute } from "@tanstack/react-router";
import { SubmitPage } from "@/pages/submit/SubmitPage";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Review Your Quotation | PPC Zimbabwe Online Store" },
      {
        name: "description",
        content: "Review your PPC Zimbabwe quotation and payment status before submission.",
      },
    ],
  }),
  component: SubmitPage,
});
