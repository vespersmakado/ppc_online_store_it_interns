import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, ShoppingCart, Truck } from "lucide-react";
import { useCart } from "../cart";
import { cn } from "@/lib/utils";

export function StoreHeader({ showCart = false }: { showCart?: boolean }) {
  const { bags, lastAdded } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [lastAdded]);

  return (
    <header className="sticky top-0 z-40">
      {/* Top promo strip */}
      <div className="bg-ink text-ink-foreground">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-medium sm:px-6">
          <span className="flex items-center gap-2">
            <Truck className="size-3.5 text-primary" />
            Free delivery on 50+ bags
          </span>
          <a
            href="tel:+263000000000"
            className="hidden items-center gap-2 hover:text-primary sm:flex"
          >
            <Phone className="size-3.5 text-primary" />
            Order help: +263 00 000 0000
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span
              aria-label="PPC"
              className="grid size-12 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground"
            >
              PPC
            </span>
            <div className="leading-none">
              <div className="font-display text-2xl text-ink">
                PPC <span className="text-primary">Zimbabwe</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Online Cement Store
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a
              href="/#products"
              className="text-foreground/80 transition-colors hover:text-primary"
            >
              Shop Cement
            </a>
            <a href="/#how" className="text-foreground/80 transition-colors hover:text-primary">
              How it works
            </a>
          </nav>

          {showCart && (
            <Link
              to="/cart"
              className="group flex items-center gap-2 rounded-full bg-gradient-red py-2 pl-3 pr-4 text-primary-foreground shadow-red transition-transform hover:-translate-y-0.5"
              aria-label={`Cart, ${bags} bags`}
            >
              <span className="relative">
                <ShoppingCart className="size-5" />
                <span
                  className={cn(
                    "absolute -right-2.5 -top-2.5 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-ink-foreground",
                    bump && "animate-pop",
                  )}
                >
                  {bags > 99 ? "99+" : bags}
                </span>
              </span>
              <span className="text-sm font-bold">Cart</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
