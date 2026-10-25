import type { CSSProperties } from "react";
import type { Store } from "@/lib/types";

const egp = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 });

/** "1,250 EGP": number in the tabular mono face, currency de-emphasized. */
export function Price({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tabular-nums tracking-tight ${className}`}>
      {egp.format(value)}
      <span className="ml-1 font-sans text-[0.7em] font-medium text-muted">EGP</span>
    </span>
  );
}

export const formatPrice = (n: number) => `${egp.format(n)} EGP`;

function storeHue(id: string) {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** Colored monogram for a store, the same color everywhere. */
export function StoreBadge({ id, store, size = "md" }: { id: string; store?: Store; size?: "sm" | "md" }) {
  return (
    <span
      title={store?.name ?? id}
      style={{ "--h": storeHue(id) } as CSSProperties}
      className={`store-badge inline-grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-surface ${
        size === "sm" ? "size-6 text-[9px]" : "size-8 text-[11px]"
      }`}
    >
      {store?.badge ?? id.slice(0, 2).toUpperCase()}
    </span>
  );
}

/** The site mark: a little IC package. */
export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)" />
      <rect x="9" y="9" width="14" height="14" rx="2.5" fill="none" stroke="white" strokeWidth="2" />
      {[12, 16, 20].map((p) => (
        <g key={p} stroke="white" strokeWidth="1.8" strokeLinecap="round">
          <path d={`M${p} 5.5v3.5M${p} 23v3.5M5.5 ${p}h3.5M23 ${p}h3.5`} />
        </g>
      ))}
      <circle cx="12.5" cy="12.5" r="1.3" fill="white" />
    </svg>
  );
}
