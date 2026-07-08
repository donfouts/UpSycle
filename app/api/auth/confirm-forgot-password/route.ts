import { NextResponse, type NextRequest } from "next/server";

import { confirmForgotPassword, getCognitoErrorMessage } from "@/lib/cognito";

export const dynamic = "force-dynamic";

interface ConfirmForgotPasswordBody {
  email?: string;
  code?: string;
  newPassword?: string;
}

export async function POST(request: NextRequest) {
  let body: ConfirmForgotPasswordBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, code, newPassword } = body;
  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Email, code, and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    await confirmForgotPassword(email, code, newPassword);
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
