import { NextResponse, type NextRequest } from "next/server";

import { getCognitoErrorMessage, resendConfirmationCode } from "@/lib/cognito";

export const dynamic = "force-dynamic";

interface ResendCodeBody {
  email?: string;
}

export async function POST(request: NextRequest) {
  let body: ResendCodeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    await resendConfirmationCode(body.email);
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
