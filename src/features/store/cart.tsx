import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  PRODUCTS,
  calcTotals,
  readDemoProductPrices,
  type FulfilmentMethod,
  type Product,
} from "./products";

type CartState = {
  items: Record<string, number>;
  prices: Record<string, number>;
  method: FulfilmentMethod;
  methodSelected: boolean;
};

type Action =
  | { type: "add"; id: string; qty: number; priceCents: number }
  | { type: "set"; id: string; qty: number; priceCents: number }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "method"; method: FulfilmentMethod }
  | { type: "hydrate"; state: unknown; currentPrices: Record<string, number> }
  | { type: "refresh-prices"; prices: Record<string, number> };

const BAGS_PER_INCREMENT = 40;
const MAX_QTY = 9960;
const STORAGE_KEY = "ppc-zw-cart-v1";

function normalizeCartState(value: unknown, currentPrices: Record<string, number>): CartState {
  if (!value || typeof value !== "object") {
    return { items: {}, prices: {}, method: "delivery", methodSelected: false };
  }

  const stored = value as Partial<CartState>;
  const rawItems =
    stored.items && typeof stored.items === "object"
      ? (stored.items as Record<string, unknown>)
      : {};
  const items: Record<string, number> = {};
  const prices: Record<string, number> = {};
  const rawPrices =
    stored.prices && typeof stored.prices === "object"
      ? (stored.prices as Record<string, unknown>)
      : {};

  for (const product of PRODUCTS) {
    const quantity = rawItems[product.id];
    if (
      typeof quantity === "number" &&
      Number.isSafeInteger(quantity) &&
      quantity > 0 &&
      quantity % BAGS_PER_INCREMENT === 0
    ) {
      items[product.id] = Math.min(MAX_QTY, quantity);
      const savedPrice = rawPrices[product.id];
      prices[product.id] =
        typeof savedPrice === "number" && Number.isSafeInteger(savedPrice) && savedPrice > 0
          ? savedPrice
          : Math.round((currentPrices[product.id] ?? product.price) * 100);
    }
  }

  return {
    items,
    prices,
    method: stored.method === "collect" ? "collect" : "delivery",
    methodSelected: stored.methodSelected === true,
  };
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      if (
        !PRODUCTS.some((product) => product.id === action.id) ||
        !Number.isSafeInteger(action.qty) ||
        action.qty <= 0 ||
        action.qty % BAGS_PER_INCREMENT !== 0
      ) {
        return state;
      }
      const next = Math.min(MAX_QTY, (state.items[action.id] ?? 0) + action.qty);
      return {
        ...state,
        items: { ...state.items, [action.id]: next },
        prices: {
          ...state.prices,
          [action.id]: state.prices[action.id] ?? action.priceCents,
        },
      };
    }
    case "set": {
      const items = { ...state.items };
      const q =
        Number.isSafeInteger(action.qty) && action.qty > 0 && action.qty % BAGS_PER_INCREMENT === 0
          ? Math.min(MAX_QTY, action.qty)
          : 0;
      if (!PRODUCTS.some((product) => product.id === action.id)) return state;
      const prices = { ...state.prices };
      if (q === 0) {
        delete items[action.id];
        delete prices[action.id];
      } else {
        items[action.id] = q;
        prices[action.id] = prices[action.id] ?? action.priceCents;
      }
      return { ...state, items, prices };
    }
    case "remove": {
      const items = { ...state.items };
      const prices = { ...state.prices };
      delete items[action.id];
      delete prices[action.id];
      return { ...state, items, prices };
    }
    case "clear":
      return { ...state, items: {}, prices: {} };
    case "method":
      return { ...state, method: action.method, methodSelected: true };
    case "hydrate":
      return normalizeCartState(action.state, action.currentPrices);
    case "refresh-prices":
      return {
        ...state,
        prices: Object.fromEntries(
          Object.keys(state.items).flatMap((id) => {
            const price = action.prices[id];
            return typeof price === "number" && Number.isSafeInteger(price) && price > 0
              ? [[id, price] as [string, number]]
              : [];
          }),
        ),
      };
  }
}

export type CartLine = Product & { qty: number; lineTotal: number };

type CartContextValue = {
  lines: CartLine[];
  method: FulfilmentMethod;
  methodSelected: boolean;
  bags: number;
  subtotal: number;
  delivery: number;
  total: number;
  lastAdded: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setMethod: (m: FulfilmentMethod) => void;
  restore: (state: unknown) => void;
  qtyOf: (id: string) => number;
  priceChanges: Array<{ productId: string; savedPriceCents: number; currentPriceCents: number }>;
  refreshPrices: () => void;
  priceOf: (id: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    items: {},
    prices: {},
    method: "delivery",
    methodSelected: false,
  });
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);
  const [demoPrices, setDemoPrices] = useState<Record<string, number>>(readDemoProductPrices);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw)
        dispatch({
          type: "hydrate",
          state: JSON.parse(raw) as unknown,
          currentPrices: readDemoProductPrices(),
        });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    const refreshPrices = () => setDemoPrices(readDemoProductPrices());
    window.addEventListener("ppc-demo-prices-updated", refreshPrices);
    return () => window.removeEventListener("ppc-demo-prices-updated", refreshPrices);
  }, []);

  const lines = useMemo<CartLine[]>(
    () =>
      PRODUCTS.flatMap((p) => {
        const qty = state.items[p.id] ?? 0;
        const price = (state.prices[p.id] ?? Math.round((demoPrices[p.id] ?? p.price) * 100)) / 100;
        return qty > 0 ? [{ ...p, price, qty, lineTotal: price * qty }] : [];
      }),
    [state.items, state.prices, demoPrices],
  );

  const totals = useMemo(() => calcTotals(lines, state.method), [lines, state.method]);
  const priceChanges = useMemo(
    () =>
      Object.keys(state.items).flatMap((productId) => {
        const savedPriceCents = state.prices[productId];
        const currentPriceCents = Math.round(
          (demoPrices[productId] ??
            PRODUCTS.find((product) => product.id === productId)?.price ??
            0) * 100,
        );
        return savedPriceCents && savedPriceCents !== currentPriceCents
          ? [{ productId, savedPriceCents, currentPriceCents }]
          : [];
      }),
    [demoPrices, state.items, state.prices],
  );

  const add = useCallback(
    (id: string, qty = 1) => {
      const product = PRODUCTS.find((item) => item.id === id);
      dispatch({
        type: "add",
        id,
        qty,
        priceCents: Math.round((demoPrices[id] ?? product?.price ?? 0) * 100),
      });
      setLastAdded(Date.now());
    },
    [demoPrices],
  );
  const setQty = useCallback(
    (id: string, qty: number) => {
      const product = PRODUCTS.find((item) => item.id === id);
      dispatch({
        type: "set",
        id,
        qty,
        priceCents: Math.round((demoPrices[id] ?? product?.price ?? 0) * 100),
      });
    },
    [demoPrices],
  );
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const setMethod = useCallback(
    (method: FulfilmentMethod) => dispatch({ type: "method", method }),
    [],
  );
  const restore = useCallback(
    (state: unknown) => dispatch({ type: "hydrate", state, currentPrices: demoPrices }),
    [demoPrices],
  );
  const refreshPrices = useCallback(() => {
    dispatch({
      type: "refresh-prices",
      prices: Object.fromEntries(
        PRODUCTS.map((product) => [
          product.id,
          Math.round((demoPrices[product.id] ?? product.price) * 100),
        ]),
      ),
    });
  }, [demoPrices]);
  const priceOf = useCallback(
    (id: string) => demoPrices[id] ?? PRODUCTS.find((product) => product.id === id)?.price ?? 0,
    [demoPrices],
  );
  const qtyOf = useCallback((id: string) => state.items[id] ?? 0, [state.items]);

  const value: CartContextValue = {
    lines,
    method: state.method,
    methodSelected: state.methodSelected,
    ...totals,
    lastAdded,
    add,
    setQty,
    remove,
    clear,
    setMethod,
    restore,
    qtyOf,
    priceChanges,
    refreshPrices,
    priceOf,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
