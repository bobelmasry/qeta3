import type { Metadata } from "next";
import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Description, Specs, hasProse } from "@/components/description";
import { ProductCard } from "@/components/product-card";
import { ReadMore } from "@/components/read-more";
import { Price, StoreBadge, formatPrice } from "@/components/ui";
import { ProductGallery } from "@/components/product-gallery";
import { getDetails, getProduct, getRelated, getStores } from "@/lib/catalog";
import { hrefFor, parseQuery } from "@/lib/query";
import type { Block, Product, Store } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const found = await getProduct((await params).slug);
  if (!found) return { title: "Product not found — Qeta3" };
  const { product } = found;
  const where = product.offers.length > 1 ? `${product.offers.length} stores` : "1 store";
  return {
    title: `${product.name} — price in Egypt | Qeta3`,
    description: `${product.name}: from ${formatPrice(product.minPrice)} at ${where} in Egypt. ${product.desc}`.slice(0, 300),
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView params={params} />
      </Suspense>
    </main>
  );
}

const categoryHref = (group: string, sub: string | null = null) =>
  hrefFor({ ...parseQuery({}), group, sub });

async function ProductView({ params }: { params: PageProps<"/p/[slug]">["params"] }) {
  const { slug } = await params;
  const found = await getProduct(slug);
  if (!found) notFound();
  if (found.redirect) permanentRedirect(`/p/${found.product.slug}`);
  const { product } = found;

  const [details, related, { stores: storeList }] = await Promise.all([
    getDetails(product.id),
    getRelated(product),
    getStores(),
  ]);
  const stores = new Map(storeList.map((s) => [s.id, s]));
  const blocks = details?.blocks ?? [];
  const inStock = product.offers.filter((o) => o.inStock);
  const comparable = inStock.length > 1;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is escaped for HTML by replacing "<", so names can't close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product, stores)).replace(/</g, "\\u003c") }}
      />

      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3.5 text-faint" />
        <Link href={categoryHref(product.group)} className="hover:text-ink">{product.group}</Link>
        {product.sub && (
          <>
            <ChevronRight className="size-3.5 text-faint" />
            <Link href={categoryHref(product.group, product.sub)} className="hover:text-ink">{product.sub}</Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="min-w-0">
          <div className="lg:sticky lg:top-24">
            <ProductGallery images={product.images} />
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">{product.name}</h1>
          {details?.summary && <p className="mt-3 leading-relaxed text-muted">{details.summary}</p>}

          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-faint">
                  {product.offers.length > 1 ? "Best price" : "Price"}
                </p>
                <Price value={product.minPrice} className="text-4xl font-bold" />
              </div>
              {comparable && product.maxPrice > product.minPrice && (
                <span className="rounded-full bg-copper-soft px-3 py-1 text-sm font-semibold text-copper">
                  Save up to {formatPrice(product.maxPrice - product.minPrice)}
                </span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <span className={`size-2 rounded-full ${inStock.length ? "bg-best" : "bg-warn"}`} />
              {inStock.length > 0
                ? `In stock at ${inStock.length} of ${product.offers.length} ${product.offers.length === 1 ? "store" : "stores"}`
                : `Out of stock at ${product.offers.length === 1 ? "the only store" : `all ${product.offers.length} stores`} carrying it`}
              {comparable && product.maxPrice > product.minPrice && (
                <span className="text-faint">· prices range {formatPrice(product.minPrice)}–{formatPrice(product.maxPrice)}</span>
              )}
            </p>
          </div>

          <h2 className="mb-3 mt-8 text-sm font-semibold">
            Compare {product.offers.length} {product.offers.length === 1 ? "store" : "stores"}
          </h2>
          <ul className="space-y-2">
            {product.offers.map((o, i) => {
              const store = stores.get(o.store);
              const best = i === 0 && comparable;
              return (
                <li key={o.id}>
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener"
                    className={`group flex items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 transition hover:border-line-strong hover:shadow-card sm:px-4 ${
                      best ? "border-accent/50 ring-1 ring-accent/20" : "border-line"
                    } ${o.inStock ? "" : "opacity-60"}`}
                  >
                    <StoreBadge id={o.store} store={store} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {store?.name ?? o.store}
                        {best && <span className="rounded-full bg-accent px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-white">Cheapest</span>}
                      </p>
                      <p className="truncate text-xs text-muted" title={o.name}>{o.name}</p>
                    </div>
                    <div className="text-right">
                      <Price value={o.price} className="text-base font-semibold" />
                      <p className="text-xs">
                        {o.regularPrice && <s className="mr-1.5 text-faint">{formatPrice(o.regularPrice)}</s>}
                        <span className={o.inStock ? "text-best" : "text-warn"}>{o.inStock ? "In stock" : "Out of stock"}</span>
                      </p>
                    </div>
                    <ExternalLink className="hidden size-4 shrink-0 text-faint transition group-hover:text-accent sm:block" aria-label="Opens the store" />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-faint">Prices are copied from each store and may have changed; confirm on the store&apos;s site before buying.</p>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="mt-12 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {hasProse(blocks) && (
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7">
              <h2 className="mb-4 text-lg font-semibold">Description</h2>
              {proseLength(blocks) > 1400 ? (
                <ReadMore>
                  <Description blocks={blocks} />
                </ReadMore>
              ) : (
                <Description blocks={blocks} />
              )}
            </section>
          )}
          {blocks.some((b) => b.t === "spec") && (
            <section className={`rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7 ${hasProse(blocks) ? "" : "lg:col-span-2"}`}>
              <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
              <Specs blocks={blocks} />
            </section>
          )}
          {details && (
            <p className="text-xs text-faint lg:col-span-2">
              Description from{" "}
              <a href={details.url} target="_blank" rel="noopener" className="underline hover:text-ink">
                {stores.get(details.from)?.name ?? details.from}
              </a>
              .
            </p>
          )}
        </div>
      )}

      <RelatedSection title="Accessories" products={related.accessories} stores={stores} />
      <RelatedSection title="Similar products" products={related.similar} stores={stores} />
    </>
  );
}

const proseLength = (blocks: Block[]) => blocks.reduce((n, b) => n + (b.t === "spec" ? 0 : b.text.length), 0);

function RelatedSection({ title, products, stores }: { title: string; products: Product[]; stores: Map<string, Store> }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} stores={stores} />
        ))}
      </div>
    </section>
  );
}

function jsonLd(product: Product, stores: Map<string, Store>) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.desc || undefined,
    category: [product.group, product.sub].filter(Boolean).join(" > "),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EGP",
      lowPrice: product.minPrice,
      highPrice: product.maxPrice,
      offerCount: product.offers.length,
      offers: product.offers.map((o) => ({
        "@type": "Offer",
        url: o.url,
        price: o.price,
        priceCurrency: "EGP",
        availability: `https://schema.org/${o.inStock ? "InStock" : "OutOfStock"}`,
        seller: { "@type": "Organization", name: stores.get(o.store)?.name ?? o.store },
      })),
    },
  };
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" aria-busy>
      <div className="aspect-square animate-pulse rounded-xl bg-hover" />
      <div className="space-y-3">
        <div className="h-8 w-3/4 animate-pulse rounded bg-hover" />
        <div className="h-4 w-full animate-pulse rounded bg-hover" />
        <div className="h-10 w-40 animate-pulse rounded bg-hover" />
        <div className="h-48 animate-pulse rounded-xl bg-hover" />
      </div>
    </div>
  );
}
