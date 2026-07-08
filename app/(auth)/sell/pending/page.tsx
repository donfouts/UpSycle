import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Under Review — UpSycle Market",
  description: "Your UpSycle Market seller application has been submitted and is pending review.",
};

export default async function SellerPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center md:p-14">
      <div className="eyebrow justify-center before:hidden">Application Received</div>
      <h1 className="sec-title">
        Your shop is <em>under review</em>
      </h1>
      <p className="mx-auto mb-2 max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
        Thanks for applying to sell on UpSycle Market
        {email ? (
          <>
            {" "}
            with <span className="text-[var(--rg-light)]">{email}</span>
          </>
        ) : null}
        . Every seller account is hand-reviewed before it goes live.
      </p>
      <p className="mx-auto mb-10 max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
        Your account status is currently <strong className="text-[var(--rg-light)]">Pending</strong>.
        We&apos;ll email you once an admin has reviewed your sample photos, website/social links,
        and supplier information — most applications are reviewed within a few business days.
        There&apos;s nothing further you need to do right now.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">
          Back to UpSycle Market
        </Link>
        <Link href="/browse" className="btn-secondary">
          Browse the Market
        </Link>
      </div>
    </div>
  );
}
