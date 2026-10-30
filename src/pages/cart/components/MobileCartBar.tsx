import { ShoppingCart } from "lucide-react";
import { useCart } from "@/features/store/cart";
import { formatUSD } from "@/features/store/products";

export function MobileCartBar({ onOpen }: { onOpen: () => void }) {
  const { bags, total } = useCart();
  if (bags === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur-md lg:hidden animate-rise">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-xl bg-gradient-red px-5 py-3.5 text-primary-foreground shadow-red"
      >
        <span className="flex items-center gap-3">
          <span className="relative">
            <ShoppingCart className="size-5" />
            <span className="absolute -right-2.5 -top-2.5 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-ink-foreground">
              {bags > 99 ? "99+" : bags}
            </span>
          </span>
          <span className="font-bold uppercase tracking-wide">View cart</span>
        </span>
        <span className="font-display text-xl tabular-nums">{formatUSD(total)}</span>
      </button>
    </div>
  );
}
