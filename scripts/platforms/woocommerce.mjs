// WooCommerce stores expose a public Store API that returns products as JSON.
import { get, pool, stripTags, decodeEntities, htmlToBlocks } from "../lib.mjs";

const PER_PAGE = 100;

function money(raw, minor) {
  return raw == null || raw === "" ? null : Number(raw) / 10 ** minor;
}

// Pick the srcset candidate closest to 300px wide, falling back to the thumbnail.
function pickImage(img) {
  if (!img) return null;
  const sizes = (img.srcset ?? "")
    .split(",")
    .map((s) => s.trim().split(/\s+/))
    .filter(([u, w]) => u && w?.endsWith("w"))
    .map(([u, w]) => ({ u, w: parseInt(w) }));
  const good = sizes.filter((s) => s.w >= 250).sort((a, b) => a.w - b.w)[0];
  return good?.u ?? img.thumbnail ?? img.src;
}

function toItem(store, p) {
  const minor = p.prices.currency_minor_unit;
  const range = p.prices.price_range;
  const price = money(range ? range.min_amount : p.prices.price, minor);
  const regular = money(p.prices.regular_price, minor);
  return {
    id: `${store.id}:${p.id}`,
    store: store.id,
    name: decodeEntities(p.name).trim(),
    sku: p.sku || "",
    url: p.permalink,
    image: pickImage(p.images?.[0]),
    price: price || null,
    regularPrice: regular && price && regular > price ? regular : null,
    inStock: p.is_in_stock,
    categories: (p.categories ?? []).map((c) => decodeEntities(c.name)),
    desc: stripTags(p.short_description || "").slice(0, 600),
    blocks: htmlToBlocks(p.description),
  };
}

export async function scrape(store, log) {
  const api = `${store.url}/wp-json/wc/store/v1/products`;
  const first = await get(`${api}?per_page=${PER_PAGE}&page=1`, { json: true });
  const pages = Number(first.headers.get("x-wp-totalpages")) || 1;
  log(`${first.headers.get("x-wp-total")} products over ${pages} pages`);

  const rest = await pool(
    Array.from({ length: pages - 1 }, (_, i) => i + 2),
    2,
    500,
    async (page) => (await get(`${api}?per_page=${PER_PAGE}&page=${page}`, { json: true })).body,
  );
  const items = [first.body, ...rest].flat().map((p) => toItem(store, p));
  return [...new Map(items.map((i) => [i.id, i])).values()];
}
