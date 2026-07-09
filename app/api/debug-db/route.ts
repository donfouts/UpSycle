// TEMPORARY diagnostic route, gated behind a one-off shared secret so it
// isn't publicly readable — DELETE before treating this deploy as done.
export const dynamic = "force-dynamic";

import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEBUG_TOKEN = "temp-diag-8f2a91c4-delete-me";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-debug-token") !== DEBUG_TOKEN) {
    return new NextResponse(null, { status: 404 });
  }

  const cwd = process.cwd();
  let fileCheck: unknown;
  try {
    const configPath = path.join(cwd, "generated-runtime-config.json");
    const exists = fs.existsSync(configPath);
    const raw = exists ? fs.readFileSync(configPath, "utf-8") : null;
    fileCheck = { configPath, exists, hasContent: Boolean(raw), parsedHasUrl: raw ? Boolean(JSON.parse(raw).databaseUrl) : null };
  } catch (err) {
    fileCheck = { error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const count = await prisma.category.count();
    return NextResponse.json({ ok: true, categoryCount: count, cwd, fileCheck, hasDatabaseUrl: Boolean(process.env.DATABASE_URL) });
  } catch (err) {
    const error = err as { name?: string; message?: string };
    return NextResponse.json(
      { ok: false, cwd, fileCheck, hasDatabaseUrl: Boolean(process.env.DATABASE_URL), errorName: error?.name, errorMessage: error?.message },
      { status: 500 },
    );
  }
}
