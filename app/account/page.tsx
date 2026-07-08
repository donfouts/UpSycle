import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";

export const dynamic = "force-dynamic";

// Minimal protected page — mostly a smoke test that the Cognito-backed
// session (middleware.ts + lib/session.ts + lib/verify-token.ts) actually
// gates access end-to-end. Real account/order management is out of scope
// for issues #6/#7.
export default async function AccountPage() {
  const idToken = await getIdToken();
  if (!idToken) {
    redirect("/login?redirectTo=/account");
  }

  let email: string | undefined;
  try {
    const claims = await verifyIdToken(idToken);
    email = typeof claims.email === "string" ? claims.email : undefined;
  } catch {
    redirect("/login?redirectTo=/account");
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-32">
      <div className="eyebrow">My Account</div>
      <h1 className="auth-title">Welcome back{email ? `, ${email}` : ""}</h1>
      <p className="auth-subtitle">You are signed in to UpSycle Market.</p>
      <div className="mb-8">
        <Link href="/account/orders" className="btn-secondary">
          View Order History
        </Link>
      </div>
      <LogoutButton />
    </section>
  );
}
