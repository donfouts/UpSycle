// Admin seller-approval actions: approve / suspend / reinstate. Modeled
// after app/api/sellers/signup/route.ts's conventions (force-dynamic,
// NextRequest/NextResponse, prisma import). Requires the caller to hold the
// ADMIN role (see lib/auth.ts's requireAdminApiUser) — this is the actual
// authorization boundary for these mutations, not app/admin/layout.tsx
// (which only guards page rendering, not API calls made directly).
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, SellerApprovalStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminApiUser } from "@/lib/auth";

type SellerAction = "approve" | "suspend" | "reinstate";

function isSellerAction(value: unknown): value is SellerAction {
  return value === "approve" || value === "suspend" || value === "reinstate";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApiUser();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;

  let body: { action?: unknown };
  try {
    body = (await request.json()) as { action?: unknown };
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isSellerAction(body.action)) {
    return NextResponse.json(
      { error: "action must be one of: approve, suspend, reinstate." },
      { status: 400 },
    );
  }
  const action = body.action;

  try {
    const sellerProfile = await prisma.sellerProfile.findUniqueOrThrow({ where: { id } });
    const current = sellerProfile.approvalStatus;

    // approve: PENDING -> APPROVED
    // suspend: PENDING or APPROVED -> SUSPENDED (any status is suspendable,
    //   per the spec, but suspending an already-suspended account is a no-op
    //   we still reject to avoid masking a stale-UI double-click)
    // reinstate: SUSPENDED -> APPROVED
    let nextStatus: SellerApprovalStatus;
    if (action === "approve") {
      if (current !== SellerApprovalStatus.PENDING) {
        return NextResponse.json(
          { error: `Cannot approve a seller currently in ${current} status.` },
          { status: 409 },
        );
      }
      nextStatus = SellerApprovalStatus.APPROVED;
    } else if (action === "suspend") {
      if (current === SellerApprovalStatus.SUSPENDED) {
        return NextResponse.json(
          { error: "This seller is already suspended." },
          { status: 409 },
        );
      }
      nextStatus = SellerApprovalStatus.SUSPENDED;
    } else {
      if (current !== SellerApprovalStatus.SUSPENDED) {
        return NextResponse.json(
          { error: `Cannot reinstate a seller currently in ${current} status.` },
          { status: 409 },
        );
      }
      nextStatus = SellerApprovalStatus.APPROVED;
    }

    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: { approvalStatus: nextStatus },
    });

    return NextResponse.json({ id: updated.id, approvalStatus: updated.approvalStatus });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }
    console.error("Admin seller status update failed:", err);
    return NextResponse.json({ error: "Failed to update seller status." }, { status: 500 });
  }
}
