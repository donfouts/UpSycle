import { NextResponse, type NextRequest } from "next/server";

import { forgotPassword, getCognitoErrorMessage } from "@/lib/cognito";

export const dynamic = "force-dynamic";

interface ForgotPasswordBody {
  email?: string;
}

export async function POST(request: NextRequest) {
  let body: ForgotPasswordBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    await forgotPassword(body.email);
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
