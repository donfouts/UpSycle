// Edit an existing product (including inventory adjustment) belonging to the
// current (must be APPROVED) seller. Ownership is verified against
// sellerProfileId before any write — a product that exists but belongs to a
// different seller is treated the same as a product that doesn't exist
// (404), so this endpoint never confirms/denies existence of other sellers'
// listings.
//
// Cannot be statically rendered — it reads the session and writes to
// Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveSellerAuth, sellerAuthErrorResponse } from "@/lib/seller-auth";
import {
  MAX_PRODUCT_PHOTOS,
  MIN_PRODUCT_PHOTOS,
  type ProductInput,
  validateInventoryAdjustment,
} from "@/lib/validation/product";

type EditProductInput = Partial<ProductInput> & {
  inventoryDelta?: number;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const auth = await resolveSellerAuth();
  if (!auth.ok) {
    return sellerAuthErrorResponse(auth.failure);
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.sellerProfileId !== auth.seller.sellerProfileId) {
    return NextResponse.json({ errors: ["Product not found."] }, { status: 404 });
  }

  let body: EditProductInput;
  try {
    body = (await request.json()) as EditProductInput;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  // Two supported shapes on one endpoint: a full field edit (validated like
  // create, but every field optional/only-if-present) and/or an inventory
  // adjustment (absolute set via inventoryCount, or relative via
  // inventoryDelta — e.g. a dashboard +/- control debiting stock after a sale
  // without a read-modify-write race).
  const errors: string[] = [];

  if (body.title !== undefined && !body.title.trim()) errors.push("Title cannot be blank.");
  if (body.description !== undefined && !body.description.trim()) errors.push("Description cannot be blank.");
  if (body.priceCents !== undefined && (!Number.isInteger(body.priceCents) || body.priceCents <= 0)) {
    errors.push("Price must be a positive amount.");
  }
  if (
    body.shippingCostCents !== undefined &&
    (!Number.isInteger(body.shippingCostCents) || body.shippingCostCents < 0)
  ) {
    errors.push("Shipping cost must be a non-negative amount.");
  }
  if (body.offersLocalPickup !== undefined && typeof body.offersLocalPickup !== "boolean") {
    errors.push("Offers local pickup must be true or false.");
  }
  if (
    body.weightGrams !== undefined &&
    body.weightGrams !== null &&
    (!Number.isInteger(body.weightGrams) || body.weightGrams < 0)
  ) {
    errors.push("Weight must be a non-negative whole number of grams.");
  }
  if (body.photoUrls !== undefined) {
    const photoUrls = body.photoUrls.map((u) => u.trim()).filter(Boolean);
    if (photoUrls.length < MIN_PRODUCT_PHOTOS || photoUrls.length > MAX_PRODUCT_PHOTOS) {
      errors.push(`Between ${MIN_PRODUCT_PHOTOS} and ${MAX_PRODUCT_PHOTOS} product photos are required.`);
    }
  }
  errors.push(...validateInventoryAdjustment(body));

  let category: { id: string } | null = null;
  if (body.categoryId !== undefined) {
    category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) errors.push("Selected category does not exist.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      if (body.inventoryDelta !== undefined) {
        // Guard against driving inventory negative from a stale client.
        const current = await tx.product.findUniqueOrThrow({ where: { id }, select: { inventoryCount: true } });
        const next = current.inventoryCount + body.inventoryDelta;
        if (next < 0) {
          throw new Error("INVENTORY_UNDERFLOW");
        }
        await tx.product.update({ where: { id }, data: { inventoryCount: next } });
      }

      if (body.photoUrls !== undefined) {
        const photoUrls = body.photoUrls.map((u) => u.trim()).filter(Boolean);
        await tx.productPhoto.deleteMany({ where: { productId: id } });
        await tx.productPhoto.createMany({
          data: photoUrls.map((url, index) => ({ productId: id, url, position: index })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title.trim() }),
          ...(body.description !== undefined && { description: body.description.trim() }),
          ...(body.priceCents !== undefined && { priceCents: body.priceCents }),
          ...(body.shippingCostCents !== undefined && { shippingCostCents: body.shippingCostCents }),
          ...(body.offersLocalPickup !== undefined && { offersLocalPickup: body.offersLocalPickup }),
          ...(body.dimensions !== undefined && { dimensions: body.dimensions.trim() || null }),
          ...(body.weightGrams !== undefined && { weightGrams: body.weightGrams }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
          ...(body.proofOfHandcraftedUrl !== undefined && {
            proofOfHandcraftedUrl: body.proofOfHandcraftedUrl.trim(),
          }),
          ...(body.inventoryCount !== undefined && { inventoryCount: body.inventoryCount }),
        },
        include: { photos: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof Error && err.message === "INVENTORY_UNDERFLOW") {
      return NextResponse.json(
        { errors: ["That adjustment would make inventory negative."] },
        { status: 400 },
      );
    }
    console.error("Failed to update product:", err);
    return NextResponse.json(
      { errors: ["Failed to update the product. Please try again."] },
      { status: 500 },
    );
  }
}
