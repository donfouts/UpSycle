import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { formatPriceCents } from "@/lib/format";
import ClearCartOnMount from "@/components/checkout/ClearCartOnMount";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

// Best-effort lookup only: Order creation happens asynchronously via the
// Stripe webhook (app/api/webhooks/stripe/route.ts), which may not have run
// yet by the time the buyer's browser is redirected back here. We try to
// find the order for a nicer confirmation; if it's not there yet (or Stripe
// isn't configured — no live keys exist for this MVP pass) we fall back to
// a generic "payment received" message rather than erroring.
async function findOrderForSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) return null;
    return await prisma.order.findFirst({
      where: { stripePaymentId: paymentIntentId },
      include: { items: true },
    });
  } catch (err) {
    console.error("checkout/success: could not resolve order for session", err);
    return null;
  }
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const order = await findOrderForSession(sessionId);

  return (
    <section className="px-6 py-32 md:px-14">
      <ClearCartOnMount />
      <div className="mx-auto max-w-xl text-center">
        <div className="eyebrow justify-center before:hidden">Thank You</div>
        <h1 className="sec-title">
          Payment <em>received</em>
        </h1>

        {order ? (
          <>
            <p className="mb-8 text-[0.92rem] font-light leading-relaxed text-[var(--muted2)]">
              Your order has been placed. Each seller in your order ships their items independently, so you
              may receive separate packages.
            </p>
            <div className="mb-8 border border-[var(--border)] bg-[var(--charcoal)] p-6 text-left">
              <div className="mb-4 flex justify-between text-[0.85rem]">
                <span className="text-[var(--muted)]">Order</span>
                <span className="text-[var(--cream)]">{order.id}</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 text-[0.85rem]">
                    <span className="text-[var(--muted2)]">Qty {item.quantity}</span>
                    <span className="text-[var(--cream)]">
                      {formatPriceCents(item.unitPriceCents * item.quantity + item.shippingCostCents)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 font-semibold">
                <span className="text-[var(--cream)]">Total</span>
                <span className="grad-text">{formatPriceCents(order.totalAmountCents)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mb-8 text-[0.92rem] font-light leading-relaxed text-[var(--muted2)]">
            Your payment was received and is being processed. Your order confirmation will be available on
            your account shortly.
          </p>
        )}

        <Link href="/browse" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
