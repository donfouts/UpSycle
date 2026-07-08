"use client";

import { useEffect, useState } from "react";
import {
  addToCart as addToCartStorage,
  cartItemCount,
  clearCart as clearCartStorage,
  readCart,
  removeFromCart as removeFromCartStorage,
  subscribeToCart,
  updateCartQuantity as updateCartQuantityStorage,
  type CartItem,
} from "@/lib/cart";

/** Reactive view over the localStorage cart (see lib/cart.ts). Any component
 * that calls this hook re-renders whenever the cart changes, in this tab or
 * another. Used by the header badge, the Add to Cart button, and the cart
 * page — kept as a hook (rather than a context provider) since the cart
 * lives outside React state entirely and every consumer just needs to
 * subscribe independently. */
export function useCart() {
  // Lazy initializer reads localStorage on the client's first render. This
  // never diverges from the server-rendered markup: every consumer of this
  // hook gates cart-dependent UI on `hydrated` (false until the effect
  // below flips it after mount), so the *value* of `items` before that
  // point never actually reaches the DOM.
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Flips only after mount, so server-rendered markup (no `window`) never
    // mismatches the client's first paint — every consumer gates
    // cart-dependent UI on this flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount hydration flag, not a data sync loop
    setHydrated(true);
    return subscribeToCart(() => setItems(readCart()));
  }, []);

  return {
    items,
    count: cartItemCount(items),
    hydrated,
    addToCart: (productId: string, quantity = 1) => setItems(addToCartStorage(productId, quantity)),
    updateQuantity: (productId: string, quantity: number) =>
      setItems(updateCartQuantityStorage(productId, quantity)),
    removeFromCart: (productId: string) => setItems(removeFromCartStorage(productId)),
    clearCart: () => {
      clearCartStorage();
      setItems([]);
    },
  };
}
