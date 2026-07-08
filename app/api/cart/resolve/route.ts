// Resolves a client-held cart payload ({productId, quantity}[]) against live
// Product rows so the cart/checkout pages can render current price, stock,
// and seller info. This is a read-only convenience endpoint — it does NOT
// create anything and is not the source of truth for what gets charged;
// app/api/checkout/route.ts re-validates everything independently right
// before creating the Stripe Checkout Session. No auth required: the data
// returned here is the same public product info visible on /browse.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sellerDisplayName } from "@/lib/format";
import { MAX_QUANTITY_PER_LINE, type CartItem } from "@/lib/cart";

interface ResolveBody {
  items?: CartItem[];
}

export async function POST(request: NextRequest) {
  let body: ResolveBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ lines: [] });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      photos: { orderBy: { position: "asc" }, take: 1 },
      sellerProfile: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      return { productId: item.productId, quantity: item.quantity, available: false as const };
    }
    // Quantity is reported as-requested (clamped only to the per-line cap) —
    // the client compares it against `inventoryCount` to show "only N left"
    // warnings. It is NOT silently reduced here; app/api/checkout/route.ts
    // is the actual enforcement point.
    return {
      productId: product.id,
      title: product.title,
      photoUrl: product.photos[0]?.url ?? null,
      sellerName: sellerDisplayName(product.sellerProfile),
      priceCents: product.priceCents,
      shippingCostCents: product.shippingCostCents,
      inventoryCount: product.inventoryCount,
      quantity: Math.min(item.quantity, MAX_QUANTITY_PER_LINE),
      available: product.inventoryCount > 0,
    };
  });

  return NextResponse.json({ lines });
}
