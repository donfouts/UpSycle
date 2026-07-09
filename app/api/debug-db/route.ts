// TEMPORARY diagnostic route, gated behind a one-off shared secret so it
// isn't publicly readable — DELETE before treating this deploy as done.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEBUG_TOKEN = "temp-diag-8f2a91c4-delete-me";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-debug-token") !== DEBUG_TOKEN) {
    return new NextResponse(null, { status: 404 });
  }

  const relevantKeys = [
    "DATABASE_URL",
    "COGNITO_REGION",
    "COGNITO_USER_POOL_ID",
    "COGNITO_USER_POOL_CLIENT_ID",
    "PHOTOS_BUCKET_NAME",
    "AMPLIFY_DIFF_DEPLOY",
  ];
  const presentKeys = relevantKeys.filter((k) => Boolean(process.env[k]));

  try {
    const count = await prisma.category.count();
    return NextResponse.json({ ok: true, categoryCount: count, presentKeys });
  } catch (err) {
    const error = err as { name?: string; message?: string; code?: string };
    return NextResponse.json(
      { ok: false, presentKeys, errorName: error?.name, errorMessage: error?.message, errorCode: error?.code },
      { status: 500 },
    );
  }
}
