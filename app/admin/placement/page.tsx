import type { Metadata } from "next";
import type { PlacementPageType } from "@prisma/client";
import { SellerApprovalStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActivePlacementPeriod, getPendingPlacementPeriod, PAID_SLOT_COUNT } from "@/lib/placement";
import { CATEGORY_TREE } from "@/lib/categories";
import { formatDate, formatPriceCents, sellerDisplayName } from "@/lib/format";
import PlacementRemoveButton from "@/components/admin/PlacementRemoveButton";
import PlacementSlotAssignForm, { type PlacementSellerOption } from "@/components/admin/PlacementSlotAssignForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Featured Placement — Admin — UpSycle Market",
};

// Admin override UI for the weekly Home/Category/Sub-Category featured
// placement system (Prompts/product_layout.md). Per Prompts/backend system
// functionality.md: "Admins can remove chosen winners if needed" and
// "Admins can select seller to fill empty slots if needed." Lottery-slot
// gap-filling (assigning a seller into an empty *lottery* winner slot, as
// opposed to a paid slot) is out of scope here — only paid-slot filling is
// required.

interface Section {
  key: string;
  label: string;
  pageType: PlacementPageType;
  /** Resolved Category.id for this section, or null for HOME. Also null if
   * the matching Category row hasn't been seeded yet (see CATEGORY_TREE) —
   * in that case the section still renders but assignment is disabled. */
  categoryId: string | null;
}

function buildSections(categoryIdBySlug: Map<string, string>): Section[] {
  const sections: Section[] = [{ key: "HOME", label: "Home", pageType: "HOME", categoryId: null }];

  for (const top of CATEGORY_TREE) {
    sections.push({
      key: `CATEGORY:${top.slug}`,
      label: top.name,
      pageType: "CATEGORY",
      categoryId: categoryIdBySlug.get(top.slug) ?? null,
    });
    for (const leaf of top.children ?? []) {
      sections.push({
        key: `SUBCATEGORY:${leaf.slug}`,
        label: `${top.name} › ${leaf.name}`,
        pageType: "SUBCATEGORY",
        categoryId: categoryIdBySlug.get(leaf.slug) ?? null,
      });
    }
  }

  return sections;
}

export default async function AdminPlacementPage() {
  await requireAdmin();

  const [pendingPeriod, activePeriod, categories, approvedSellers] = await Promise.all([
    getPendingPlacementPeriod(),
    getActivePlacementPeriod(),
    prisma.category.findMany({ select: { slug: true, id: true } }),
    prisma.sellerProfile.findMany({
      where: { approvalStatus: SellerApprovalStatus.APPROVED },
      select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const sections = buildSections(categoryIdBySlug);
  const sellerOptions: PlacementSellerOption[] = approvedSellers.map((s) => ({
    id: s.id,
    label: `${sellerDisplayName(s)} (${s.user.email})`,
  }));

  return (
    <section>
      <div className="eyebrow">Placement</div>
      <h1 className="admin-page-title">Featured Placement Overrides</h1>
      <p className="admin-page-sub">
        Remove lottery winners or paid slots, and manually fill empty paid slots, for the pending (drawn,
        purchase window open) and active (currently live) weekly placement periods.
      </p>

      <h2 className="mb-4 font-serif text-[1.3rem] font-normal text-[var(--cream)]">
        Pending Period
      </h2>
      {pendingPeriod ? (
        <PeriodSections period={pendingPeriod} sections={sections} sellerOptions={sellerOptions} />
      ) : (
        <p className="mb-10 text-[0.85rem] font-light text-[var(--muted2)]">
          No period is currently PENDING (drawn, not yet live).
        </p>
      )}

      <h2 className="mb-4 font-serif text-[1.3rem] font-normal text-[var(--cream)]">
        Active Period
      </h2>
      {activePeriod ? (
        <PeriodSections period={activePeriod} sections={sections} sellerOptions={sellerOptions} />
      ) : (
        <p className="mb-10 text-[0.85rem] font-light text-[var(--muted2)]">
          No period is currently ACTIVE (live on the site).
        </p>
      )}
    </section>
  );
}

async function PeriodSections({
  period,
  sections,
  sellerOptions,
}: {
  period: { id: string; startsAt: Date; endsAt: Date };
  sections: Section[];
  sellerOptions: PlacementSellerOption[];
}) {
  const sellerInclude = {
    sellerProfile: {
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    },
  };

  const [winners, slots] = await Promise.all([
    prisma.lotteryWinner.findMany({
      where: { periodId: period.id },
      include: sellerInclude,
      orderBy: { rank: "asc" },
    }),
    prisma.featuredSlotPurchase.findMany({
      where: { periodId: period.id },
      include: sellerInclude,
      orderBy: { slotNumber: "asc" },
    }),
  ]);

  return (
    <div className="mb-10">
      <p className="mb-6 text-[0.8rem] text-[var(--muted2)]">
        {formatDate(period.startsAt)} &ndash; {formatDate(period.endsAt)}
      </p>
      <div className="space-y-6">
        {sections.map((section) => {
          const sectionWinners = winners.filter(
            (w) => w.pageType === section.pageType && w.categoryId === section.categoryId,
          );
          const sectionSlots = slots.filter(
            (s) => s.pageType === section.pageType && s.categoryId === section.categoryId,
          );
          const takenSlotNumbers = new Set(sectionSlots.map((s) => s.slotNumber));
          const emptySlotNumbers = Array.from({ length: PAID_SLOT_COUNT }, (_, i) => i + 1).filter(
            (n) => !takenSlotNumbers.has(n),
          );
          // A CATEGORY/SUBCATEGORY section whose Category row hasn't been
          // seeded yet (categoryId resolved to null) can't be assigned into —
          // there's no real categoryId to write onto a new row.
          const canAssign = section.pageType === "HOME" || section.categoryId !== null;

          return (
            <div key={section.key} className="admin-review-card">
              <h3>{section.label}</h3>

              <div className="form-label mt-4 mb-2">Lottery Winners ({sectionWinners.length})</div>
              {sectionWinners.length === 0 ? (
                <p className="text-[0.8rem] text-[var(--muted2)]">None drawn.</p>
              ) : (
                <ul className="list-none space-y-2">
                  {sectionWinners.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.85rem] text-[var(--muted2)]">
                        #{w.rank} &mdash; {sellerDisplayName(w.sellerProfile)} ({w.sellerProfile.user.email})
                      </span>
                      <PlacementRemoveButton
                        kind="winner"
                        id={w.id}
                        confirmMessage={`Remove ${sellerDisplayName(w.sellerProfile)} as a lottery winner for ${section.label}?`}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <div className="form-label mt-6 mb-2">Paid Slots ({sectionSlots.length})</div>
              {sectionSlots.length === 0 ? (
                <p className="text-[0.8rem] text-[var(--muted2)]">None sold.</p>
              ) : (
                <ul className="list-none space-y-2">
                  {sectionSlots.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.85rem] text-[var(--muted2)]">
                        Slot {s.slotNumber} &mdash; {sellerDisplayName(s.sellerProfile)} ({s.sellerProfile.user.email})
                        {" — "}
                        {formatPriceCents(s.priceCents)}
                        {s.isRandomFill ? " (random-filled)" : ""}
                      </span>
                      <PlacementRemoveButton
                        kind="slot"
                        id={s.id}
                        confirmMessage={`Remove ${sellerDisplayName(s.sellerProfile)} from slot ${s.slotNumber} for ${section.label}? This does not issue a refund.`}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <div className="form-label mt-6 mb-2">
                Empty Slots ({emptySlotNumbers.length}/{PAID_SLOT_COUNT})
              </div>
              {emptySlotNumbers.length === 0 ? (
                <p className="text-[0.8rem] text-[var(--muted2)]">All paid slots are filled.</p>
              ) : !canAssign ? (
                <p className="text-[0.8rem] text-[var(--muted2)]">
                  Open: {emptySlotNumbers.join(", ")}. This category hasn&apos;t been seeded yet, so slots here
                  can&apos;t be assigned.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-[0.78rem] text-[var(--muted2)]">Open: {emptySlotNumbers.join(", ")}</p>
                  <PlacementSlotAssignForm
                    periodId={period.id}
                    pageType={section.pageType}
                    categoryId={section.categoryId}
                    nextOpenSlotNumber={emptySlotNumbers[0]}
                    sellers={sellerOptions}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
