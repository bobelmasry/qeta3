import Link from "next/link";
import { Suspense } from "react";
import { getStores } from "@/lib/catalog";
import { SearchBox, SearchBoxFallback } from "./search-controls";
import { Logo, StoreBadge } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Qeta3 home">
          <Logo />
          <span className="hidden leading-none sm:block">
            <span className="block text-[17px] font-bold tracking-tight">
              Qeta3 <span className="font-medium text-faint">قطع</span>
            </span>
            <span className="text-[11px] text-muted">Electronics prices across Egypt</span>
          </span>
        </Link>
        <Suspense fallback={<SearchBoxFallback />}>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <Suspense>
      <Footer />
    </Suspense>
  );
}

async function Footer() {
  const { stores, builtAt, total } = await getStores();
  const updated = new Date(builtAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  });
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_2fr]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[17px] font-bold tracking-tight">Qeta3</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">
            {total.toLocaleString("en")} parts from {stores.length} Egyptian stores, matched so you can compare
            prices in one place.
          </p>
          <p className="text-xs text-faint">
            Prices updated {updated}. Always confirm price and stock on the store&apos;s site.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Stores we compare</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener" className="group flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-hover">
                  <StoreBadge id={s.id} store={s} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:underline">{s.name}</span>
                    <span className="block text-[11px] text-faint">{s.count.toLocaleString("en")} products</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
