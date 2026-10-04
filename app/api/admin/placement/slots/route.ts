// Admin override: manually fill an empty paid slot (Prompts/backend system
// functionality.md: "Admins can select seller to fill empty slots if
// needed"). Modeled after app/api/admin/sellers/[id]/route.ts's conventions
// (force-dynamic, NextRequest/NextResponse, requireAdminApiUser gate, JSON
// error shapes). Always fills the lowest-numbered open slot in the given
// period/pageType/category section — the admin picks a seller, not a
// specific slot number.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, SellerApprovalStatus } from "@prisma/client";
import type { PlacementPageType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminApiUser } from "@/lib/auth";
import { PAID_SLOT_COUNT } from "@/lib/placement";

function isPageType(value: unknown): value is PlacementPageType {
  return value === "HOME" || value === "CATEGORY" || value === "SUBCATEGORY";
}

interface CreateSlotBody {
  periodId?: unknown;
  pageType?: unknown;
  categoryId?: unknown;
  sellerProfileId?: unknown;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminApiUser();
  if (authResult instanceof NextResponse) return authResult;

  let body: CreateSlotBody;
  try {
    body = (await request.json()) as CreateSlotBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { periodId, pageType, categoryId, sellerProfileId } = body;

  if (typeof periodId !== "string" || !periodId) {
    return NextResponse.json({ error: "periodId is required." }, { status: 400 });
  }
  if (!isPageType(pageType)) {
    return NextResponse.json(
      { error: "pageType must be one of: HOME, CATEGORY, SUBCATEGORY." },
      { status: 400 },
    );
  }
  if (categoryId !== null && typeof categoryId !== "string") {
    return NextResponse.json({ error: "categoryId must be a string or null." }, { status: 400 });
  }
  if (pageType === "HOME" && categoryId !== null) {
    return NextResponse.json({ error: "categoryId must be null for pageType HOME." }, { status: 400 });
  }
  if (pageType !== "HOME" && !categoryId) {
    return NextResponse.json(
      { error: "categoryId is required for pageType CATEGORY/SUBCATEGORY." },
      { status: 400 },
    );
  }
  if (typeof sellerProfileId !== "string" || !sellerProfileId) {
    return NextResponse.json({ error: "sellerProfileId is required." }, { status: 400 });
  }

  // Narrowed/resolved after the checks above: null only for HOME, a real
  // Category.id string otherwise.
  const resolvedCategoryId: string | null = pageType === "HOME" ? null : (categoryId as string);

  try {
    const [period, seller] = await Promise.all([
      prisma.placementPeriod.findUnique({ where: { id: periodId } }),
      prisma.sellerProfile.findUnique({ where: { id: sellerProfileId } }),
    ]);
    if (!period) {
      return NextResponse.json({ error: "Placement period not found." }, { status: 404 });
    }
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }
    if (seller.approvalStatus !== SellerApprovalStatus.APPROVED) {
      return NextResponse.json(
        { error: "Only approved sellers can be assigned a featured slot." },
        { status: 409 },
      );
    }
    if (resolvedCategoryId) {
      const category = await prisma.category.findUnique({ where: { id: resolvedCategoryId } });
      if (!category) {
        return NextResponse.json({ error: "Category not found." }, { status: 404 });
      }
    }

    // Same uniqueness idea the seller purchase flow would enforce: a seller
    // shouldn't hold two placements (a lottery win and a paid slot, or two
    // paid slots) in the same period/pageType/category section — that would
    // show them twice on one page.
    const [existingSlot, existingWinner] = await Promise.all([
      prisma.featuredSlotPurchase.findFirst({
        where: { periodId, pageType, categoryId: resolvedCategoryId, sellerProfileId },
      }),
      prisma.lotteryWinner.findFirst({
        where: { periodId, pageType, categoryId: resolvedCategoryId, sellerProfileId },
      }),
    ]);
    if (existingSlot || existingWinner) {
      return NextResponse.json(
        { error: "This seller already has a placement in this period/section." },
        { status: 409 },
      );
    }

    const takenSlots = await prisma.featuredSlotPurchase.findMany({
      where: { periodId, pageType, categoryId: resolvedCategoryId },
      select: { slotNumber: true },
    });
    const taken = new Set(takenSlots.map((s) => s.slotNumber));
    let slotNumber: number | null = null;
    for (let n = 1; n <= PAID_SLOT_COUNT; n++) {
      if (!taken.has(n)) {
        slotNumber = n;
        break;
      }
    }
    if (slotNumber === null) {
      return NextResponse.json({ error: "No open slots remain in this section." }, { status: 409 });
    }

    const created = await prisma.featuredSlotPurchase.create({
      data: {
        periodId,
        pageType,
        categoryId: resolvedCategoryId,
        slotNumber,
        sellerProfileId,
        priceCents: 0,
        isRandomFill: true,
        stripePaymentId: null,
      },
    });

    return NextResponse.json({ id: created.id, slotNumber: created.slotNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "That slot was just taken by another request. Please try again." },
        { status: 409 },
      );
    }
    console.error("Admin featured slot assignment failed:", err);
    return NextResponse.json({ error: "Failed to assign featured slot." }, { status: 500 });
  }
}
