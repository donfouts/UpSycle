// Shared validation for product Q&A — imported by both client-side forms
// (for immediate feedback) and the API routes (as the authoritative check),
// same pattern as lib/validation/product.ts.

export const MAX_QUESTION_LENGTH = 1000;
export const MAX_ANSWER_LENGTH = 2000;

export function validateQuestionInput(questionText: unknown): string[] {
  const errors: string[] = [];

  if (typeof questionText !== "string" || !questionText.trim()) {
    errors.push("Question cannot be blank.");
  } else if (questionText.trim().length > MAX_QUESTION_LENGTH) {
    errors.push(`Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
  }

  return errors;
}

export function validateAnswerInput(answerText: unknown): string[] {
  const errors: string[] = [];

  if (typeof answerText !== "string" || !answerText.trim()) {
    errors.push("Answer cannot be blank.");
  } else if (answerText.trim().length > MAX_ANSWER_LENGTH) {
    errors.push(`Answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`);
  }

  return errors;
}
