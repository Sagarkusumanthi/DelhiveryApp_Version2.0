"use client";
import { useCallback, useEffect, useState } from "react";

export interface CartState {
  storeId: string | null;
  items: Record<string, number>; // productId -> qty
}

const STORAGE_KEY = "giftly.cart";
const EMPTY: CartState = { storeId: null, items: {} };

function readCart(): CartState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeCart(cart: CartState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

// A cart can hold several products but only from one store at a time,
// matching the original prototype's rule. Persisted to localStorage so it
// survives navigation between pages (there's no server-side cart model).
export function useCart() {
  const [cart, setCart] = useState<CartState>(EMPTY);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const persist = useCallback((next: CartState) => {
    setCart(next);
    writeCart(next);
  }, []);

  const addItem = useCallback(
    (storeId: string, productId: string, qty: number) => {
      setCart((prev) => {
        const sameStore = !prev.storeId || prev.storeId === storeId;
        const base = sameStore ? prev : EMPTY;
        const current = base.items[productId] ?? 0;
        const nextQty = Math.max(0, Math.min(10, current + qty));
        const items = { ...base.items };
        if (nextQty === 0) delete items[productId];
        else items[productId] = nextQty;
        const next = { storeId: Object.keys(items).length ? storeId : null, items };
        writeCart(next);
        return next;
      });
    },
    []
  );

  const clearCart = useCallback(() => persist(EMPTY), [persist]);

  const itemsArray = Object.entries(cart.items).map(([productId, qty]) => ({ productId, qty }));
  const totalQty = itemsArray.reduce((sum, i) => sum + i.qty, 0);

  return { cart, itemsArray, totalQty, addItem, clearCart, setCart: persist };
}
