import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/pages/cart/CartPage";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | PPC Zimbabwe Online Store" },
      { name: "description", content: "Review your PPC cement order and check out securely." },
    ],
  }),
  component: CartPage,
});
