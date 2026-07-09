// TEMPORARY diagnostic route to surface the actual runtime error behind the
// 500s on every DB-touching page in the deployed Amplify environment (its
// compute logs aren't reachable via standard CloudWatch APIs). Returns error
// name/message only, never a stack trace or connection string. DELETE before
// treating this deploy as done / before any real domain points here.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  try {
    const count = await prisma.category.count();
    return NextResponse.json({ ok: true, categoryCount: count, hasDatabaseUrl });
  } catch (err) {
    const error = err as { name?: string; message?: string; code?: string };
    return NextResponse.json(
      {
        ok: false,
        hasDatabaseUrl,
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
      },
      { status: 500 },
    );
  }
}
