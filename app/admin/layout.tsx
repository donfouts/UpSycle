import Link from "next/link";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth";

// Every request under /admin runs this layout first — requireAdmin() is the
// actual security boundary (proxy.ts only does a coarse "are you logged in
// at all" check on the Edge runtime; it can't query Postgres for the ADMIN
// role). Logged-out visitors are redirected to /login; logged-in non-admins
// are bounced to the homepage.
export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-label">Admin Panel</div>
          <div className="admin-site">UpSycle Market</div>
        </div>
        <ul className="admin-nav">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 px-6 text-[0.68rem] font-light text-[var(--muted)]">
          Signed in as
          <br />
          <span className="text-[var(--muted2)]">{admin.email}</span>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
