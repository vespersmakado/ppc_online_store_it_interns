import { useState, type FormEvent } from "react";
import { Building2, CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/features/store/cart";
import { formatUSD } from "@/features/store/products";
import { cn } from "@/lib/utils";

const PAYMENTS = [
  { id: "ecocash", label: "EcoCash", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "bank", label: "Bank transfer", icon: Building2 },
] as const;

type PaymentId = (typeof PAYMENTS)[number]["id"];

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { lines, bags, subtotal, delivery, total, method, clear } = useCart();
  const [payment, setPayment] = useState<PaymentId>("ecocash");
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ total: number; bags: number } | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ref = `PPC-${Math.floor(100000 + Math.random() * 900000)}`;
    setPlaced({ total, bags });
    setOrderRef(ref);
    clear();
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setOrderRef(null);
      setPlaced(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-lg">
        {orderRef && placed ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/15 animate-pop">
              <CheckCircle2 className="size-11 text-success" />
            </div>
            <DialogTitle className="mt-5 font-display text-3xl text-ink">Order placed!</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              Thank you. Your order <b className="text-foreground">{orderRef}</b> for {placed.bags}{" "}
              bags ({formatUSD(placed.total)}) has been received. We'll call you shortly to confirm.
            </DialogDescription>
            <Button
              variant="hero"
              size="xl"
              className="mt-6 w-full"
              onClick={() => handleOpenChange(false)}
            >
              Continue shopping
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="relative bg-gradient-ink px-6 py-5 text-ink-foreground">
              <div className="absolute inset-x-0 bottom-0 h-1.5 chevron-band" />
              <DialogTitle className="font-display text-3xl">Quick Checkout</DialogTitle>
              <DialogDescription className="text-ink-foreground/70">
                {bags} bags · {method === "collect" ? "Collect from depot" : "Delivered to you"}
              </DialogDescription>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="co-name">Full name</Label>
                  <Input id="co-name" required placeholder="e.g. Tendai Moyo" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="co-phone">Phone number</Label>
                  <Input
                    id="co-phone"
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="07X XXX XXXX"
                    className="h-11"
                  />
                </div>
              </div>

              {method === "delivery" && (
                <div className="space-y-1.5">
                  <Label htmlFor="co-address">Delivery address</Label>
                  <Input
                    id="co-address"
                    required
                    placeholder="Street, suburb, city"
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Pay with</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENTS.map((p) => {
                    const Icon = p.icon;
                    const active = payment === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPayment(p.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-bold transition-all",
                          active
                            ? "border-primary bg-primary-soft text-primary-deep"
                            : "border-border text-foreground/80 hover:border-primary/40",
                        )}
                      >
                        <Icon className="size-5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-muted p-4 text-sm">
                {lines.map((l) => (
                  <div key={l.id} className="flex justify-between py-0.5">
                    <span>
                      {l.qty} × {l.name} {l.grade}
                    </span>
                    <span className="tabular-nums">{formatUSD(l.lineTotal)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatUSD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{method === "collect" ? "Collection" : "Delivery"}</span>
                  <span className="tabular-nums">
                    {delivery === 0 ? "FREE" : formatUSD(delivery)}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-display text-2xl text-ink">{formatUSD(total)}</span>
                </div>
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full text-lg">
                Place order · {formatUSD(total)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
