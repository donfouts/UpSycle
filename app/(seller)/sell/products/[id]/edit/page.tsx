import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireSellerPageAuth, sellerAuthFailureMessage } from "@/lib/seller-auth";
import ProductForm, { type CategoryOption } from "@/components/seller/ProductForm";

export const metadata: Metadata = {
  title: "Edit Product — UpSycle Market",
};

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const auth = await requireSellerPageAuth(`/sell/products/${id}/edit`);

  if (!auth.ok) {
    return (
      <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center md:p-14">
        <div className="eyebrow justify-center before:hidden">Edit Product</div>
        <h1 className="sec-title">
          Not quite <em>ready yet</em>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
          {sellerAuthFailureMessage(auth.failure)}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {auth.failure.kind === "no-seller-profile" && (
            <Link href="/sell/signup" className="btn-primary">
              Apply to Sell
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Back to UpSycle Market
          </Link>
        </div>
      </div>
    );
  }

  // Ownership check: a product that exists but belongs to a different
  // seller renders the same 404 as a product that doesn't exist at all —
  // this route never confirms/denies existence of other sellers' listings.
  const product = await prisma.product.findUnique({
    where: { id },
    include: { photos: { orderBy: { position: "asc" } } },
  });

  if (!product || product.sellerProfileId !== auth.seller.sellerProfileId) {
    notFound();
  }

  const subcategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
    orderBy: [{ name: "asc" }],
  });

  const categories: CategoryOption[] = subcategories.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? "Other",
  }));

  return (
    <div>
      <div className="mb-10 text-center">
        <div className="eyebrow justify-center before:hidden">Edit Product</div>
        <h1 className="sec-title">
          Update <em>{product.title}</em>
        </h1>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
