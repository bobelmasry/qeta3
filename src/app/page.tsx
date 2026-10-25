import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Filters } from "@/components/filters";
import { MobileFilters } from "@/components/mobile-filters";
import { ProductCard } from "@/components/product-card";
import { Toolbar } from "@/components/search-controls";
import { StoreBadge } from "@/components/ui";
import { getLanding, searchProducts } from "@/lib/catalog";
import { hrefFor, parseQuery } from "@/lib/query";
import type { Product, Query, Store } from "@/lib/types";

const POPULAR = ["ESP32", "Arduino Uno", "HC-SR04", "Raspberry Pi 5", "18650 battery", "Soldering iron", "Multimeter", "Relay module", "OLED display", "Servo motor"];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

const isBrowsing = (q: Query) =>
  !q.q && !q.group && q.stores.length === 0 && !q.inStock && q.min == null && q.max == null && q.sort === "relevance" && q.page === 1;

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const query = parseQuery(await searchParams);
  return isBrowsing(query) ? <Landing /> : <Results query={query} />;
}

// ---------- landing ----------

async function Landing() {
  const data = await getLanding();
  const stores = new Map(data.stores.map((s) => [s.id, s]));
  const browse = parseQuery({});

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
            <span className="size-1.5 rounded-full bg-accent" />
            {data.stores.length} stores · {data.total.toLocaleString("en")} parts · {data.compared.toLocaleString("en")} price-matched
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Find any part.
            <br />
            <span className="text-accent">Pay the lowest price</span> in Egypt.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            We match the same component across Egypt&apos;s electronics stores, so you see every price side by side
            before you buy.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {POPULAR.map((q) => (
              <Link
                key={q}
                href={hrefFor(browse, { q })}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium shadow-card transition hover:border-accent hover:text-accent"
              >
                {q}
              </Link>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {data.stores.map((s) => (
                <StoreBadge key={s.id} id={s.id} store={s} />
              ))}
            </div>
            <p className="hidden text-sm text-muted sm:block">UGE, RAM, Makers, Free Electronic and {data.stores.length - 4} more</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12">
        <section>
          <SectionHeading title="Browse by category" href={hrefFor(browse, { sort: "stores" })} link="All products" />
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.groups.map(({ group, count, subs }) => (
              <Link
                key={group}
                href={hrefFor(browse, { group })}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold leading-snug group-hover:text-accent">{group}</span>
                  <span className="text-xs text-faint">{count.toLocaleString("en")}</span>
                </span>
                <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{subs.join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>

        <ProductRow
          title="Biggest savings right now"
          subtitle="In stock at 3+ stores, cheapest vs. the typical price"
          products={data.savings}
          stores={stores}
          href={hrefFor(browse, { sort: "savings", inStock: true })}
        />
        <ProductRow
          title="Compared across the most stores"
          subtitle="The everyday parts every shop carries"
          products={data.mostCompared}
          stores={stores}
          href={hrefFor(browse, { sort: "stores" })}
        />
      </div>
    </main>
  );
}

function SectionHeading({ title, subtitle, href, link }: { title: string; subtitle?: string; href: string; link: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline">
        {link} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function ProductRow(props: { title: string; subtitle: string; products: Product[]; stores: Map<string, Store>; href: string }) {
  if (props.products.length === 0) return null;
  return (
    <section>
      <SectionHeading title={props.title} subtitle={props.subtitle} href={props.href} link="See all" />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {props.products.map((p) => (
          <div key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} stores={props.stores} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- results ----------

async function Results({ query }: { query: Query }) {
  const res = await searchProducts(query);
  const stores = new Map(res.stores.map((s) => [s.id, s]));
  const activeFilters = (query.group ? 1 : 0) + query.stores.length + (query.inStock ? 1 : 0) + (query.min != null || query.max != null ? 1 : 0);

  const filters = (
    <Filters query={query} groups={res.groups} subs={res.subs} stores={res.stores} storeCounts={res.storeCounts} />
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
      <aside className="scrollbar-none sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 overflow-y-auto pb-6 lg:block">
        {filters}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-5">
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Home</Link>
            {query.group && (
              <>
                <span className="text-faint">/</span>
                <Link href={hrefFor(query, { sub: null })} className="hover:text-ink">{query.group}</Link>
              </>
            )}
          </nav>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {query.q ? (
                <>
                  Results for <span className="text-accent">“{query.q}”</span>
                </>
              ) : (
                (query.sub ?? query.group ?? "All products")
              )}
            </h1>
            <p className="mt-1 text-sm text-muted sm:hidden">
              {res.total.toLocaleString("en")} {res.total === 1 ? "product" : "products"}
            </p>
          </div>

          {query.group && res.subs.length > 1 && (
            <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
              <Chip href={hrefFor(query, { sub: null })} active={!query.sub} label="All" />
              {res.subs.map(([sub, n]) => (
                <Chip key={sub} href={hrefFor(query, { sub: query.sub === sub ? null : sub })} active={query.sub === sub} label={sub} count={n} />
              ))}
            </div>
          )}
        </header>

        <div className="sticky top-[61px] z-10 -mx-4 mb-4 border-b border-line bg-background/90 px-4 py-2.5 backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="flex items-center gap-3">
            <MobileFilters active={activeFilters} total={res.total}>
              {filters}
            </MobileFilters>
            <div className="min-w-0 flex-1">
              <Toolbar key={hrefFor(query)} total={res.total} />
            </div>
          </div>
        </div>

        {res.products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <p className="text-lg font-semibold">No products found</p>
            <p className="mt-1 text-sm text-muted">Try fewer words, a part number like “LM7805”, or clear the filters.</p>
            <Link
              href={hrefFor({ ...query, group: null, sub: null, stores: [], inStock: false, min: null, max: null })}
              className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {res.products.map((p) => (
              <ProductCard key={p.id} product={p} stores={stores} />
            ))}
          </div>
        )}

        {res.pages > 1 && <Pagination query={query} page={res.page} pages={res.pages} />}
      </div>
    </main>
  );
}

function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-accent bg-accent font-medium text-white"
          : "border-line bg-surface text-ink hover:border-accent/50 hover:text-accent"
      }`}
    >
      {label}
      {count != null && <span className={`ml-1.5 text-xs ${active ?"text-white/75" :"text-faint"}`}>{count}</span>}
    </Link>
  );
}

function Pagination({ query, page, pages }: { query: Query; page: number; pages: number }) {
  // First, last, and a window around the current page.
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const btn ="grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm";
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={hrefFor(query, { page: page - 1 })} className={`${btn} border border-line bg-surface font-sans hover:bg-hover`}>
          Previous
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-faint">…</span>}
          <Link
            href={hrefFor(query, { page: n })}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${n === page ? "bg-ink text-surface" : "border border-line bg-surface hover:bg-hover"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={hrefFor(query, { page: page + 1 })} className={`${btn} border border-line bg-surface font-sans hover:bg-hover`}>
          Next
        </Link>
      )}
    </nav>
  );
}

function ResultsSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6" aria-busy>
      <aside className="hidden w-60 shrink-0 space-y-2 lg:block">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="h-7 animate-pulse rounded-lg bg-hover" />
        ))}
      </aside>
      <div className="flex-1">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-hover" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[3/4.4] animate-pulse rounded-2xl bg-hover" />
          ))}
        </div>
      </div>
    </main>
  );
}
