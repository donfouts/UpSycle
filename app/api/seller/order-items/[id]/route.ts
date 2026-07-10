// Seller "mark as shipped" action (issue #13). Cannot be statically
// rendered — it authenticates against the session cookie and mutates
// Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ShippingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getApprovedSeller } from "@/lib/require-seller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const seller = await getApprovedSeller();
  if (!seller) {
    return NextResponse.json(
      { error: "You must be an approved seller to do this." },
      { status: 401 },
    );
  }

  const { id } = await params;

  // The only transition this endpoint performs is PENDING_SHIPMENT ->
  // SHIPPED. The body is optional/informational — if the caller does send a
  // target status, reject anything other than SHIPPED so the intent behind
  // the request is explicit rather than assumed. This same transition is
  // reused for local-pickup line items ("Mark as Picked Up" in the seller
  // UI) — display labels differ by fulfillmentMethod (see
  // lib/format.ts's shippingStatusLabel), but the underlying status
  // transition and this endpoint are intentionally shared rather than
  // duplicated.
  let body: { shippingStatus?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No/invalid JSON body — fine, this endpoint doesn't require one.
  }
  if (body.shippingStatus && body.shippingStatus !== ShippingStatus.SHIPPED) {
    return NextResponse.json(
      { error: "This endpoint only supports marking an item as shipped." },
      { status: 400 },
    );
  }

  const orderItem = await prisma.orderItem.findUnique({ where: { id } });

  // Never trust the client-supplied id alone: confirm this line item
  // actually belongs to the requesting seller before mutating it. A missing
  // id and one that belongs to a different seller are intentionally
  // indistinguishable (404) so we don't leak existence of other sellers' data.
  if (!orderItem || orderItem.sellerProfileId !== seller.sellerProfile.id) {
    return NextResponse.json({ error: "Order item not found." }, { status: 404 });
  }

  if (orderItem.shippingStatus !== ShippingStatus.PENDING_SHIPMENT) {
    return NextResponse.json(
      { error: "Only items pending shipment can be marked as shipped." },
      { status: 409 },
    );
  }

  const updated = await prisma.orderItem.update({
    where: { id },
    data: { shippingStatus: ShippingStatus.SHIPPED },
  });

  return NextResponse.json({ orderItem: updated });
}
