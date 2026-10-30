import { useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CartPanel } from "@/pages/cart/components/CartPanel";
import { CheckoutDialog } from "@/pages/cart/components/CheckoutDialog";
import { StoreHeader } from "@/features/store/components/StoreHeader";

export function CartPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <StoreHeader showCart />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <a
          href="/#products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Continue shopping
        </a>
        <div className="mx-auto mt-7 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShoppingCart className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Your cart
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Review your bags, choose fulfilment and check out.
              </p>
            </div>
          </div>
          <CartPanel onCheckout={() => setCheckoutOpen(true)} />
        </div>
      </main>
      <footer className="mt-8 bg-ink py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} PPC Zimbabwe <span className="mx-2">·</span> Strength
        guaranteed.
      </footer>
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
