import { Role } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { getCognitoErrorMessage, signUp } from "@/lib/cognito";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SignupAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface SignupBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address: SignupAddress;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: Partial<SignupBody>): string | null {
  if (!body.email || !EMAIL_RE.test(body.email)) {
    return "Please enter a valid email address.";
  }
  if (!body.password || body.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!body.firstName?.trim()) {
    return "First name is required.";
  }
  if (!body.lastName?.trim()) {
    return "Last name is required.";
  }
  const address = body.address;
  if (!address?.line1?.trim() || !address.city?.trim() || !address.state?.trim() || !address.postalCode?.trim()) {
    return "Please provide a complete shipping address.";
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: Partial<SignupBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { email, password, firstName, lastName, address } = body as SignupBody;

  // 1. Cognito owns the credential — this is the source of truth for
  // whether the account is allowed to exist.
  let userSub: string;
  try {
    const result = await signUp({ email, password, firstName, lastName });
    userSub = result.userSub;
  } catch (err) {
    return NextResponse.json({ error: getCognitoErrorMessage(err) }, { status: 400 });
  }

  // 2. Mirror the minimal profile into Postgres: User + BUYER role +
  // shipping address. Done in a transaction so we never end up with a User
  // row missing its role or address.
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          cognitoSub: userSub,
          email,
          firstName,
          lastName,
        },
      });
      await tx.userRole.create({
        data: { userId: user.id, role: Role.BUYER },
      });
      await tx.address.create({
        data: {
          userId: user.id,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country || "US",
          isDefault: true,
        },
      });
    });
  } catch (err) {
    console.error("Failed to persist buyer profile after Cognito signup", err);
    return NextResponse.json(
      {
        error:
          "Your account was created but we couldn't save your profile. Please contact support before signing in.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email });
}
