import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  // Reuse the buyer's existing Address rows (collected at signup — see
  // app/api/auth/signup/route.ts) rather than building a new address-entry
  // flow for MVP.
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="eyebrow">Checkout</div>
        <h1 className="sec-title">
          Confirm your <em>order</em>
        </h1>
        <CheckoutClient addresses={addresses} />
      </div>
    </section>
  );
}
