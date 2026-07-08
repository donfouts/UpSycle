// Cart storage + shared cart types.
//
// Deliberately NOT a Prisma model (see prisma/schema.prisma — no Cart table
// exists on purpose). The cart is pre-purchase/ephemeral, doesn't need to
// survive across devices, and never needs server persistence until the
// buyer actually checks out — so it lives entirely in the browser's
// localStorage as a small `{productId, quantity}[]` payload. At checkout the
// client sends this payload to the server (see app/api/checkout/route.ts),
// which re-validates every price/inventory number against the live Product
// table before ever creating a Stripe Checkout Session or an Order — this
// module's `readCart`/`writeCart` are never trusted as a source of truth for
// money, only for "what did the buyer say they wanted."
//
// This module is imported from both client components (product page's Add
// to Cart button, the cart/checkout pages) and is safe to import from server
// code too since every localStorage access is guarded by `isBrowser()` and
// no top-level code touches `window`.

export interface CartItem {
  productId: string;
  quantity: number;
}

/** A cart line re-priced/validated server-side, ready to charge and to
 * snapshot into an OrderItem. */
export interface ValidatedCartLine {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  shippingCostCents: number;
  sellerProfileId: string;
  title: string;
}

export const CART_STORAGE_KEY = "upsycle_cart_v1";
/** window CustomEvent name dispatched on every cart mutation so any mounted
 * component (header badge, cart page) can re-read localStorage and update. */
export const CART_EVENT = "upsycle:cart-updated";

export const MAX_QUANTITY_PER_LINE = 20;
/** Keeps the Stripe Checkout Session metadata payload (500 chars/key) safe —
 * see encodeCartMetadataItems below. Generous for a handcrafted-goods cart. */
export const MAX_CART_LINES = 15;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Map<string, number>();
  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as CartItem).productId !== "string" ||
      typeof (entry as CartItem).quantity !== "number"
    ) {
      continue;
    }
    const productId = (entry as CartItem).productId;
    const quantity = Math.floor((entry as CartItem).quantity);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    seen.set(productId, Math.min(MAX_QUANTITY_PER_LINE, quantity));
    if (seen.size >= MAX_CART_LINES) break;
  }
  return Array.from(seen, ([productId, quantity]) => ({ productId, quantity }));
}

/** Reads the cart from localStorage. Returns `[]` on the server or if the
 * stored value is missing/corrupt. */
export function readCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(productId: string, quantity = 1): CartItem[] {
  const current = readCart();
  const existing = current.find((item) => item.productId === productId);
  let next: CartItem[];
  if (existing) {
    next = current.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(MAX_QUANTITY_PER_LINE, item.quantity + quantity) }
        : item,
    );
  } else if (current.length >= MAX_CART_LINES) {
    next = current;
  } else {
    next = [...current, { productId, quantity: Math.min(MAX_QUANTITY_PER_LINE, quantity) }];
  }
  writeCart(next);
  return next;
}

export function updateCartQuantity(productId: string, quantity: number): CartItem[] {
  const current = readCart();
  const next =
    quantity <= 0
      ? current.filter((item) => item.productId !== productId)
      : current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(MAX_QUANTITY_PER_LINE, Math.floor(quantity)) }
            : item,
        );
  writeCart(next);
  return next;
}

export function removeFromCart(productId: string): CartItem[] {
  const next = readCart().filter((item) => item.productId !== productId);
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart([]);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Subscribes to same-tab (`CART_EVENT`) and cross-tab (`storage`) cart
 * changes. Returns an unsubscribe function. */
export function subscribeToCart(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// ---------------------------------------------------------------------------
// Stripe Checkout Session metadata encoding
// ---------------------------------------------------------------------------
//
// We snapshot the *server-validated* price/shipping/seller numbers (computed
// once in app/api/checkout/route.ts against live Product rows) into the
// Checkout Session's metadata, rather than re-querying Product prices again
// in the webhook handler. That guarantees the Order/OrderItem rows created
// on payment confirmation always reflect exactly what Stripe charged, even
// if a seller edits a Product's price in the (short) window between
// Checkout Session creation and payment completion.
//
// Format: `productId:quantity:unitPriceCents:shippingCostCents:sellerProfileId`
// lines joined by `|`. Kept deliberately compact — Stripe metadata values
// are capped at 500 characters per key.
const LINE_FIELD_SEP = ":";
const LINE_SEP = "|";

export function encodeCartMetadataItems(lines: ValidatedCartLine[]): string {
  return lines
    .map((l) => [l.productId, l.quantity, l.unitPriceCents, l.shippingCostCents, l.sellerProfileId].join(LINE_FIELD_SEP))
    .join(LINE_SEP);
}

export interface DecodedCartLine {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  shippingCostCents: number;
  sellerProfileId: string;
}

export function decodeCartMetadataItems(raw: string | null | undefined): DecodedCartLine[] {
  if (!raw) return [];
  return raw
    .split(LINE_SEP)
    .map((line) => line.split(LINE_FIELD_SEP))
    .filter((parts) => parts.length === 5)
    .map(([productId, quantity, unitPriceCents, shippingCostCents, sellerProfileId]) => ({
      productId,
      quantity: Number.parseInt(quantity, 10),
      unitPriceCents: Number.parseInt(unitPriceCents, 10),
      shippingCostCents: Number.parseInt(shippingCostCents, 10),
      sellerProfileId,
    }))
    .filter(
      (line) =>
        line.productId &&
        line.sellerProfileId &&
        Number.isFinite(line.quantity) &&
        Number.isFinite(line.unitPriceCents) &&
        Number.isFinite(line.shippingCostCents),
    );
}
