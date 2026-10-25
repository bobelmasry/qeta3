"use client";

import { useState } from "react";
import { ProductImage } from "./product-image";

/**
 * Main image plus thumbnails from every store. Stores often photograph the same part
 * differently, so their pictures are all worth a look. Broken thumbnails remove themselves.
 */
export function ProductGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const working = images.filter((src) => !broken.has(src));
  // The main image starts at the chosen picture and falls back through the rest.
  const order = [images[selected], ...images.filter((_, i) => i !== selected)].filter(Boolean);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
        <ProductImage key={order[0]} srcs={order} />
      </div>
      {working.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) =>
            broken.has(src) ? null : (
              <button
                key={src}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Image ${i + 1}`}
                aria-pressed={i === selected}
                className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${
                  i === selected ? "border-accent" : "border-line hover:border-line-strong"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setBroken((b) => new Set(b).add(src))}
                  className="h-full w-full object-contain p-1"
                />
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
