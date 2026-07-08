import type { Metadata } from "next";
import SellerSignupForm from "@/components/seller/SellerSignupForm";

export const metadata: Metadata = {
  title: "Sell on UpSycle Market — Seller Signup",
  description:
    "Apply to open a shop on UpSycle Market. Every seller is hand-vetted before their shop goes live.",
};

export default function SellerSignupPage() {
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
      <SellerSignupForm />
    </div>
  );
}
