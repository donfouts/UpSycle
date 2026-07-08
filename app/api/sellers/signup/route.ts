// Seller signup: creates the Cognito auth user, then the full set of
// Postgres rows (User, UserRole, Address, SellerProfile, 5x
// SellerSamplePhoto, optional SellerReferral) as a new PENDING-approval
// seller account.
//
// Cannot be statically rendered — it writes to Cognito/Postgres on every
// request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteUnconfirmedUser, signUp } from "@/lib/cognito";
import { type SellerSignupInput, validateSellerSignup } from "@/lib/validation/sellerSignup";

export async function POST(request: NextRequest) {
  let body: Partial<SellerSignupInput>;
  try {
    body = (await request.json()) as Partial<SellerSignupInput>;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const errors = validateSellerSignup(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // validateSellerSignup has confirmed every required field is present.
  const input = body as SellerSignupInput;
  const email = input.email.trim();

  // Step 1: create the Cognito user (unconfirmed). This must succeed first —
  // Postgres's User.cognitoSub is required and needs a real sub to store.
  let cognitoSub: string;
  try {
    const result = await signUp({ email, password: input.password });
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
