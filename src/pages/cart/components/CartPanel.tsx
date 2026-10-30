import { ArrowRight, Lock, PackageOpen, Store, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "@/features/store/components/QtyStepper";
import { useCart } from "@/features/store/cart";
import { FREE_DELIVERY_BAGS, formatUSD, type FulfilmentMethod } from "@/features/store/products";
import { cn } from "@/lib/utils";

const METHODS: { id: FulfilmentMethod; label: string; sub: string; icon: typeof Truck }[] = [
  { id: "delivery", label: "Deliver to me", sub: "1–3 days", icon: Truck },
  { id: "collect", label: "Collect", sub: "Free · same day", icon: Store },
];

export function CartPanel({ onCheckout }: { onCheckout: () => void }) {
  const {
    lines,
    bags,
    subtotal,
    delivery,
    total,
    method,
    methodSelected,
    setMethod,
    setQty,
    remove,
    clear,
  } = useCart();

  const toFree = Math.max(0, FREE_DELIVERY_BAGS - bags);
  const progress = Math.min(100, (bags / FREE_DELIVERY_BAGS) * 100);

  return (
    <div className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card shadow-cart ring-1 ring-border">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-ink px-5 py-4 text-ink-foreground">
        <div className="absolute inset-x-0 bottom-0 h-1.5 chevron-band opacity-90" />
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl">Your Cart</div>
            <div className="text-xs text-ink-foreground/70">
              {bags === 0
                ? "No bags yet"
                : `${bags} bag${bags === 1 ? "" : "s"} · ${lines.length} product${lines.length === 1 ? "" : "s"}`}
            </div>
          </div>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-ink-foreground/60 underline-offset-4 hover:text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="min-h-0 overflow-y-auto px-5 py-4">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
              <PackageOpen className="size-8 text-primary" />
            </div>
            <p className="mt-4 font-semibold text-foreground">Your cart is empty</p>
            <p className="mt-1 max-w-[16rem] text-sm text-muted-foreground">
              Pick a cement, choose how many bags, and tap <b>Add</b>. It takes seconds.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border border-border bg-background p-3 animate-rise"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-lg leading-tight text-ink">
                      {l.name} <span className="text-primary">{l.grade}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatUSD(l.price)} × {l.bagKg}kg bag
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    aria-label={`Remove ${l.name}`}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <QtyStepper
                    size="sm"
                    value={l.qty}
                    onChange={(v) => setQty(l.id, v)}
                    step={40}
                    label={`${l.name} bags in cart`}
                  />
                  <div className="font-bold tabular-nums text-foreground">
                    {formatUSD(l.lineTotal)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="space-y-4 border-t border-border bg-muted/50 px-5 py-4">
        {/* Delivery / collect */}
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => {
            const active = methodSelected && m.id === method;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition-all",
                  active
                    ? "border-primary bg-card shadow-card"
                    : "border-border bg-transparent hover:border-primary/40",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span>
                  <span className="block text-sm font-bold leading-tight">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {method === "delivery" && bags > 0 && (
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className={toFree === 0 ? "text-success" : "text-foreground"}>
                {toFree === 0
                  ? "You've unlocked FREE delivery!"
                  : `Add ${toFree} more bags for free delivery`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  toFree === 0 ? "bg-success" : "bg-gradient-red",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatUSD(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {method === "collect" ? "Collection" : "Delivery"}
            </dt>
            <dd className="font-semibold tabular-nums">
              {delivery === 0 ? <span className="text-success">FREE</span> : formatUSD(delivery)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-3xl tabular-nums text-ink">{formatUSD(total)}</dd>
          </div>
        </dl>

        <Button
          variant="hero"
          size="xl"
          className="w-full text-lg"
          disabled={bags === 0 || !methodSelected}
          onClick={onCheckout}
        >
          Checkout now <ArrowRight className="size-5" />
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" /> Pay with EcoCash, card or bank transfer
        </p>
      </div>
    </div>
  );
}
