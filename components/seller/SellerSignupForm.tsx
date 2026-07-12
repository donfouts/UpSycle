"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type AddressInput,
  REQUIRED_SAMPLE_PHOTOS,
  type SellerSignupInput,
  validateSellerSignup,
} from "@/lib/validation/sellerSignup";

interface PhotoSlot {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

const emptyPhotoSlot: PhotoSlot = {
  file: null,
  previewUrl: null,
  uploadedUrl: null,
  status: "idle",
};

const labelClass =
  "mb-2 block text-[0.65rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)]";
const inputClass =
  "w-full border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-sm text-[var(--cream)] outline-none transition-colors placeholder:text-[rgba(245,237,224,0.3)] focus:border-[var(--rg-core)]";
const sectionClass = "mb-8 border border-[var(--border)] bg-[var(--charcoal)] p-6 md:p-8";
const sectionHeadingClass = "mb-5 font-serif text-xl font-normal text-[var(--cream)]";
const addLinkClass =
  "text-[0.65rem] font-medium uppercase tracking-[0.13em] text-[var(--rg-core)] transition-colors hover:text-[var(--rg-light)]";
const removeBtnClass =
  "shrink-0 border border-[var(--border)] px-3 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-[var(--muted)] transition-colors hover:border-[#e05a5a] hover:text-[#e58a8a]";

interface SellerSignupFormProps {
  // Present when applying from an existing logged-in account — skips the
  // Account section (no new Cognito identity needed) and pre-fills the
  // address from the account's existing default, if any. See
  // app/(seller)/sell/signup/page.tsx.
  existingAccount?: { email: string; defaultAddress?: AddressInput };
}

export default function SellerSignupForm({ existingAccount }: SellerSignupFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [line1, setLine1] = useState(existingAccount?.defaultAddress?.line1 ?? "");
  const [line2, setLine2] = useState(existingAccount?.defaultAddress?.line2 ?? "");
  const [city, setCity] = useState(existingAccount?.defaultAddress?.city ?? "");
  const [state, setState] = useState(existingAccount?.defaultAddress?.state ?? "");
  const [postalCode, setPostalCode] = useState(existingAccount?.defaultAddress?.postalCode ?? "");
  const [country, setCountry] = useState(existingAccount?.defaultAddress?.country ?? "US");

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialMediaUrls, setSocialMediaUrls] = useState<string[]>([""]);
  const [expectedMonthlySales, setExpectedMonthlySales] = useState("");
  const [supplierList, setSupplierList] = useState<string[]>([""]);
  const [referralEmail, setReferralEmail] = useState("");

  const [photos, setPhotos] = useState<PhotoSlot[]>(
    Array.from({ length: REQUIRED_SAMPLE_PHOTOS }, () => ({ ...emptyPhotoSlot })),
  );

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function updateListItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function addListItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function removeListItem(setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) {
    setter((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function uploadPhoto(index: number, file: File) {
    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        throw new Error(presignData?.error ?? "Failed to get an upload URL.");
      }

      const putRes = await fetch(presignData.uploadUrl as string, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("Upload to storage failed.");
      }

      setPhotos((prev) =>
        prev.map((slot, i) =>
          i === index
            ? { ...slot, status: "done", uploadedUrl: presignData.fileUrl as string }
            : slot,
        ),
      );
    } catch (err) {
      setPhotos((prev) =>
        prev.map((slot, i) =>
          i === index
            ? {
                ...slot,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed.",
              }
            : slot,
        ),
      );
    }
  }

  function handlePhotoSelect(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setPhotos((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          uploadedUrl: null,
          status: "uploading",
        };
      }),
    );

    void uploadPhoto(index, file);
  }

  function removePhoto(index: number) {
    setPhotos((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return { ...emptyPhotoSlot };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors([]);

    if (!existingAccount && password !== confirmPassword) {
      setFormErrors(["Password and confirmation password do not match."]);
      return;
    }

    if (photos.some((p) => p.status === "uploading")) {
      setFormErrors(["Please wait for all photos to finish uploading."]);
      return;
    }

    const payload: Partial<SellerSignupInput> = {
      ...(existingAccount ? {} : { email: email.trim(), password }),
      address: {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim() || "US",
      },
      websiteUrl: websiteUrl.trim() || undefined,
      socialMediaUrls: socialMediaUrls.map((s) => s.trim()).filter(Boolean),
      expectedMonthlySales: Number.parseInt(expectedMonthlySales, 10),
      supplierList: supplierList.map((s) => s.trim()).filter(Boolean),
      referralEmail: referralEmail.trim() || undefined,
      samplePhotoUrls: photos.map((p) => p.uploadedUrl ?? ""),
    };

    const errors = validateSellerSignup(payload, { requireCredentials: !existingAccount });
    if (errors.length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sellers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormErrors(data?.errors ?? ["Something went wrong. Please try again."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const email = existingAccount?.email ?? (payload.email as string);
      router.push(`/sell/pending?email=${encodeURIComponent(email)}`);
    } catch {
      setFormErrors(["Network error — please check your connection and try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formErrors.length > 0 && (
        <div className="mb-6 border border-[rgba(224,90,90,0.4)] bg-[rgba(224,90,90,0.08)] p-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#e58a8a]">
            {formErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ACCOUNT */}
      {existingAccount ? (
        <div className={sectionClass}>
          <h2 className={sectionHeadingClass}>Account</h2>
          <p className="text-sm text-[var(--muted2)]">
            Applying as <span className="text-[var(--rg-light)]">{existingAccount.email}</span>. Your
            existing account will also become a seller account — no new login needed.
          </p>
        </div>
      ) : (
        <div className={sectionClass}>
          <h2 className={sectionHeadingClass}>Account</h2>
          <div className="mb-4">
            <label className={labelClass} htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADDRESS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Local Address</h2>
        <div className="mb-4">
          <label className={labelClass} htmlFor="line1">
            Address Line 1 *
          </label>
          <input
            id="line1"
            type="text"
            required
            className={inputClass}
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="123 Main St"
          />
        </div>
        <div className="mb-4">
          <label className={labelClass} htmlFor="line2">
            Address Line 2
          </label>
          <input
            id="line2"
            type="text"
            className={inputClass}
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apt, suite, unit (optional)"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="city">
              City *
            </label>
            <input
              id="city"
              type="text"
              required
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="state">
              State / Province *
            </label>
            <input
              id="state"
              type="text"
              required
              className={inputClass}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="postalCode">
              Postal Code *
            </label>
            <input
              id="postalCode"
              type="text"
              required
              className={inputClass}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="country">
              Country *
            </label>
            <input
              id="country"
              type="text"
              required
              className={inputClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* BUSINESS DETAILS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Your Shop</h2>

        <div className="mb-5">
          <label className={labelClass} htmlFor="websiteUrl">
            Website URL
          </label>
          <input
            id="websiteUrl"
            type="url"
            className={inputClass}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourshop.com"
          />
        </div>

        <div className="mb-5">
          <label className={labelClass}>Social Media Links</label>
          <div className="flex flex-col gap-2">
            {socialMediaUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  className={inputClass}
                  value={url}
                  onChange={(e) => updateListItem(setSocialMediaUrls, index, e.target.value)}
                  placeholder="https://instagram.com/yourshop"
                />
                <button
                  type="button"
                  className={removeBtnClass}
                  onClick={() => removeListItem(setSocialMediaUrls, index)}
                  aria-label="Remove social media link"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`${addLinkClass} mt-2`}
            onClick={() => addListItem(setSocialMediaUrls)}
          >
            + Add another link
          </button>
        </div>

        <div className="mb-5">
          <label className={labelClass} htmlFor="expectedMonthlySales">
            Expected Monthly Sales Volume *
          </label>
          <input
            id="expectedMonthlySales"
            type="number"
            min={1}
            step={1}
            required
            className={inputClass}
            value={expectedMonthlySales}
            onChange={(e) => setExpectedMonthlySales(e.target.value)}
            placeholder="e.g. 25"
          />
        </div>

        <div>
          <label className={labelClass}>Supplier List *</label>
          <p className="mb-2 text-[0.78rem] font-light text-[var(--muted2)]">
            Where do you source your raw or upcycled materials? e.g. &ldquo;Home Depot&rdquo;,
            &ldquo;Hobby Lobby&rdquo;, local salvage yards.
          </p>
          <div className="flex flex-col gap-2">
            {supplierList.map((supplier, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className={inputClass}
                  value={supplier}
                  onChange={(e) => updateListItem(setSupplierList, index, e.target.value)}
                  placeholder="Supplier name"
                />
                <button
                  type="button"
                  className={removeBtnClass}
                  onClick={() => removeListItem(setSupplierList, index)}
                  aria-label="Remove supplier"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`${addLinkClass} mt-2`}
            onClick={() => addListItem(setSupplierList)}
          >
            + Add another supplier
          </button>
        </div>
      </div>

      {/* REFERRAL */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Referral (optional)</h2>
        <div>
          <label className={labelClass} htmlFor="referralEmail">
            Referring Seller&apos;s Email
          </label>
          <input
            id="referralEmail"
            type="email"
            className={inputClass}
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
            placeholder="If an existing seller invited you"
          />
        </div>
      </div>

      {/* SAMPLE PHOTOS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>
          Sample Product Photos <span className="text-[var(--rg-core)]">*</span>
        </h2>
        <p className="mb-4 text-[0.78rem] font-light text-[var(--muted2)]">
          Upload exactly {REQUIRED_SAMPLE_PHOTOS} photos of pieces you&apos;ve made — this is how
          we vet every seller before approval.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {photos.map((slot, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden border border-dashed border-[var(--border)] bg-[var(--panel2)] transition-colors hover:border-[var(--rg-core)]"
            >
              {slot.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL, next/image can't optimize these
                <img
                  src={slot.previewUrl}
                  alt={`Sample photo ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
                  <span className="text-[1.2rem] text-[var(--rg-core)] opacity-60">+</span>
                  <span className="px-1 text-[0.55rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                    Photo {index + 1}
                  </span>
                </div>
              )}

              {slot.status === "idle" && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => handlePhotoSelect(index, e.target.files)}
                  aria-label={`Upload sample photo ${index + 1}`}
                />
              )}

              {slot.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)] text-[0.55rem] uppercase tracking-[0.1em] text-[var(--cream)]">
                  Uploading…
                </div>
              )}

              {slot.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[rgba(0,0,0,0.7)] p-1 text-center text-[0.55rem] text-[#e58a8a]">
                  <span>{slot.error ?? "Upload failed"}</span>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => removePhoto(index)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {slot.status === "done" && (
                <button
                  type="button"
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(0,0,0,0.7)] text-[0.65rem] text-[var(--cream)]"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remove sample photo ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting}>
        {submitting ? "Submitting Application…" : "Submit Application"}
      </button>
    </form>
  );
}
