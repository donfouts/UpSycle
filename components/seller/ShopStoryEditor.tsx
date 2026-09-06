"use client";

import { useState } from "react";
import { MAX_STORY_LENGTH } from "@/lib/validation/sellerSignup";

const labelClass =
  "mb-2 block text-[0.65rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)]";
const textareaClass =
  "w-full border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-sm text-[var(--cream)] outline-none transition-colors placeholder:text-[rgba(245,237,224,0.3)] focus:border-[var(--rg-core)]";

export default function ShopStoryEditor({ initialStory }: { initialStory: string }) {
  const [story, setStory] = useState(initialStory);
  const [saved, setSaved] = useState(initialStory);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/sellers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.errors?.[0] ?? "Failed to save your story.");
        return;
      }
      setSaved(data.story ?? "");
      setSuccess(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <label className={labelClass} htmlFor="shop-story">
        Your Story
      </label>
      <p className="mb-2 text-[0.78rem] font-light text-[var(--muted2)]">
        Shown on your public shop page, under your shop name.
      </p>
      <textarea
        id="shop-story"
        rows={6}
        maxLength={MAX_STORY_LENGTH}
        className={textareaClass}
        value={story}
        onChange={(e) => {
          setStory(e.target.value);
          setSuccess(false);
        }}
        placeholder="I've been upcycling reclaimed wood into furniture since..."
      />
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSave}
          disabled={pending || story === saved}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {success && <span className="text-[0.75rem] text-[var(--success)]">Saved.</span>}
        {error && <span className="text-[0.75rem] text-[#e58a8a]">{error}</span>}
      </div>
    </div>
  );
}
