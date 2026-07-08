"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";
  const justConfirmed = searchParams.get("confirmed") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="eyebrow">Welcome Back</div>
      <h1 className="auth-title">Sign in to your account</h1>
      <p className="auth-subtitle">Access your orders, addresses, and saved pieces.</p>

      {justConfirmed && <div className="form-success">Your account is confirmed. Please sign in.</div>}
      {justReset && <div className="form-success">Your password has been reset. Please sign in.</div>}
      {error && <div className="form-error">{error}</div>}

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
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="form-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", marginTop: "12px" }}
          disabled={loading}
        >
          {loading ? "Signing In…" : "Sign In"}
        </button>
      </form>

      <p className="auth-footer-link">
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="auth-footer-link">
        New to UpSycle? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
