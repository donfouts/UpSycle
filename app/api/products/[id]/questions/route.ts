// Ask a public question about a product (issue #16, public-Q&A scope only —
// private buyer<->seller messaging remains Phase 2 backlog, see
// prisma/schema.prisma). Any logged-in user may ask; the product's seller
// answers via PATCH [id]/questions/[questionId].
//
// Cannot be statically rendered — it reads the session and writes to
// Postgres on every request.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { validateQuestionInput } from "@/lib/validation/question";

interface AskQuestionInput {
  questionText?: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ errors: ["Please sign in to ask a question."] }, { status: 401 });
  }

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ errors: ["Product not found."] }, { status: 404 });
  }

  let body: AskQuestionInput;
  try {
    body = (await request.json()) as AskQuestionInput;
  } catch {
    return NextResponse.json({ errors: ["Request body must be valid JSON."] }, { status: 400 });
  }

  const errors = validateQuestionInput(body.questionText);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const question = await prisma.productQuestion.create({
      data: {
        productId: id,
        askedById: user.id,
        questionText: body.questionText!.trim(),
      },
      include: { askedBy: { select: { firstName: true } } },
    });

    return NextResponse.json({ question });
  } catch (err) {
    console.error("Failed to create product question:", err);
    return NextResponse.json({ errors: ["Failed to submit your question. Please try again."] }, { status: 500 });
  }
}
