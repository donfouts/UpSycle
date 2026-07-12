import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SellerSignupForm from "@/components/seller/SellerSignupForm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { resolveSellerAuth } from "@/lib/seller-auth";
import type { AddressInput } from "@/lib/validation/sellerSignup";

export const metadata: Metadata = {
  title: "Sell on UpSycle Market — Seller Signup",
  description:
    "Apply to open a shop on UpSycle Market. Every seller is hand-vetted before their shop goes live.",
};

// Always fetched live — branches on the current session (see below).
export const dynamic = "force-dynamic";

export default async function SellerSignupPage() {
  const auth = await resolveSellerAuth();

  // Already a live (approved) seller — nothing to apply for.
  if (auth.ok) {
    redirect("/sell/products");
  }

  // Already applied (pending) or previously suspended — has a SellerProfile
  // already, re-submitting would violate its one-per-user uniqueness.
  if (auth.failure.kind === "not-approved") {
    redirect("/sell/pending");
  }

  // Logged in (as a buyer, most likely) but no SellerProfile yet: skip
  // asking for a new email/password and attach seller-hood to this same
  // account instead — see app/api/sellers/signup/route.ts. Multi-role
  // accounts are an explicit part of the User/UserRole design (see
  // prisma/schema.prisma), just not previously wired up on this form.
  let existingAccount: { email: string; defaultAddress?: AddressInput } | undefined;
  if (auth.failure.kind === "no-seller-profile") {
    const user = await getCurrentUser();
    if (user) {
      const defaultAddress = await prisma.address.findFirst({
        where: { userId: user.id, isDefault: true },
        select: { line1: true, line2: true, city: true, state: true, postalCode: true, country: true },
      });
      existingAccount = {
        email: user.email,
        defaultAddress: defaultAddress
          ? {
              line1: defaultAddress.line1,
              line2: defaultAddress.line2 ?? undefined,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : undefined,
      };
    }
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <div className="eyebrow justify-center before:hidden">Open a Shop</div>
        <h1 className="sec-title">
          Apply to <em>sell your work</em>
        </h1>
        <p className="mx-auto max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
          UpSycle Market hand-vets every seller. Tell us about your work below — your account
          will be created in a pending state until an admin reviews your application.
        </p>
      </div>
      <SellerSignupForm existingAccount={existingAccount} />
    </div>
  );
}
