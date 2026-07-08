import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireSellerPageAuth, sellerAuthFailureMessage } from "@/lib/seller-auth";
import ProductForm, { type CategoryOption } from "@/components/seller/ProductForm";

export const metadata: Metadata = {
  title: "Add a Product — UpSycle Market",
};

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const auth = await requireSellerPageAuth("/sell/products/new");

  if (!auth.ok) {
    return (
      <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center md:p-14">
        <div className="eyebrow justify-center before:hidden">Add a Product</div>
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

  // Products are always categorized under a leaf/subcategory (see
  // prisma/seed.ts) — only those are offered here, grouped by their
  // top-level parent for the <optgroup> select.
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
        <div className="eyebrow justify-center before:hidden">Add a Product</div>
        <h1 className="sec-title">
          List a <em>new piece</em>
        </h1>
        <p className="mx-auto max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
          Every listing needs 2–6 photos of the item and one proof-of-handcrafted photo for
          verification.
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
