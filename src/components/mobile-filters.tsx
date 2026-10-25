"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/** Full-screen filter sheet for small screens; closes itself once a filter is applied. */
export function MobileFilters({ active, total, children }: { active: number; total: number; children: ReactNode }) {
  // Remember which URL the sheet was opened on; applying a filter changes the URL and closes it.
  const params = useSearchParams().toString();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === params;
  const setOpen = (o: boolean) => setOpenedAt(o ? params : null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {active > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-white">{active}</span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface lg:hidden" role="dialog" aria-modal aria-label="Filters">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-base font-semibold">Filters</p>
            <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-hover" aria-label="Close filters">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
          <div className="border-t border-line p-4">
            <button type="button" onClick={() => setOpen(false)} className="h-11 w-full rounded-xl bg-accent font-medium text-white hover:bg-accent-strong">
              Show {total.toLocaleString("en")} {total === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
