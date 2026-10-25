// Product details (descriptions, specs) are split across shard files so a product page loads one
// small file instead of every description. Shared by the catalog builder and the site.

export const DETAIL_SHARDS = 64;

export function shardOf(productId) {
  let h = 0;
  for (const c of productId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String(h % DETAIL_SHARDS).padStart(2, "0");
}

/** URL slug: the product id, then a readable name ("uge-171327-mean-well-csp-3000-120"). */
export function productSlug(id, name) {
  const words = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-[^-]*$/, (m) => (m.length < 4 ? "" : m));
  return words ? `${id}-${words}` : id;
}

/** The product id at the start of a slug: "<store>-<listing id>". */
export function idFromSlug(slug) {
  return /^[a-z0-9]+-\d+/.exec(slug)?.[0] ?? null;
}
