import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";

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

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Seller Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4}>No users match that search.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles.length > 0
                      ? user.roles.map((r) => r.role).join(", ")
                      : "—"}
                  </td>
                  <td>
                    {user.sellerProfile ? (
                      <StatusBadge status={user.sellerProfile.approvalStatus} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
