import { DEMO_PRODUCT_PRICES_STORAGE_KEY } from "@/features/staff/staffDemoData";

export type Product = {
  id: string;
  name: string;
  grade: string;
  strengthClass: string;
  tagline: string;
  description: string;
  bestFor: string[];
  bagKg: number;
  /** Price per bag in USD */
  price: number;
  badge?: string;
  /** Set this to an image URL/import when product photos are ready */
  image?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "surecem-32-5n",
    name: "SURECEM",
    grade: "32,5N",
    strengthClass: "General Purpose",
    tagline: "The everyday builder's cement",
    description:
      "Reliable all-rounder for plastering, brickwork and general concrete around the home.",
    bestFor: ["Plaster", "Brickwork", "Screeds"],
    bagKg: 50,
    price: 12,
    badge: "Best Seller",
  },
  {
    id: "surebuild-42-5n",
    name: "SureBuild",
    grade: "42,5N",
    strengthClass: "High Strength",
    tagline: "Strength for structural work",
    description:
      "Higher strength for foundations, slabs, columns and reinforced concrete structures.",
    bestFor: ["Foundations", "Slabs", "Columns"],
    bagKg: 50,
    price: 14,
    badge: "Builders' Choice",
  },
  {
    id: "surecast-42-5r",
    name: "SURECAST",
    grade: "42,5R",
    strengthClass: "Rapid Hardening",
    tagline: "Early strength, faster projects",
    description:
      "Rapid early strength for precast, bricks, blocks and jobs that need quick turnaround.",
    bestFor: ["Precast", "Blocks", "Fast-track"],
    bagKg: 50,
    price: 13,
    badge: "Rapid Set",
  },
];

export function readDemoProductPrices(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(DEMO_PRODUCT_PRICES_STORAGE_KEY);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved demonstration product prices have an invalid format.");
  }
  const prices: Record<string, number> = {};
  for (const [productId, cents] of Object.entries(parsed)) {
    if (typeof cents !== "number" || !Number.isSafeInteger(cents) || cents <= 0) {
      throw new Error(`Saved demonstration price for ${productId} is invalid.`);
    }
    prices[productId] = cents / 100;
  }
  return prices;
}

/** Flat delivery fee in USD */
export const DELIVERY_FEE = 25;
/** Number of bags at which delivery becomes free */
export const FREE_DELIVERY_BAGS = 50;

export type FulfilmentMethod = "delivery" | "collect";

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function calcTotals(lines: { price: number; qty: number }[], method: FulfilmentMethod) {
  const bags = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery =
    method === "collect" || bags === 0 || bags >= FREE_DELIVERY_BAGS ? 0 : DELIVERY_FEE;
  return { bags, subtotal, delivery, total: subtotal + delivery };
}
