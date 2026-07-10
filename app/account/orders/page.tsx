import Link from "next/link";

import ShippingStatusBadge from "@/components/ShippingStatusBadge";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate, formatPriceCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Always reflects the buyer's live order/session state — no build-time prerender.
export const dynamic = "force-dynamic";

export default async function OrderHistoryPage() {
  const user = await requireCurrentUser("/account/orders");

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: { photos: { orderBy: { position: "asc" }, take: 1 } },
          },
        },
      },
    },
  });

  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <div className="eyebrow">My Account</div>
      <h1 className="sec-title">
        Order <em>History</em>
      </h1>

      {orders.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center">
          <p className="mb-6 text-[0.9rem] font-light text-[var(--muted2)]">
            You haven&apos;t placed any orders yet.
          </p>
          <Link href="/browse" className="btn-primary">
            Browse the Market
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <article key={order.id} className="border border-[var(--border)] bg-[var(--charcoal)] p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
                <div>
                  <div className="mb-1 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                    Order placed {formatDate(order.createdAt)}
                  </div>
                  <div className="font-serif text-[0.95rem] text-[var(--cream)]">
                    Order #{order.id.slice(0, 8)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">Total</div>
                  <div className="grad-text font-serif text-[1.1rem] font-semibold">
                    {formatPriceCents(order.totalAmountCents)}
                  </div>
                </div>
                <Link href={`/account/orders/${order.id}`} className="btn-secondary">
                  View Details
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {order.items.map((item) => {
                  const photo = item.product?.photos[0];
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden bg-[var(--deep)]">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet
                          <img
                            src={photo.url}
                            alt={item.product?.title ?? "Product photo"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-[0.5rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-serif text-[0.92rem] text-[var(--cream)]">
                          {item.product?.title ?? "Product no longer available"}
                        </div>
                        <div className="text-[0.78rem] font-light text-[var(--muted2)]">
                          Qty {item.quantity} &middot; {formatPriceCents(item.unitPriceCents)} each
                        </div>
                      </div>
                      <ShippingStatusBadge status={item.shippingStatus} fulfillmentMethod={item.fulfillmentMethod} />
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
