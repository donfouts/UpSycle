import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import StatusBadge, { sellerStatusLabel } from "@/components/admin/StatusBadge";
import AdminDataTable, { type AdminTableColumn, type AdminTableRow } from "@/components/admin/AdminDataTable";

const userColumns: AdminTableColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "roles", label: "Roles" },
  { key: "sellerStatus", label: "Seller Status" },
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users — Admin — UpSycle Market",
};

const RESULT_LIMIT = 50;

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      roles: { select: { role: true } },
      sellerProfile: { select: { approvalStatus: true } },
    },
    orderBy: { createdAt: "desc" },
    take: RESULT_LIMIT,
  });

  const userRows: AdminTableRow[] = users.map((user) => ({
    key: user.id,
    cells: {
      name: { value: [user.firstName, user.lastName].filter(Boolean).join(" ") || "—" },
      email: { value: user.email },
      roles: { value: user.roles.length > 0 ? user.roles.map((r) => r.role).join(", ") : "—" },
      sellerStatus: {
        value: user.sellerProfile ? sellerStatusLabel(user.sellerProfile.approvalStatus) : "—",
        display: user.sellerProfile ? (
          <StatusBadge status={user.sellerProfile.approvalStatus} />
        ) : (
          "—"
        ),
      },
    },
  }));

  return (
    <section>
      <div className="eyebrow">Users</div>
      <h1 className="admin-page-title">User Search</h1>
      <p className="admin-page-sub">
        {query
          ? `${users.length} result${users.length === 1 ? "" : "s"} for "${query}".`
          : `Showing the ${RESULT_LIMIT} most recently created accounts. Search by name or email.`}
      </p>

      <form className="admin-search-form" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search by email or name…"
          className="form-input"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      <AdminDataTable columns={userColumns} rows={userRows} emptyMessage="No users match that search." />
    </section>
  );
}
