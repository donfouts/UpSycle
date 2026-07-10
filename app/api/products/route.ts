// Create a new product listing for the current (must be APPROVED) seller.
// Writes Product + its ProductPhoto rows in a transaction, same convention as
// app/api/sellers/signup/route.ts.
//
// Cannot be statically rendered — it reads the session and writes to
// Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveSellerAuth, sellerAuthErrorResponse } from "@/lib/seller-auth";
import { type ProductInput, validateProductInput } from "@/lib/validation/product";

export async function POST(request: NextRequest) {
  const auth = await resolveSellerAuth();
  if (!auth.ok) {
    return sellerAuthErrorResponse(auth.failure);
  }

  let body: Partial<ProductInput>;
  try {
    body = (await request.json()) as Partial<ProductInput>;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const errors = validateProductInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const input = body as ProductInput;

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    return NextResponse.json({ errors: ["Selected category does not exist."] }, { status: 400 });
  }

  const photoUrls = input.photoUrls.map((u) => u.trim()).filter(Boolean);

  try {
    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          sellerProfileId: auth.seller.sellerProfileId,
          categoryId: input.categoryId,
          title: input.title.trim(),
          description: input.description.trim(),
          priceCents: input.priceCents,
          shippingCostCents: input.shippingCostCents,
          offersLocalPickup: input.offersLocalPickup ?? false,
          dimensions: input.dimensions?.trim() || null,
          weightGrams: input.weightGrams ?? null,
          inventoryCount: input.inventoryCount,
          proofOfHandcraftedUrl: input.proofOfHandcraftedUrl.trim(),
          photos: {
            create: photoUrls.map((url, index) => ({ url, position: index })),
          },
        },
        include: { photos: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Failed to create product:", err);
    return NextResponse.json(
      { errors: ["Failed to create the product. Please try again."] },
      { status: 500 },
    );
  }
}
