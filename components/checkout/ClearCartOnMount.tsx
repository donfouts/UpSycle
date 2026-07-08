"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/** Empties the localStorage cart once the buyer lands on the post-payment
 * success page. Stripe only redirects here after the Checkout Session
 * completes, so it's safe to treat arrival here as "this cart was paid
 * for" — the actual Order row is created separately by the webhook (see
 * app/api/webhooks/stripe/route.ts), which is the authoritative record. */
export default function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
