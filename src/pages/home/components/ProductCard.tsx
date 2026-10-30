import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "@/features/store/components/QtyStepper";
import { useCart } from "@/features/store/cart";
import { formatUSD, type Product } from "@/features/store/products";

const QUICK_QTY = [40, 80, 120, 200];

const PRODUCT_STYLES: Record<string, { band: string; label: string }> = {
  "surecem-32-5n": { band: "bg-primary", label: "text-primary" },
  "surebuild-42-5n": { band: "bg-ink", label: "text-ink" },
  "surecast-42-5r": { band: "bg-amber-600", label: "text-amber-700" },
};

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add, priceOf } = useCart();
  const [qty, setQty] = useState(40);
  const style = PRODUCT_STYLES[product.id] ?? { band: "bg-primary", label: "text-primary" };
  const price = priceOf(product.id);

  const handleAdd = () => {
    if (qty < 1) return;
    add(product.id, qty);
    toast.success(`${qty} × ${product.name} ${product.grade} added`, {
      description: `${formatUSD(qty * price)} added to your cart`,
    });
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover sm:flex-row animate-rise"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="relative flex min-h-48 shrink-0 items-center justify-center overflow-hidden bg-[#f2f0ec] sm:w-48">
        <span className="absolute left-4 top-4 rounded-full bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
          {product.badge ?? product.strengthClass}
        </span>
        <span className="absolute right-4 top-4 rounded-md bg-ink px-2 py-1 text-[10px] font-bold text-white">
          {product.bagKg} kg
        </span>
        <div className="relative flex h-36 w-28 -rotate-2 flex-col items-center overflow-hidden rounded-t-xl rounded-b-sm bg-white shadow-[0_18px_26px_-14px_rgba(31,27,24,0.4)] ring-1 ring-black/10 transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-[1.03]">
          <div className={`absolute inset-x-0 top-0 h-2 ${style.band}`} />
          <div className="mt-5 flex size-8 items-center justify-center rounded-full border-2 border-primary text-[7px] font-black tracking-tighter text-primary">
            PPC
          </div>
          <span className="mt-2 font-display text-lg leading-none text-ink">{product.name}</span>
          <span className={`mt-1 text-xs font-extrabold ${style.label}`}>{product.grade}</span>
          <span className="mt-2 text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {product.strengthClass}
          </span>
          <span
            className={`mt-auto flex h-5 w-full items-center justify-center text-[7px] font-bold uppercase tracking-wider text-white ${style.band}`}
          >
            Portland cement
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {product.strengthClass}
            </div>
            <h3 className="mt-1 flex flex-wrap items-baseline gap-2 font-display text-2xl text-ink">
              {product.name}
              <span className={style.label}>{product.grade}</span>
            </h3>
            <p className="mt-1 max-w-lg text-sm leading-5 text-muted-foreground">
              {product.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-medium text-muted-foreground">per 50 kg bag</div>
            <div className="font-display text-2xl leading-tight text-ink">{formatUSD(price)}</div>
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {product.bestFor.map((use) => (
            <li
              key={use}
              className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground"
            >
              {use}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {QUICK_QTY.map((quickQty) => (
              <button
                key={quickQty}
                type="button"
                onClick={() => setQty(quickQty)}
                aria-pressed={quickQty === qty}
                className={
                  quickQty === qty
                    ? "min-w-10 rounded-lg border border-primary bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary-deep"
                    : "min-w-10 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:border-primary/50"
                }
              >
                {quickQty}
              </button>
            ))}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <QtyStepper
              value={qty}
              onChange={setQty}
              min={40}
              step={40}
              label={`${product.name} quantity`}
            />
            <Button variant="hero" onClick={handleAdd} className="min-w-28 rounded-xl">
              <Plus className="size-4" /> Add bags
            </Button>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          {formatUSD(price * qty)} for {qty} bags
        </div>
      </div>
    </article>
  );
}
