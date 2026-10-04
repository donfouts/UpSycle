// Admin override: remove a chosen lottery winner (Prompts/backend system
// functionality.md: "Admins can remove chosen winners if needed"). Modeled
// after app/api/admin/sellers/[id]/route.ts's conventions (force-dynamic,
// NextRequest/NextResponse, requireAdminApiUser gate, P2025 -> 404 mapping).
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
    await prisma.lotteryWinner.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Lottery winner not found." }, { status: 404 });
    }
    console.error("Admin lottery winner removal failed:", err);
    return NextResponse.json({ error: "Failed to remove lottery winner." }, { status: 500 });
  }
}
