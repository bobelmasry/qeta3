"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Clamps long content with a fade until the reader asks for the rest. */
export function ReadMore({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={open ? "" : "relative max-h-96 overflow-hidden"}>
        {children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        {open ? "Show less" : "Show full description"}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
