import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import CartPageClient from "@/components/cart/CartPageClient";

// The cart's contents live client-side (localStorage — see lib/cart.ts), but
// the page itself still requires a logged-in buyer per the issue spec, so
// the redirect-gate runs server-side before any cart UI renders. proxy.ts
// also protects this route at the edge (coarse check); this is the
// authoritative check (full Cognito JWT verification).
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/cart");
  }

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="eyebrow">Your Cart</div>
        <h1 className="sec-title">
          Ready to <em>check out?</em>
        </h1>
        <CartPageClient />
      </div>
    </section>
  );
}
