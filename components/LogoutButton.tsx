"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "btn-secondary" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" className={className} onClick={handleLogout} disabled={loading}>
      {loading ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
