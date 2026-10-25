import "server-only";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import MiniSearch from "minisearch";
import { tokenize, isModelCode, partCore } from "./normalize.mjs";
import { idFromSlug, shardOf } from "./details-shard.mjs";
import { PAGE_SIZE, type Details, type Product, type Query, type Sort, type Store } from "./types";

type Catalog = { builtAt: string; stores: Store[]; products: Product[] };

type Index = {
  catalog: Catalog;
  byId: Map<string, Product>;
  // Store listing id -> product, so links survive a rebuild that regroups listings.
  byListing: Map<string, Product>;
  search: MiniSearch;
  details: Map<string, Promise<Record<string, Details>>>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_FILE = path.join(DATA_DIR, "catalog.json");

const ACCESSORY = new Set(
  "holder bracket case cover stand mount shell box enclosure heatsink cable adapter socket shield expansion handle tip tips cleaner spare replacement".split(" "),
);

let loading: Promise<Index> | null = null;
let loadedMtime = 0;

async function load(): Promise<Index> {
  const catalog: Catalog = JSON.parse(await readFile(CATALOG_FILE, "utf8"));
  const search = new MiniSearch({
    idField: "id",
    fields: ["name", "altNames", "skus", "cores", "categories", "desc"],
    tokenize: (text: string) => tokenize(text),
    processTerm: (term: string) => term,
    searchOptions: {
      boost: { name: 3, altNames: 2, skus: 2, cores: 1.2, categories: 1, desc: 0.4 },
      // Fuzzy matching helps with typos in words, but must not turn lm7805 into lm7806.
      fuzzy: (term: string) => (term.length > 4 && !isModelCode(term) ? 0.2 : false),
      // Prefixes only for words: "5" must not match "5v", nor "lm78" every regulator.
      prefix: (term: string) => term.length > 2 && /^[a-z]+$/.test(term),
    },
  });
  search.addAll(
    catalog.products.map((p) => ({
      id: p.id,
      name: p.name,
      altNames: p.offers.map((o) => o.name).join(" "),
      skus: p.offers.map((o) => o.sku).join(" "),
      cores: [...new Set(p.offers.flatMap((o) => tokenize(o.name).map(partCore)).filter(Boolean))].join(" "),
      categories: [p.group, p.sub ?? "", ...p.categories].join(" "),
      desc: p.desc,
    })),
  );
  return {
    catalog,
    byId: new Map(catalog.products.map((p) => [p.id, p])),
    byListing: new Map(catalog.products.flatMap((p) => p.offers.map((o) => [o.id.replace(":", "-"), p]))),
    search,
    details: new Map(),
  };
}

// Rebuilt catalogs are picked up without a restart: a changed file mtime triggers a reload.
async function getIndex() {
  const { mtimeMs } = await stat(CATALOG_FILE);
  if (mtimeMs !== loadedMtime) {
    loadedMtime = mtimeMs;
    loading = null;
  }
  loading ??= load().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

export async function getStores() {
  const { catalog } = await getIndex();
  return { stores: catalog.stores, builtAt: catalog.builtAt, total: catalog.products.length };
}

function relevant(index: Index, q: string): { product: Product; score: number }[] {
  if (!q.trim()) {
    // Browsing: products carried by more stores first, they're the ones worth comparing.
    return index.catalog.products.map((product) => ({
      product,
      score: product.offers.length + (product.inStock ? 0.5 : 0),
    }));
  }
  // Searching "hc-sr04" should surface the sensor before the brackets made for it.
  const queryTokens = new Set(tokenize(q));
  const accessoryPenalty = (name: string) => {
    let penalty = tokenize(name).some((t) => ACCESSORY.has(t) && !queryTokens.has(t)) ? 0.45 : 1;
    // "LCD for Arduino UNO": the query only names what this item is for.
    const [own, target] = name.split(/\bfor\b/i);
    if (target && ![...queryTokens].some((t) => tokenize(own).includes(t))) penalty *= 0.5;
    return penalty;
  };
  const boostDocument = (id: string) => {
    const p = index.byId.get(id)!;
    return (p.inStock ? 1.25 : 1) * (1 + 0.04 * p.offers.length) * accessoryPenalty(p.name);
  };
  // Each term may also match through its part core, so "lm7805" finds "L7805CV" and "7805".
  const terms = [...queryTokens].map((t) => {
    const core = partCore(t);
    return core ? { combineWith: "OR" as const, queries: [t, core] } : t;
  });
  let hits = index.search.search({ combineWith: "AND", queries: terms }, { boostDocument });
  if (hits.length === 0) hits = index.search.search({ combineWith: "OR", queries: terms }, { boostDocument });
  return hits.map((h) => ({ product: index.byId.get(h.id)!, score: h.score }));
}

function savings(p: Product) {
  return p.offers.length > 1 ? p.maxPrice - p.minPrice : 0;
}

export async function searchProducts(query: Query) {
  const index = await getIndex();
  const matches = relevant(index, query.q);

  const inPrice = (p: Product) =>
    (query.min == null || p.minPrice >= query.min) && (query.max == null || p.minPrice <= query.max);
  const atStores = (p: Product) =>
    query.stores.length === 0 || p.offers.some((o) => query.stores.includes(o.store));
  const base = matches.filter(
    ({ product: p }) => inPrice(p) && (!query.inStock || p.inStock),
  );

  // Facet counts ignore their own filter, so picking one category still shows the others.
  const groupCounts = new Map<string, number>();
  for (const { product } of base) {
    if (atStores(product)) groupCounts.set(product.group, (groupCounts.get(product.group) ?? 0) + 1);
  }
  const storeCounts = new Map<string, number>();
  for (const { product } of base) {
    if (query.group && product.group !== query.group) continue;
    if (query.sub && product.sub !== query.sub) continue;
    for (const s of new Set(product.offers.map((o) => o.store))) {
      storeCounts.set(s, (storeCounts.get(s) ?? 0) + 1);
    }
  }

  const inGroup = base.filter(({ product: p }) => atStores(p) && (!query.group || p.group === query.group));
  const subCounts = new Map<string, number>();
  if (query.group) {
    for (const { product } of inGroup) {
      if (product.sub) subCounts.set(product.sub, (subCounts.get(product.sub) ?? 0) + 1);
    }
  }
  const results = inGroup.filter(({ product: p }) => !query.sub || p.sub === query.sub);

  const by: Record<Sort, (a: (typeof results)[0], b: (typeof results)[0]) => number> = {
    relevance: (a, b) => b.score - a.score,
    "price-asc": (a, b) => a.product.minPrice - b.product.minPrice,
    "price-desc": (a, b) => b.product.minPrice - a.product.minPrice,
    stores: (a, b) => b.product.offers.length - a.product.offers.length || b.score - a.score,
    savings: (a, b) => savings(b.product) - savings(a.product),
  };
  results.sort(by[query.sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  return {
    total: results.length,
    page,
    pages,
    products: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => r.product),
    groups: [...groupCounts].sort((a, b) => b[1] - a[1]),
    // "Other …" last; the rest by size.
    subs: [...subCounts].sort((a, b) => +a[0].startsWith("Other ") - +b[0].startsWith("Other ") || b[1] - a[1]),
    storeCounts: Object.fromEntries(storeCounts),
    stores: index.catalog.stores,
  };
}

/**
 * Resolve a product URL slug. `redirect` is set when the slug is outdated: the name changed, or
 * a rebuild merged this listing into a product with a different id.
 */
export async function getProduct(slug: string): Promise<{ product: Product; redirect: boolean } | null> {
  const id = idFromSlug(slug);
  if (!id) return null;
  const index = await getIndex();
  const product = index.byId.get(id) ?? index.byListing.get(id);
  return product ? { product, redirect: product.slug !== slug } : null;
}

export async function getDetails(id: string): Promise<Details | null> {
  const index = await getIndex();
  const shard = shardOf(id);
  let entries = index.details.get(shard);
  if (!entries) {
    entries = readFile(path.join(DATA_DIR, "details", `${shard}.json`), "utf8")
      .then((text) => JSON.parse(text) as Record<string, Details>)
      .catch(() => ({}));
    index.details.set(shard, entries);
  }
  return (await entries)[id] ?? null;
}

const isAccessory = (name: string) => tokenize(name).some((t) => ACCESSORY.has(t));

/**
 * Related products: alternatives in the same category ranked by shared name terms, and
 * accessories (holders, cases, cables…) that mention this product's part number.
 */
export async function getRelated(product: Product, limit = 8) {
  const index = await getIndex();
  const hits = index.search
    .search(product.name, { combineWith: "OR", fields: ["name", "altNames", "cores"], filter: (h) => h.id !== product.id })
    .map((h) => index.byId.get(h.id)!);

  const models = new Set(tokenize(product.name).filter(isModelCode));
  const selfIsAccessory = isAccessory(product.name);
  const accessories = selfIsAccessory
    ? []
    : hits.filter((p) => isAccessory(p.name) && tokenize(p.name).some((t) => models.has(t))).slice(0, 4);
  const taken = new Set(accessories.map((p) => p.id));

  // Stable sort keeps relevance order within "same subcategory" and "same group".
  const similar = hits
    .filter((p) => p.group === product.group && !taken.has(p.id) && isAccessory(p.name) === selfIsAccessory)
    .sort((a, b) => +(b.sub === product.sub) - +(a.sub === product.sub))
    .slice(0, limit);
  return { similar, accessories };
}

function medianInStockPrice(p: Product) {
  const prices = p.offers.filter((o) => o.inStock).map((o) => o.price).sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

/**
 * Content for the home page. Savings compare the cheapest price with the median across stores,
 * not the most expensive one: an outlier listing (often a mismatch) shouldn't headline the page.
 */
export async function getLanding() {
  const index = await getIndex();
  const { products, stores, builtAt } = index.catalog;

  const groups = new Map<string, { count: number; subs: Map<string, number> }>();
  for (const p of products) {
    const g = groups.get(p.group) ?? groups.set(p.group, { count: 0, subs: new Map() }).get(p.group)!;
    g.count++;
    if (p.sub && !p.sub.startsWith("Other ")) g.subs.set(p.sub, (g.subs.get(p.sub) ?? 0) + 1);
  }

  const comparable = products.filter((p) => p.offers.filter((o) => o.inStock).length >= 3);
  const savings = comparable
    .map((p) => ({ p, save: medianInStockPrice(p) - p.minPrice }))
    .filter(({ p, save }) => save >= 20 && save / medianInStockPrice(p) <= 0.6 && p.images.length > 0)
    .sort((a, b) => b.save - a.save)
    .slice(0, 8)
    .map(({ p }) => p);
  const mostCompared = [...comparable]
    .filter((p) => p.images.length > 0)
    .sort((a, b) => b.offers.length - a.offers.length || a.minPrice - b.minPrice)
    .slice(0, 8);

  return {
    groups: [...groups]
      .filter(([g]) => g !== "Other")
      .sort((a, b) => b[1].count - a[1].count)
      .map(([group, { count, subs }]) => ({
        group,
        count,
        subs: [...subs].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s]) => s),
      })),
    savings,
    mostCompared,
    stores,
    builtAt,
    total: products.length,
    compared: products.filter((p) => p.offers.length > 1).length,
  };
}
