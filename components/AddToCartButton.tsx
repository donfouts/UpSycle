"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";

interface AddToCartButtonProps {
  productId: string;
  inventoryCount: number;
}

/** Client island dropped into the (server-rendered) product detail page —
 * see app/products/[id]/page.tsx. Everything else on that page stays a
 * server component fetching straight from Prisma; only the actual "add to
 * cart" interaction needs the browser. */
export default function AddToCartButton({ productId, inventoryCount }: AddToCartButtonProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = inventoryCount <= 0;
  const maxQuantity = Math.max(1, Math.min(inventoryCount, MAX_QUANTITY_PER_LINE));

  if (outOfStock) {
    return (
      <button type="button" disabled className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
        Out of Stock
      </button>
    );
  }

  function handleAdd() {
    addToCart(productId, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="sr-only" htmlFor="quantity">
        Quantity
      </label>
      <select
        id="quantity"
        className="form-select w-auto"
        value={quantity}
        onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10))}
      >
        {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            Qty {n}
          </option>
        ))}
      </select>

      <button type="button" onClick={handleAdd} className="btn-primary">
        {added ? "Added ✓" : "Add to Cart"}
      </button>

      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="text-[0.68rem] font-medium uppercase tracking-[0.13em] text-[var(--rg-light)] underline underline-offset-4"
        >
          View Cart
        </button>
      )}
    </div>
  );
}
