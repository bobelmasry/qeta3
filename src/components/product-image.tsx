"use client";

import { useEffect, useRef, useState } from "react";

/** Tries each store's image in turn, so one store's broken or blocked image doesn't leave a hole. */
export function ProductImage({ srcs }: { srcs: string[] }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration never fires onError for React; catch it here.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setI((n) => n + 1);
  }, [i]);

  if (i >= srcs.length) {
    return (
      <div className="absolute inset-0 grid place-items-center text-muted" aria-label="No image">
        <svg viewBox="0 0 24 24" className="size-10 opacity-40" aria-hidden>
          <path fill="currentColor" d="M7 2h2v3h2V2h2v3h2V2h2v3h1a2 2 0 0 1 2 2v1h3v2h-3v2h3v2h-3v2h3v2h-3v1a2 2 0 0 1-2 2h-1v3h-2v-3h-2v3h-2v-3H9v3H7v-3H6a2 2 0 0 1-2-2v-1H1v-2h3v-2H1v-2h3v-2H1V8h3V7a2 2 0 0 1 2-2h1V2Zm-1 5v12h12V7H6Z" />
        </svg>
      </div>
    );
  }

  return (
    // Images come from many store domains; plain <img> avoids proxying them all through Next.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      key={srcs[i]}
      src={srcs[i]}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setI((n) => n + 1)}
      className="absolute inset-0 h-full w-full object-contain p-3 transition-transform group-hover:scale-[1.03]"
    />
  );
}
