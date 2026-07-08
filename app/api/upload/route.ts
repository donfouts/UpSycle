// Issues a presigned S3 PUT URL for a single seller sample-photo upload.
// The client uploads the file bytes directly to S3 using the returned
// `uploadUrl`, then submits the returned `fileUrl` to /api/sellers/signup.
//
// Cannot be statically rendered/prerendered — it calls out to AWS on every
// request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/s3";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { fileName, contentType } = (body ?? {}) as {
    fileName?: unknown;
    contentType?: unknown;
  };

  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json({ error: "fileName is required." }, { status: 400 });
  }

  if (typeof contentType !== "string" || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}.` },
      { status: 400 },
    );
  }

  try {
    const presigned = await createPresignedUpload(fileName, contentType);
    return NextResponse.json(presigned);
  } catch (err) {
    console.error("Failed to create presigned upload URL:", err);
    return NextResponse.json({ error: "Failed to create upload URL." }, { status: 500 });
  }
}
