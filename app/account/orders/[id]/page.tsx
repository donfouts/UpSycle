import Link from "next/link";
import { notFound } from "next/navigation";

import ShippingStatusBadge from "@/components/ShippingStatusBadge";
import { requireCurrentUser } from "@/lib/current-user";
import { formatDate, formatPriceCents, sellerDisplayName } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Always reflects the buyer's live order/session state — no build-time prerender.
export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const user = await requireCurrentUser(`/account/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shippingAddress: true,
      items: {
        include: {
          product: {
            include: { photos: { orderBy: { position: "asc" }, take: 1 } },
          },
          sellerProfile: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });

  // Not found OR belongs to a different buyer — either way, this buyer
  // shouldn't see it. 404 rather than redirect so this can't be used to
  // probe which order ids exist.
  if (!order || order.buyerId !== user.id) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <Link
        href="/account/orders"
        className="mb-8 inline-block text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
      >
        &larr; Back to Order History
      </Link>

      <div className="eyebrow">Order #{order.id.slice(0, 8)}</div>
      <h1 className="sec-title">
        Placed <em>{formatDate(order.createdAt)}</em>
      </h1>

      <div className="mb-10 grid grid-cols-1 gap-6 border border-[var(--border)] bg-[var(--charcoal)] p-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--rg-core)]">
            Shipping Address
          </div>
          {order.shippingAddress ? (
            <div className="text-[0.85rem] font-light leading-relaxed text-[var(--muted2)]">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </div>
          ) : (
            <p className="text-[0.85rem] font-light leading-relaxed text-[var(--muted2)]">
              This order is for local pickup — no shipping address needed.
            </p>
          )}
        </div>
        <div>
          <div className="mb-2 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--rg-core)]">Order Total</div>
          <div className="grad-text font-serif text-[1.3rem] font-semibold">
            {formatPriceCents(order.totalAmountCents)}
          </div>
        </div>
      </div>

      <div className="mb-4 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--rg-core)]">Items</div>
      <div className="flex flex-col gap-px bg-[var(--border)]">
        {order.items.map((item) => {
          const photo = item.product?.photos[0];
          const lineTotalCents = item.unitPriceCents * item.quantity + item.shippingCostCents;

          return (
            <div key={item.id} className="flex flex-wrap items-center gap-4 bg-[var(--charcoal)] p-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden bg-[var(--deep)]">
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
                <div className="mb-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                  {sellerDisplayName(item.sellerProfile)}
                </div>
                {item.product ? (
                  <Link
                    href={`/products/${item.product.id}`}
                    className="font-serif text-[0.98rem] text-[var(--cream)] no-underline hover:text-[var(--rg-light)]"
                  >
                    {item.product.title}
                  </Link>
                ) : (
                  <span className="font-serif text-[0.98rem] text-[var(--cream)]">
                    Product no longer available
                  </span>
                )}
                <div className="mt-1 text-[0.78rem] font-light text-[var(--muted2)]">
                  Qty {item.quantity} &middot; {formatPriceCents(item.unitPriceCents)} each &middot;{" "}
                  {item.fulfillmentMethod === "PICKUP"
                    ? "Local pickup — no shipping cost"
                    : `${formatPriceCents(item.shippingCostCents)} shipping`}
                </div>
              </div>

              <div className="text-right">
                <div className="mb-2 font-serif text-[1rem] text-[var(--cream)]">
                  {formatPriceCents(lineTotalCents)}
                </div>
                <ShippingStatusBadge status={item.shippingStatus} fulfillmentMethod={item.fulfillmentMethod} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
