import { createFileRoute } from "@tanstack/react-router";
import { BuyPage } from "@/pages/buy/BuyPage";

export const Route = createFileRoute("/buy")({
  head: () => ({
    meta: [{ title: "Buy | PPC Zimbabwe Online Store" }],
  }),
  component: BuyPage,
});
