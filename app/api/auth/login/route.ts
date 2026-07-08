import { NextResponse, type NextRequest } from "next/server";

import { getCognitoErrorMessage, signIn } from "@/lib/cognito";
import { setSessionCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const tokens = await signIn(email, password);
    await setSessionCookies(tokens);
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
