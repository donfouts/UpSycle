// Admin override: remove a featured slot row (Prompts/backend system
// functionality.md's admin-override section). Modeled after
// app/api/admin/sellers/[id]/route.ts's conventions (force-dynamic,
// NextRequest/NextResponse, requireAdminApiUser gate, P2025 -> 404 mapping).
//
// NOTE: this is a listing-removal only. It does not touch Stripe or issue
// any refund — not for a real purchase (stripePaymentId set) and not for a
// system random-fill (isRandomFill = true, stripePaymentId null). Any refund
// for a real purchase is a separate, manual/out-of-band operation.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminApiUser } from "@/lib/auth";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;

  try {
    await prisma.featuredSlotPurchase.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Featured slot not found." }, { status: 404 });
    }
    console.error("Admin featured slot removal failed:", err);
    return NextResponse.json({ error: "Failed to remove featured slot." }, { status: 500 });
  }
}
