import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";
import SellerActionButtons from "@/components/admin/SellerActionButtons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sellers — Admin — UpSycle Market",
};

function sellerName(user: { firstName: string | null; lastName: string | null }): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
}

export default async function AdminSellersPage() {
  const sellers = await prisma.sellerProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      samplePhotos: { orderBy: { createdAt: "asc" } },
      _count: { select: { products: true } },
    },
  });

  const pending = sellers.filter((s) => s.approvalStatus === "PENDING");
  const others = sellers.filter((s) => s.approvalStatus !== "PENDING");

  return (
    <section>
      <div className="eyebrow">Sellers</div>
      <h1 className="admin-page-title">Seller Applications &amp; Accounts</h1>
      <p className="admin-page-sub">
        Review pending applications, and approve, suspend, or reinstate any seller account.
      </p>

      <h2 className="mb-4 font-serif text-[1.3rem] font-normal text-[var(--cream)]">
        Pending Applications ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="mb-10 text-[0.85rem] font-light text-[var(--muted2)]">
          No applications are waiting for review right now.
        </p>
      ) : (
        <div className="mb-10">
          {pending.map((seller) => (
            <div key={seller.id} className="admin-review-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3>{sellerName(seller.user)}</h3>
                  <p className="text-[0.8rem] text-[var(--muted2)]">{seller.user.email}</p>
                </div>
                <StatusBadge status={seller.approvalStatus} />
              </div>

              <dl className="admin-review-grid">
                <div className="admin-review-field">
                  <dt>Website</dt>
                  <dd>
                    {seller.websiteUrl ? (
                      <a
                        href={seller.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--rg-light)] no-underline hover:underline"
                      >
                        {seller.websiteUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="admin-review-field">
                  <dt>Expected Monthly Sales</dt>
                  <dd>{seller.expectedMonthlySales ?? "—"}</dd>
                </div>
                <div className="admin-review-field">
                  <dt>Social Media</dt>
                  <dd>
                    {seller.socialMediaUrls.length > 0 ? (
                      <ul className="list-none">
                        {seller.socialMediaUrls.map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--rg-light)] no-underline hover:underline"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="admin-review-field">
                  <dt>Suppliers</dt>
                  <dd>{seller.supplierList.length > 0 ? seller.supplierList.join(", ") : "—"}</dd>
                </div>
                <div className="admin-review-field">
                  <dt>Applied</dt>
                  <dd>{seller.createdAt.toLocaleDateString()}</dd>
                </div>
              </dl>

              {seller.samplePhotos.length > 0 && (
                <>
                  <div className="form-label mb-2">Sample Product Photos</div>
                  <div className="admin-photo-grid">
                    {seller.samplePhotos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element -- external S3/placeholder URLs, no next/image domain config for these yet
                      <img key={photo.id} src={photo.url} alt="Seller sample product" />
                    ))}
                  </div>
                </>
              )}

              <SellerActionButtons sellerId={seller.id} status={seller.approvalStatus} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 font-serif text-[1.3rem] font-normal text-[var(--cream)]">
        All Seller Accounts
      </h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Email</th>
              <th>Listings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {others.length === 0 ? (
              <tr>
                <td colSpan={5}>No approved or suspended sellers yet.</td>
              </tr>
            ) : (
              others.map((seller) => (
                <tr key={seller.id}>
                  <td>{sellerName(seller.user)}</td>
                  <td>{seller.user.email}</td>
                  <td>{seller._count.products}</td>
                  <td>
                    <StatusBadge status={seller.approvalStatus} />
                  </td>
                  <td>
                    <SellerActionButtons sellerId={seller.id} status={seller.approvalStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
