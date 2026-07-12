"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { MAX_ANSWER_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/validation/question";

export interface ProductQuestionView {
  id: string;
  questionText: string;
  askerFirstName: string | null;
  answerText: string | null;
  answeredAt: string | null;
}

interface ProductQAProps {
  productId: string;
  questions: ProductQuestionView[];
  /** Any logged-in user who isn't the product's own seller. */
  canAsk: boolean;
  /** The product's own (approved) seller, viewing their own listing. */
  canAnswer: boolean;
}

/** Client island dropped into the (server-rendered) product detail page —
 * see app/products/[id]/page.tsx. Public Q&A (issue #16's public-facing
 * half — private buyer<->seller messaging is a separate, later feature). */
export default function ProductQA({ productId, questions, canAsk, canAnswer }: ProductQAProps) {
  const [list, setList] = useState(questions);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !questionText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.errors?.[0] ?? "Failed to submit your question.");
        return;
      }
      setList((prev) => [
        {
          id: data.question.id,
          questionText: data.question.questionText,
          askerFirstName: data.question.askedBy.firstName,
          answerText: null,
          answeredAt: null,
        },
        ...prev,
      ]);
      setQuestionText("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAnswered(questionId: string, answerText: string, answeredAt: string) {
    setList((prev) => prev.map((q) => (q.id === questionId ? { ...q, answerText, answeredAt } : q)));
  }

  return (
    <div className="mt-16 border-t border-[var(--border)] pt-10">
      <h2 className="mb-6 font-serif text-[1.2rem] text-[var(--cream)]">Questions &amp; Answers</h2>

      {canAsk && (
        <form onSubmit={submitQuestion} className="mb-8">
          <label className="sr-only" htmlFor="questionText">
            Ask a question
          </label>
          <textarea
            id="questionText"
            className="form-input"
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ask the seller a question about this item…"
          />
          <div className="mt-3 flex items-center gap-4">
            <button type="submit" disabled={submitting || !questionText.trim()} className="btn-primary">
              {submitting ? "Submitting…" : "Ask Question"}
            </button>
            {error && <span className="text-[0.65rem] text-[#e58a8a]">{error}</span>}
          </div>
        </form>
      )}

      {!canAsk && !canAnswer && (
        <p className="mb-8 text-[0.85rem] text-[var(--muted)]">
          <a href="/login" className="text-[var(--rg-light)] underline underline-offset-4">
            Sign in
          </a>{" "}
          to ask this seller a question.
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-[0.85rem] text-[var(--muted)]">No questions yet.</p>
      ) : (
        <ul className="space-y-6">
          {list.map((q) => (
            <li key={q.id} className="border-b border-[var(--border)] pb-6 last:border-b-0">
              <p className="text-[0.9rem] text-[var(--cream)]">
                <span className="font-medium">Q:</span> {q.questionText}
                <span className="ml-2 text-[0.65rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                  {q.askerFirstName ?? "Buyer"}
                </span>
              </p>

              {q.answerText ? (
                <p className="mt-2 text-[0.9rem] text-[var(--muted2)]">
                  <span className="font-medium text-[var(--cream)]">A:</span> {q.answerText}
                  {q.answeredAt && (
                    <span className="ml-2 text-[0.65rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                      {formatDate(new Date(q.answeredAt))}
                    </span>
                  )}
                </p>
              ) : canAnswer ? (
                <AnswerForm
                  productId={productId}
                  questionId={q.id}
                  onAnswered={(answerText, answeredAt) => handleAnswered(q.id, answerText, answeredAt)}
                />
              ) : (
                <p className="mt-2 text-[0.8rem] italic text-[var(--muted)]">Awaiting a response from the seller.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnswerForm({
  productId,
  questionId,
  onAnswered,
}: {
  productId: string;
  questionId: string;
  onAnswered: (answerText: string, answeredAt: string) => void;
}) {
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !answerText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.errors?.[0] ?? "Failed to submit your answer.");
        return;
      }
      onAnswered(data.question.answerText, data.question.answeredAt);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitAnswer} className="mt-3">
      <label className="sr-only" htmlFor={`answer-${questionId}`}>
        Answer this question
      </label>
      <textarea
        id={`answer-${questionId}`}
        className="form-input"
        rows={2}
        maxLength={MAX_ANSWER_LENGTH}
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        placeholder="Write your answer…"
      />
      <div className="mt-2 flex items-center gap-4">
        <button type="submit" disabled={submitting || !answerText.trim()} className="btn-secondary">
          {submitting ? "Submitting…" : "Post Answer"}
        </button>
        {error && <span className="text-[0.65rem] text-[#e58a8a]">{error}</span>}
      </div>
    </form>
  );
}
