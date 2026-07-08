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

// Distinct S3 key prefixes for each upload use case, all in the same
// PHOTOS_BUCKET_NAME bucket (see lib/s3.ts / .env.example — a second bucket
// isn't warranted for MVP). Defaults to the original seller-sample-photos
// prefix so existing callers (SellerSignupForm) that don't pass keyPrefix are
// unaffected.
const ALLOWED_KEY_PREFIXES = ["seller-sample-photos", "product-photos", "proof-of-handcrafted"] as const;
type KeyPrefix = (typeof ALLOWED_KEY_PREFIXES)[number];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { fileName, contentType, keyPrefix } = (body ?? {}) as {
    fileName?: unknown;
    contentType?: unknown;
    keyPrefix?: unknown;
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

  let resolvedPrefix: KeyPrefix = "seller-sample-photos";
  if (keyPrefix !== undefined) {
    if (typeof keyPrefix !== "string" || !ALLOWED_KEY_PREFIXES.includes(keyPrefix as KeyPrefix)) {
      return NextResponse.json(
        { error: `keyPrefix must be one of: ${ALLOWED_KEY_PREFIXES.join(", ")}.` },
        { status: 400 },
      );
    }
    resolvedPrefix = keyPrefix as KeyPrefix;
  }

  try {
    const presigned = await createPresignedUpload(fileName, contentType, resolvedPrefix);
    return NextResponse.json(presigned);
  } catch (err) {
    console.error("Failed to create presigned upload URL:", err);
    return NextResponse.json({ error: "Failed to create upload URL." }, { status: 500 });
  }
}
