// Lets an approved seller edit their own storefront "story" paragraph after
// signup (SellerProfile.story — see prisma/schema.prisma). Everything else
// on SellerProfile is set at application time and isn't editable here.
//
// Cannot be statically rendered — it reads the session and writes to
// Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveSellerAuth, sellerAuthErrorResponse } from "@/lib/seller-auth";
import { MAX_STORY_LENGTH } from "@/lib/validation/sellerSignup";
import type { SellerTier } from "@prisma/client";

const VALID_TIERS: SellerTier[] = ["TIER_1", "TIER_2", "TIER_3"];

export async function PATCH(request: NextRequest) {
  const auth = await resolveSellerAuth();
  if (!auth.ok) {
    return sellerAuthErrorResponse(auth.failure);
  }

  let body: { story?: string; tier?: string };
  try {
    body = (await request.json()) as { story?: string; tier?: string };
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const story = body.story !== undefined ? body.story.trim() : undefined;
  if (story !== undefined && story.length > MAX_STORY_LENGTH) {
    return NextResponse.json(
      { errors: [`Your story must be ${MAX_STORY_LENGTH} characters or fewer.`] },
      { status: 400 },
    );
  }

  if (body.tier !== undefined && !VALID_TIERS.includes(body.tier as SellerTier)) {
    return NextResponse.json(
      { errors: ["Tier must be one of TIER_1, TIER_2, or TIER_3."] },
      { status: 400 },
    );
  }

  const sellerProfile = await prisma.sellerProfile.update({
    where: { id: auth.seller.sellerProfileId },
    data: {
      ...(story !== undefined ? { story: story || null } : {}),
      ...(body.tier !== undefined ? { tier: body.tier as SellerTier } : {}),
    },
  });

  return NextResponse.json({ story: sellerProfile.story, tier: sellerProfile.tier });
}
