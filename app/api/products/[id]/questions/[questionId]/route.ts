// Seller answers (or re-answers, to fix a typo) a question on their own
// product. Ownership is verified against sellerProfileId before any write —
// same "treat mismatched ownership as not-found" convention as
// app/api/products/[id]/route.ts.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveSellerAuth, sellerAuthErrorResponse } from "@/lib/seller-auth";
import { validateAnswerInput } from "@/lib/validation/question";

interface AnswerQuestionInput {
  answerText?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const { id, questionId } = await params;

  const auth = await resolveSellerAuth();
  if (!auth.ok) {
    return sellerAuthErrorResponse(auth.failure);
  }

  const product = await prisma.product.findUnique({ where: { id }, select: { sellerProfileId: true } });
  if (!product || product.sellerProfileId !== auth.seller.sellerProfileId) {
    return NextResponse.json({ errors: ["Product not found."] }, { status: 404 });
  }

  const existing = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!existing || existing.productId !== id) {
    return NextResponse.json({ errors: ["Question not found."] }, { status: 404 });
  }

  let body: AnswerQuestionInput;
  try {
    body = (await request.json()) as AnswerQuestionInput;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const errors = validateAnswerInput(body.answerText);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const question = await prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        answerText: body.answerText!.trim(),
        answeredById: auth.seller.userId,
        answeredAt: new Date(),
      },
      include: { askedBy: { select: { firstName: true } } },
    });

    return NextResponse.json({ question });
  } catch (err) {
    console.error("Failed to answer product question:", err);
    return NextResponse.json({ errors: ["Failed to submit your answer. Please try again."] }, { status: 500 });
  }
}
