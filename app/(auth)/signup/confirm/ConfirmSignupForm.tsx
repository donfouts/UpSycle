"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ConfirmSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.push("/login?confirmed=1");
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email above first.");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not resend the code. Please try again.");
        return;
      }
      setInfo("A new verification code has been sent to your email.");
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="eyebrow">Verify Your Email</div>
      <h1 className="auth-title">Confirm your account</h1>
      <p className="auth-subtitle">
        We sent a verification code to your email. Enter it below to activate your account.
      </p>

      {error && <div className="form-error">{error}</div>}
      {info && <div className="form-success">{info}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="form-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="code">
            Verification Code
          </label>
          <input
            id="code"
            className="form-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", marginTop: "12px" }}
          disabled={loading}
        >
          {loading ? "Confirming…" : "Confirm Account"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        className="btn-secondary"
        style={{ width: "100%", marginTop: "12px" }}
        disabled={resending}
      >
        {resending ? "Sending…" : "Resend Code"}
      </button>

      <p className="auth-footer-link">
        Already confirmed? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
