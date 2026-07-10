"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { centsToDollarsInput, dollarsToCents } from "@/lib/format";
import {
  MAX_PRODUCT_PHOTOS,
  MIN_PRODUCT_PHOTOS,
  type ProductInput,
  validateProductInput,
} from "@/lib/validation/product";

export interface CategoryOption {
  id: string;
  name: string;
  parentName: string;
}

export interface ExistingProduct {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  shippingCostCents: number;
  offersLocalPickup: boolean;
  dimensions: string | null;
  weightGrams: number | null;
  inventoryCount: number;
  categoryId: string;
  proofOfHandcraftedUrl: string;
  photos: { url: string }[];
}

interface UploadSlot {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

const emptySlot: UploadSlot = { file: null, previewUrl: null, uploadedUrl: null, status: "idle" };

const labelClass =
  "mb-2 block text-[0.65rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)]";
const inputClass =
  "w-full border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-sm text-[var(--cream)] outline-none transition-colors placeholder:text-[rgba(245,237,224,0.3)] focus:border-[var(--rg-core)]";
const sectionClass = "mb-8 border border-[var(--border)] bg-[var(--charcoal)] p-6 md:p-8";
const sectionHeadingClass = "mb-5 font-serif text-xl font-normal text-[var(--cream)]";
const addLinkClass =
  "text-[0.65rem] font-medium uppercase tracking-[0.13em] text-[var(--rg-core)] transition-colors hover:text-[var(--rg-light)]";

async function uploadFile(
  file: File,
  keyPrefix: "product-photos" | "proof-of-handcrafted",
  onDone: (url: string) => void,
  onError: (msg: string) => void,
) {
  try {
    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, keyPrefix }),
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

    onDone(presignData.fileUrl as string);
  } catch (err) {
    onError(err instanceof Error ? err.message : "Upload failed.");
  }
}

interface ProductFormProps {
  categories: CategoryOption[];
  /** Present => edit mode (PATCH an existing product); absent => create (POST). */
  product?: ExistingProduct;
}

/**
 * Add/edit product form, shared by app/(seller)/sell/products/new and
 * .../[id]/edit. Handles 2-6 product photo uploads plus the single required
 * proof-of-handcrafted upload (both via the presigned-S3-upload pattern from
 * SellerSignupForm/app/api/upload), dollars<->cents conversion, and
 * client-side validation mirrored from lib/validation/product.ts (the API
 * route re-validates authoritatively).
 */
export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    product ? centsToDollarsInput(product.priceCents) : "",
  );
  const [shippingDollars, setShippingDollars] = useState(
    product ? centsToDollarsInput(product.shippingCostCents) : "",
  );
  const [offersLocalPickup, setOffersLocalPickup] = useState(product?.offersLocalPickup ?? false);
  const [dimensions, setDimensions] = useState(product?.dimensions ?? "");
  const [weightGrams, setWeightGrams] = useState(
    product?.weightGrams != null ? String(product.weightGrams) : "",
  );
  const [inventoryCount, setInventoryCount] = useState(
    product ? String(product.inventoryCount) : "0",
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");

  const [photos, setPhotos] = useState<UploadSlot[]>(() => {
    if (product && product.photos.length > 0) {
      return product.photos.map((p) => ({
        file: null,
        previewUrl: p.url,
        uploadedUrl: p.url,
        status: "done" as const,
      }));
    }
    return Array.from({ length: MIN_PRODUCT_PHOTOS }, () => ({ ...emptySlot }));
  });

  const [proof, setProof] = useState<UploadSlot>(
    product
      ? {
          file: null,
          previewUrl: product.proofOfHandcraftedUrl,
          uploadedUrl: product.proofOfHandcraftedUrl,
          status: "done",
        }
      : { ...emptySlot },
  );

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoSelect(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setPhotos((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file), uploadedUrl: null, status: "uploading" };
      }),
    );

    void uploadFile(
      file,
      "product-photos",
      (url) =>
        setPhotos((prev) =>
          prev.map((s, i) => (i === index ? { ...s, status: "done", uploadedUrl: url } : s)),
        ),
      (msg) =>
        setPhotos((prev) => prev.map((s, i) => (i === index ? { ...s, status: "error", error: msg } : s))),
    );
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      if (prev.length <= MIN_PRODUCT_PHOTOS) {
        // Never drop below the minimum slot count — just clear this one.
        return prev.map((slot, i) => {
          if (i !== index) return slot;
          if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
          return { ...emptySlot };
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function addPhotoSlot() {
    setPhotos((prev) => (prev.length < MAX_PRODUCT_PHOTOS ? [...prev, { ...emptySlot }] : prev));
  }

  function handleProofSelect(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (proof.previewUrl && proof.file) URL.revokeObjectURL(proof.previewUrl);
    setProof({ file, previewUrl: URL.createObjectURL(file), uploadedUrl: null, status: "uploading" });

    void uploadFile(
      file,
      "proof-of-handcrafted",
      (url) => setProof((s) => ({ ...s, status: "done", uploadedUrl: url })),
      (msg) => setProof((s) => ({ ...s, status: "error", error: msg })),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors([]);

    if (photos.some((p) => p.status === "uploading") || proof.status === "uploading") {
      setFormErrors(["Please wait for all uploads to finish."]);
      return;
    }

    const payload: Partial<ProductInput> = {
      title: title.trim(),
      description: description.trim(),
      priceCents: dollarsToCents(priceDollars || "0"),
      shippingCostCents: dollarsToCents(shippingDollars || "0"),
      offersLocalPickup,
      dimensions: dimensions.trim() || undefined,
      weightGrams: weightGrams.trim() ? Number.parseInt(weightGrams, 10) : undefined,
      inventoryCount: Number.parseInt(inventoryCount || "0", 10),
      categoryId,
      proofOfHandcraftedUrl: proof.uploadedUrl ?? "",
      photoUrls: photos.map((p) => p.uploadedUrl ?? ""),
    };

    const errors = validateProductInput(payload);
    if (errors.length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/products/${product!.id}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormErrors(data?.errors ?? ["Something went wrong. Please try again."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push("/sell/products");
      router.refresh();
    } catch {
      setFormErrors(["Network error — please check your connection and try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const groupedCategories = categories.reduce<Record<string, CategoryOption[]>>((acc, cat) => {
    (acc[cat.parentName] ??= []).push(cat);
    return acc;
  }, {});

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

      {/* DETAILS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Product Details</h2>
        <div className="mb-4">
          <label className={labelClass} htmlFor="title">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Desert Bloom Pendant"
          />
        </div>
        <div className="mb-4">
          <label className={labelClass} htmlFor="description">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={5}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes this piece one-of-a-kind?"
          />
        </div>
        <div className="mb-4">
          <label className={labelClass} htmlFor="categoryId">
            Category *
          </label>
          <select
            id="categoryId"
            required
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="" disabled>
              Select a category…
            </option>
            {Object.entries(groupedCategories).map(([parentName, opts]) => (
              <optgroup key={parentName} label={parentName}>
                {opts.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* PRICING & LOGISTICS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Pricing &amp; Logistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="priceDollars">
              Price (USD) *
            </label>
            <input
              id="priceDollars"
              type="number"
              min={0.01}
              step={0.01}
              required
              className={inputClass}
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="45.00"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="shippingDollars">
              Shipping Cost (USD) *
            </label>
            <input
              id="shippingDollars"
              type="number"
              min={0}
              step={0.01}
              required
              className={inputClass}
              value={shippingDollars}
              onChange={(e) => setShippingDollars(e.target.value)}
              placeholder="8.00"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-3 text-[0.85rem] text-[var(--cream)]">
            <input
              type="checkbox"
              checked={offersLocalPickup}
              onChange={(e) => setOffersLocalPickup(e.target.checked)}
            />
            Offer local pickup for this item
          </label>
          <p className="mt-2 text-[0.72rem] font-light text-[var(--muted2)]">
            Buyers will be able to choose pickup instead of shipping at checkout. Your approximate
            city/state (from your seller account) will be shown on the listing — never your full
            address.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="dimensions">
              Dimensions
            </label>
            <input
              id="dimensions"
              type="text"
              className={inputClass}
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder='e.g. 10x8x4 in'
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="weightGrams">
              Weight (grams)
            </label>
            <input
              id="weightGrams"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              placeholder="350"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="inventoryCount">
            Inventory Count *
          </label>
          <input
            id="inventoryCount"
            type="number"
            min={0}
            step={1}
            required
            className={inputClass}
            value={inventoryCount}
            onChange={(e) => setInventoryCount(e.target.value)}
            placeholder="0"
          />
          {isEdit && (
            <p className="mt-2 text-[0.72rem] font-light text-[var(--muted2)]">
              Set inventory directly to this value on save. For quick +/- adjustments without
              opening the edit form, use the controls on the{" "}
              <a href="/sell/products" className="text-[var(--rg-light)] underline">
                product dashboard
              </a>
              .
            </p>
          )}
        </div>
      </div>

      {/* PRODUCT PHOTOS */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>
          Product Photos <span className="text-[var(--rg-core)]">*</span>
        </h2>
        <p className="mb-4 text-[0.78rem] font-light text-[var(--muted2)]">
          Upload {MIN_PRODUCT_PHOTOS}–{MAX_PRODUCT_PHOTOS} photos of this exact item.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {photos.map((slot, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden border border-dashed border-[var(--border)] bg-[var(--panel2)] transition-colors hover:border-[var(--rg-core)]"
            >
              {slot.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob:/S3 preview URL, next/image can't optimize these
                <img
                  src={slot.previewUrl}
                  alt={`Product photo ${index + 1}`}
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
                  aria-label={`Upload product photo ${index + 1}`}
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
                  <button type="button" className="underline" onClick={() => removePhoto(index)}>
                    Retry
                  </button>
                </div>
              )}

              {slot.status === "done" && (
                <button
                  type="button"
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(0,0,0,0.7)] text-[0.65rem] text-[var(--cream)]"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remove product photo ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {photos.length < MAX_PRODUCT_PHOTOS && (
          <button type="button" className={`${addLinkClass} mt-3`} onClick={addPhotoSlot}>
            + Add another photo
          </button>
        )}
      </div>

      {/* PROOF OF HANDCRAFTED */}
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>
          Proof of Handcrafted <span className="text-[var(--rg-core)]">*</span>
        </h2>
        <p className="mb-4 text-[0.78rem] font-light text-[var(--muted2)]">
          A photo proving this item was handmade/upcycled by you — e.g. mid-process,
          in your workspace. Not shown to buyers; used for listing verification.
        </p>
        <div className="relative aspect-video w-full max-w-sm overflow-hidden border border-dashed border-[var(--border)] bg-[var(--panel2)] transition-colors hover:border-[var(--rg-core)]">
          {proof.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob:/S3 preview URL, next/image can't optimize these
            <img
              src={proof.previewUrl}
              alt="Proof of handcrafted"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
              <span className="text-[1.2rem] text-[var(--rg-core)] opacity-60">+</span>
              <span className="px-1 text-[0.55rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                Upload proof
              </span>
            </div>
          )}

          {proof.status === "idle" && (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => handleProofSelect(e.target.files)}
              aria-label="Upload proof of handcrafted"
            />
          )}

          {proof.status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)] text-[0.55rem] uppercase tracking-[0.1em] text-[var(--cream)]">
              Uploading…
            </div>
          )}

          {proof.status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[rgba(0,0,0,0.7)] p-1 text-center text-[0.55rem] text-[#e58a8a]">
              <span>{proof.error ?? "Upload failed"}</span>
              <button
                type="button"
                className="underline"
                onClick={() => setProof({ ...emptySlot })}
              >
                Retry
              </button>
            </div>
          )}

          {proof.status === "done" && (
            <button
              type="button"
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(0,0,0,0.7)] text-[0.65rem] text-[var(--cream)]"
              onClick={() => setProof({ ...emptySlot })}
              aria-label="Remove proof of handcrafted upload"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Listing"}
      </button>
    </form>
  );
}
