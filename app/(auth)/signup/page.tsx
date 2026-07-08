"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const initialState: FormState = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          address: {
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.push(`/signup/confirm?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="eyebrow">Join UpSycle</div>
      <h1 className="auth-title">Create your buyer account</h1>
      <p className="auth-subtitle">
        Sign up to discover one-of-a-kind handmade and upcycled pieces from independent artists.
      </p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              className="form-input"
              type="text"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              className="form-input"
              type="text"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </div>
        </div>

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
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              className="form-input"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </div>
        </div>
        <p className="form-hint">At least 8 characters, including uppercase, lowercase, and a number.</p>

        <div className="form-group">
          <label className="form-label" htmlFor="line1">
            Address Line 1
          </label>
          <input
            id="line1"
            className="form-input"
            type="text"
            autoComplete="address-line1"
            required
            value={form.line1}
            onChange={(e) => update("line1", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="line2">
            Address Line 2 (Optional)
          </label>
          <input
            id="line2"
            className="form-input"
            type="text"
            autoComplete="address-line2"
            value={form.line2}
            onChange={(e) => update("line2", e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className="form-input"
              type="text"
              autoComplete="address-level2"
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="state">
              State
            </label>
            <input
              id="state"
              className="form-input"
              type="text"
              autoComplete="address-level1"
              required
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="postalCode">
              Postal Code
            </label>
            <input
              id="postalCode"
              className="form-input"
              type="text"
              autoComplete="postal-code"
              required
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              className="form-input"
              type="text"
              autoComplete="country"
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: "100%", marginTop: "12px" }}
          disabled={loading}
        >
          {loading ? "Creating Account…" : "Create Account"}
        </button>
      </form>

      <p className="auth-footer-link">
        Already have an account? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
