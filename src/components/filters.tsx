import { Check } from "lucide-react";
import Link from "next/link";
import { hrefFor } from "@/lib/query";
import type { Query, Store } from "@/lib/types";
import { Suspense } from "react";
import { PriceRange } from "./search-controls";
import { StoreBadge } from "./ui";

type Props = {
  query: Query;
  groups: [string, number][];
  subs: [string, number][];
  stores: Store[];
  storeCounts: Record<string, number>;
};

const heading = "mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-faint";

export function Filters({ query, groups, subs, stores, storeCounts }: Props) {
  const toggleStore = (id: string) =>
    hrefFor(query, {
      stores: query.stores.includes(id) ? query.stores.filter((s) => s !== id) : [...query.stores, id],
    });

  return (
    <nav className="space-y-7 text-sm" aria-label="Filters">
      <section>
        <h3 className={heading}>Categories</h3>
        <ul className="space-y-px">
          {groups.map(([g, n]) => {
            const open = query.group === g;
            return (
              <li key={g}>
                <Link
                  href={hrefFor(query, { group: open && !query.sub ? null : g, sub: null })}
                  scroll={false}
                  aria-current={open && !query.sub ? "true" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${
                    open ? "bg-accent-soft font-medium text-accent-strong" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{g}</span>
                  <span className={`text-[11px] tabular-nums ${open ?"" :"text-faint"}`}>{n}</span>
                </Link>
                {open && subs.length > 0 && (
                  <ul className="mb-1 ml-3 mt-0.5 space-y-px border-l border-line pl-2.5">
                    {subs.map(([sub, count]) => {
                      const on = query.sub === sub;
                      return (
                        <li key={sub}>
                          <Link
                            href={hrefFor(query, { sub: on ? null : sub })}
                            scroll={false}
                            aria-current={on ? "true" : undefined}
                            className={`flex gap-2 rounded-md px-2 py-1 ${on ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-ink"}`}
                          >
                            <span className="min-w-0 flex-1 truncate">{sub}</span>
                            <span className="text-[11px] tabular-nums opacity-75">{count}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className={heading}>Price (EGP)</h3>
        <Suspense>
          <PriceRange key={`${query.min}-${query.max}`} />
        </Suspense>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className={heading}>Stores</h3>
          {query.stores.length > 0 && (
            <Link href={hrefFor(query, { stores: [] })} scroll={false} className="px-2 text-xs font-medium text-accent hover:underline">
              Clear
            </Link>
          )}
        </div>
        <ul className="space-y-px">
          {stores.map((s) => {
            const on = query.stores.includes(s.id);
            return (
              <li key={s.id}>
                <Link
                  href={toggleStore(s.id)}
                  scroll={false}
                  role="checkbox"
                  aria-checked={on}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover"
                >
                  <span className="relative">
                    <StoreBadge id={s.id} store={s} size="sm" />
                    {on && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-accent text-white ring-2 ring-surface">
                        <Check className="size-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                  </span>
                  <span className={`min-w-0 flex-1 truncate ${on ? "font-medium" : ""}`}>{s.name}</span>
                  <span className="text-[11px] tabular-nums text-faint">{storeCounts[s.id] ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </nav>
  );
}
