import { NextResponse, type NextRequest } from "next/server";

import { confirmSignUp, getCognitoErrorMessage } from "@/lib/cognito";

export const dynamic = "force-dynamic";

interface ConfirmSignupBody {
  email?: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  let body: ConfirmSignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, code } = body;
  if (!email || !code) {
    return NextResponse.json({ error: "Email and confirmation code are required." }, { status: 400 });
  }

  try {
    await confirmSignUp(email, code);
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
