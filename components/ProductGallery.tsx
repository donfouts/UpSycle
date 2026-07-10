"use client";

import { useEffect, useState } from "react";

interface Photo {
  id: string;
  url: string;
}

/** Client island dropped into the (server-rendered) product detail page —
 * see app/products/[id]/page.tsx. Renders the main photo + thumbnail strip
 * and a full-size lightbox with prev/next navigation across all photos. */
export default function ProductGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="mb-2 flex aspect-square w-full items-center justify-center bg-[var(--deep)] text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">
        Photo Coming Soon
      </div>
    );
  }

  const [mainPhoto, ...restPhotos] = photos;

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="mb-2 block aspect-square w-full cursor-zoom-in overflow-hidden bg-[var(--deep)]"
        aria-label="View full-size photo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet */}
        <img src={mainPhoto.url} alt={title} className="h-full w-full object-cover" />
      </button>

      {restPhotos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {restPhotos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i + 1)}
              className="aspect-square cursor-zoom-in overflow-hidden bg-[var(--deep)]"
              aria-label={`View photo ${i + 2} of ${photos.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet */}
              <img src={photo.url} alt={title} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — full-size photo viewer`}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-3xl leading-none text-white/80 transition-colors hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
              }}
              className="absolute left-4 text-4xl leading-none text-white/70 transition-colors hover:text-white md:left-8"
              aria-label="Previous photo"
            >
              &#8249;
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet */}
          <img
            src={photos[lightboxIndex].url}
            alt={`${title} — photo ${lightboxIndex + 1} of ${photos.length}`}
            className="max-h-[88vh] max-w-[88vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
              }}
              className="absolute right-4 text-4xl leading-none text-white/70 transition-colors hover:text-white md:right-8"
              aria-label="Next photo"
            >
              &#8250;
            </button>
          )}

          {photos.length > 1 && (
            <div className="absolute bottom-6 text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
              {lightboxIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
