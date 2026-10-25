"use client";

import { ArrowUpDown, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { hrefFor, parseQuery } from "@/lib/query";
import { SORTS, type Query, type Sort } from "@/lib/types";

function useQueryNav() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const query = parseQuery(Object.fromEntries([...params.keys()].map((k) => [k, params.getAll(k)])));
  const onResults = usePathname() === "/";
  // Refining results replaces the history entry; searching from another page pushes, so Back returns.
  const go = (changes: Partial<Query>) =>
    startTransition(() =>
      onResults
        ? router.replace(hrefFor(query, changes), { scroll: false })
        : router.push(hrefFor(query, changes)),
    );
  return { query, go, pending, onResults };
}

/** Search-as-you-type: the URL (and so the server-rendered results) follows the input. */
export function SearchBox() {
  const { query, go, pending, onResults } = useQueryNav();
  const [value, setValue] = useState(query.q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSent = useRef(query.q);
  const input = useRef<HTMLInputElement>(null);

  // Back/forward navigation changes the URL under us; mirror it into the input.
  useEffect(() => {
    if (query.q !== lastSent.current) {
      lastSent.current = query.q;
      setValue(query.q);
    }
  }, [query.q]);

  // "/" focuses search from anywhere, like most search-first sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = (q: string) => {
    clearTimeout(timer.current);
    lastSent.current = q;
    go({ q });
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        send(value.trim());
      }}
      className="group relative flex-1"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint group-focus-within:text-accent" aria-hidden />
      <input
        ref={input}
        type="search"
        name="q"
        value={value}
        autoFocus={onResults && !query.q}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search parts — esp32, hc-sr04, 10k resistor…"
        aria-label="Search products"
        onChange={(e) => {
          setValue(e.target.value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => send(e.target.value.trim()), 250);
        }}
        className="h-11 w-full rounded-xl border border-line bg-sunken pl-10 pr-12 text-[15px] outline-none transition placeholder:text-faint hover:border-line-strong focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
        {pending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" aria-label="Loading" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              send("");
              input.current?.focus();
            }}
            className="grid size-6 place-items-center rounded-md text-faint hover:bg-hover hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-line-strong px-1.5 font-mono text-[11px] text-faint sm:block">/</kbd>
        )}
      </span>
    </form>
  );
}

export function SearchBoxFallback() {
  return <div className="h-11 flex-1 rounded-xl border border-line bg-sunken" />;
}

/** Min/max price, applied on Enter or when focus leaves the field pair. */
export function PriceRange() {
  const { query, go } = useQueryNav();
  const [min, setMin] = useState(query.min?.toString() ?? "");
  const [max, setMax] = useState(query.max?.toString() ?? "");
  const toNum = (s: string) => (s.trim() && Number.isFinite(+s) ? +s : null);
  const apply = () => {
    if (toNum(min) !== query.min || toNum(max) !== query.max) go({ min: toNum(min), max: toNum(max) });
  };
  const field =
    "h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm tabular-nums outline-none placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15";

  return (
    <form
      className="flex items-center gap-2 px-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) apply();
      }}
    >
      <input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" aria-label="Minimum price (EGP)" className={field} />
      <span className="text-faint">–</span>
      <input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" aria-label="Maximum price (EGP)" className={field} />
      <button type="submit" className="sr-only">Apply price range</button>
    </form>
  );
}

export function Toolbar({ total }: { total: number }) {
  const { query, go } = useQueryNav();

  return (
    <div className="flex items-center gap-3 text-sm">
      <p className="mr-auto hidden text-muted sm:block">
        <span className="font-semibold text-ink tabular-nums">{total.toLocaleString("en")}</span>{" "}
        {total === 1 ? "product" : "products"}
      </p>

      <label className="mr-auto flex cursor-pointer select-none items-center gap-2 py-1 sm:mr-0">
        <span className="relative inline-flex">
          <input
            type="checkbox"
            checked={query.inStock}
            onChange={(e) => go({ inStock: e.target.checked })}
            className="peer sr-only"
          />
          <span className="h-5 w-9 rounded-full bg-line-strong transition peer-checked:bg-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent/20" />
          <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
        In stock
      </label>

      <label className="relative flex h-9 items-center rounded-lg border border-line bg-surface hover:border-line-strong focus-within:border-accent">
        <ArrowUpDown className="pointer-events-none absolute left-2.5 size-3.5 text-faint" aria-hidden />
        <select
          value={query.sort}
          onChange={(e) => go({ sort: e.target.value as Sort })}
          aria-label="Sort by"
          className="h-full appearance-none rounded-lg bg-transparent pl-8 pr-3 outline-none"
        >
          {Object.entries(SORTS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
