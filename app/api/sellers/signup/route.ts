// Seller signup: two paths into the same PENDING-approval SellerProfile.
//
// 1. Logged out (or logged in with no session detected): creates a brand
//    new Cognito auth user, then the full set of Postgres rows (User,
//    UserRole, Address, SellerProfile, 5x SellerSamplePhoto, optional
//    SellerReferral).
// 2. Logged in already (as a buyer, most likely): no new Cognito identity —
//    User/UserRole/Address already exist, so this just adds the SELLER role
//    and SellerProfile to the existing account. Multi-role accounts are an
//    explicit part of the User/UserRole design (see prisma/schema.prisma);
//    this endpoint previously always forced a brand-new identity even when
//    the caller already had one.
//
// Cannot be statically rendered — it reads the session and writes to
// Cognito/Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { deleteUnconfirmedUser, signUp } from "@/lib/cognito";
import { type SellerSignupInput, validateSellerSignup } from "@/lib/validation/sellerSignup";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  let body: Partial<SellerSignupInput>;
  try {
    body = (await request.json()) as Partial<SellerSignupInput>;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const errors = validateSellerSignup(body, { requireCredentials: !currentUser });
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // validateSellerSignup has confirmed every required field is present
  // (credentials only when requireCredentials was true, i.e. !currentUser).
  const input = body as SellerSignupInput;

  if (currentUser) {
    return attachSellerToExistingUser(currentUser.id, input);
  }
  return createNewSellerAccount(input);
}

async function attachSellerToExistingUser(userId: string, input: SellerSignupInput) {
  const existingSellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (existingSellerProfile) {
    return NextResponse.json(
      { errors: ["You already have a seller account or application."] },
      { status: 409 },
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const hasSellerRole = await tx.userRole.findUnique({
        where: { userId_role: { userId, role: Role.SELLER } },
      });
      if (!hasSellerRole) {
        await tx.userRole.create({ data: { userId, role: Role.SELLER } });
      }

      // Reuse/update the account's existing default address rather than
      // creating a second isDefault row — the form pre-fills from it (see
      // app/(seller)/sell/signup/page.tsx), so what's submitted here is
      // what the applicant confirmed, not a surprise overwrite.
      const existingDefaultAddress = await tx.address.findFirst({ where: { userId, isDefault: true } });
      const addressData = {
        line1: input.address.line1.trim(),
        line2: input.address.line2?.trim() || null,
        city: input.address.city.trim(),
        state: input.address.state.trim(),
        postalCode: input.address.postalCode.trim(),
        country: input.address.country.trim() || "US",
      };
      if (existingDefaultAddress) {
        await tx.address.update({ where: { id: existingDefaultAddress.id }, data: addressData });
      } else {
        await tx.address.create({ data: { userId, isDefault: true, ...addressData } });
      }

      const samplePhotoUrls = input.samplePhotoUrls.filter((u) => u.trim());

      const sellerProfile = await tx.sellerProfile.create({
        data: {
          userId,
          websiteUrl: input.websiteUrl?.trim() || null,
          socialMediaUrls: input.socialMediaUrls.filter((u) => u.trim()),
          expectedMonthlySales: input.expectedMonthlySales,
          supplierList: input.supplierList.filter((s) => s.trim()),
          approvalStatus: "PENDING",
          samplePhotos: {
            create: samplePhotoUrls.map((url) => ({ url })),
          },
        },
      });

      const referralEmail = input.referralEmail?.trim();
      if (referralEmail) {
        const referrer = await tx.user.findUnique({ where: { email: referralEmail } });
        if (referrer) {
          await tx.sellerReferral.create({
            data: { referrerId: referrer.id, referralId: userId, referralEmail },
          });
        }
      }

      return { userId, sellerProfile };
    });

    return NextResponse.json(
      { userId: created.userId, approvalStatus: created.sellerProfile.approvalStatus },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to attach seller profile to existing user:", err);
    return NextResponse.json(
      { errors: ["Failed to submit your seller application. Please try again."] },
      { status: 500 },
    );
  }
}

async function createNewSellerAccount(input: SellerSignupInput) {
  const email = input.email!.trim();

  // Step 1: create the Cognito user (unconfirmed). This must succeed first —
  // Postgres's User.cognitoSub is required and needs a real sub to store.
  let cognitoSub: string;
  try {
    const result = await signUp({ email, password: input.password! });
    cognitoSub = result.userSub;
  } catch (err) {
    console.error("Cognito signUp failed during seller signup:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { errors: [`Could not create your account: ${message}`] },
      { status: 502 },
    );
  }

  // Step 2: create every Postgres row in one transaction, so a failure
  // partway through (e.g. a duplicate email racing this request) never
  // leaves an orphaned half-created seller — either all rows land or none do.
  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { cognitoSub, email },
      });

      await tx.userRole.create({
        data: { userId: user.id, role: Role.SELLER },
      });

      await tx.address.create({
        data: {
          userId: user.id,
          line1: input.address.line1.trim(),
          line2: input.address.line2?.trim() || null,
          city: input.address.city.trim(),
          state: input.address.state.trim(),
          postalCode: input.address.postalCode.trim(),
          country: input.address.country.trim() || "US",
          isDefault: true,
        },
      });

      const samplePhotoUrls = input.samplePhotoUrls.filter((u) => u.trim());

      const sellerProfile = await tx.sellerProfile.create({
        data: {
          userId: user.id,
          websiteUrl: input.websiteUrl?.trim() || null,
          socialMediaUrls: input.socialMediaUrls.filter((u) => u.trim()),
          expectedMonthlySales: input.expectedMonthlySales,
          supplierList: input.supplierList.filter((s) => s.trim()),
          approvalStatus: "PENDING",
          samplePhotos: {
            create: samplePhotoUrls.map((url) => ({ url })),
          },
        },
      });

      // Referral linkage: the applicant supplies the referring seller's
      // email. If that email doesn't match an existing user (typo, or the
      // referrer hasn't signed up yet), we don't block signup on it — the
      // schema requires a non-null referrerId, so there is nothing valid to
      // link. The referral is simply not recorded in that case.
      const referralEmail = input.referralEmail?.trim();
      if (referralEmail) {
        const referrer = await tx.user.findUnique({ where: { email: referralEmail } });
        if (referrer) {
          await tx.sellerReferral.create({
            data: {
              referrerId: referrer.id,
              referralId: user.id,
              referralEmail,
            },
          });
        }
      }

      return { user, sellerProfile };
    });

    return NextResponse.json(
      { userId: created.user.id, approvalStatus: created.sellerProfile.approvalStatus },
      { status: 201 },
    );
  } catch (err) {
    console.error(
      "Seller signup DB transaction failed after Cognito user creation; rolling back Cognito user:",
      err,
    );
    // Compensating action for the half-completed saga (Cognito succeeded,
    // Postgres didn't): remove the orphaned unconfirmed Cognito user so the
    // applicant can retry with the same email instead of hitting
    // "user already exists".
    await deleteUnconfirmedUser(email);

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { errors: ["An account with this email already exists."] },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { errors: ["Failed to create your seller account. Please try again."] },
      { status: 500 },
    );
  }
}
