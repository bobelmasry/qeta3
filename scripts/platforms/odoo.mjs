// Odoo website_sale stores; products are parsed from the paginated /shop HTML grid.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, get, pool, save, stripTags, decodeEntities, htmlToBlocks } from "../lib.mjs";

function lastPage(html) {
  const pages = [...html.matchAll(/href="[^"]*\/page\/(\d+)"/g)].map((m) => +m[1]);
  return Math.max(1, ...pages);
}

function parseCards(store, html) {
  const BASE = store.url;
  const cards = html.split('class="oe_product_cart').slice(1);
  const items = cards.map((c) => {
    // Category pages append "?category=NN" to product links; the product itself is the bare path.
    const link = c.match(/itemprop="name" href="([^"]+)"/)?.[1] ?? c.match(/href="(\/shop\/[^"]+)"/)[1];
    const href = link.split(/[?#]/)[0];
    const tmplId = href.match(/-(\d+)$/)?.[1];
    if (!tmplId) return null;
    const name = decodeEntities(c.match(/itemprop="name"[^>]*>([^<]*)</)[1]).trim();
    const alt = decodeEntities(c.match(/alt="([^"]*)"/)?.[1] ?? "");
    const sku = alt.match(/^\[([^\]]+)\]/)?.[1] ?? "";
    const img = c.match(/<img src="([^"]+)"/)?.[1];
    const price = Number(c.match(/itemprop="price"[^>]*>([\d.]+)</)?.[1]);
    const strike = c.match(/text-decoration-line-through[^>]*>\s*<span class="oe_currency_value">([\d,.]+)/)?.[1];
    const desc = c.match(/itemprop="description">([\s\S]*?)<\/div>/)?.[1] ?? "";
    const ribbon = c.match(/class="o_ribbon[^"]*"[^>]*>([^<]*)</)?.[1] ?? "";
    return {
      id: `${store.id}:${tmplId}`,
      store: store.id,
      name,
      sku,
      url: BASE + href,
      image: img ? BASE + decodeEntities(img).replace("/image_512/", "/image_256/") : null,
      price: price || null,
      regularPrice: strike ? Number(strike.replace(/,/g, "")) : null,
      inStock: !/out of stock/i.test(ribbon),
      categories: [],
      desc: stripTags(desc).slice(0, 600),
      blocks: [],
    };
  });
  return items.filter(Boolean);
}

async function crawlListing(store, prefix) {
  const BASE = store.url;
  const first = (await get(`${BASE}${prefix}`)).body;
  const n = lastPage(first);
  const rest = await pool(
    Array.from({ length: n - 1 }, (_, i) => i + 2),
    2,
    500,
    async (p) => (await get(`${BASE}${prefix}/page/${p}`)).body,
  );
  return [first, ...rest].flatMap((html) => parseCards(store, html));
}

// Category tree from the shop sidebar: radio inputs are named wsale_categories_radios_<parentId>.
function parseCategories(html) {
  const cats = new Map();
  const re =
    /data-link-href="\/shop\/category\/([^"]+)">\s*<input[^>]*name="wsale_categories_radios_(\d*)"[^>]*value="(\d+)"[^>]*\/>\s*<label[^>]*>([^<]+)</g;
  for (const [, slug, parent, id, label] of html.matchAll(re)) {
    cats.set(id, { id, slug, parent: parent || null, name: decodeEntities(label).trim() });
  }
  return cats;
}

export async function scrape(store, log) {
  const shopHtml = (await get(`${store.url}/shop`)).body;
  const cats = parseCategories(shopHtml);
  log(`${cats.size} categories, ${lastPage(shopHtml)} shop pages`);

  const items = new Map((await crawlListing(store, "/shop")).map((i) => [i.id, i]));
  log(`${items.size} products from /shop`);

  // Leaf categories only; parents are added from the tree, which keeps the crawl small.
  const parents = new Set([...cats.values()].map((c) => c.parent).filter(Boolean));
  const leaves = [...cats.values()].filter((c) => !parents.has(c.id));
  let done = 0;
  await pool(leaves, 2, 300, async (cat) => {
    const lineage = [];
    for (let c = cat; c; c = cats.get(c.parent)) lineage.unshift(c.name);
    for (const found of await crawlListing(store, `/shop/category/${cat.slug}`)) {
      const item = items.get(found.id) ?? (items.set(found.id, found), found);
      for (const name of lineage) if (!item.categories.includes(name)) item.categories.push(name);
    }
    if (++done % 20 === 0) log(`categories ${done}/${leaves.length}`);
  });

  await addDescriptions(store, [...items.values()], log);
  return [...items.values()];
}

// Full descriptions live only on each product page. Fetched pages are cached in
// data/cache/<store>-descriptions.json, so later runs only fetch products they haven't seen.
async function addDescriptions(store, items, log) {
  const cacheName = `cache/${store.id}-descriptions.json`;
  let cache = {};
  try {
    cache = JSON.parse(await readFile(path.join(DATA_DIR, cacheName), "utf8"));
  } catch {}
  const missing = items.filter((i) => !(i.id in cache));
  log(`descriptions: ${items.length - missing.length} cached, fetching ${missing.length}`);
  let done = 0;
  await pool(missing, 3, 250, async (item) => {
    try {
      const html = (await get(item.url)).body;
      const m = html.match(/product_full_description[^>]*>([\s\S]*?)<div class="oe_structure oe_structure_solo/);
      cache[item.id] = m ? htmlToBlocks(m[1]) : [];
    } catch {
      // Leave it out of the cache; the next run retries.
    }
    if (++done % 250 === 0) {
      log(`descriptions ${done}/${missing.length}`);
      await save(cacheName, cache);
    }
  });
  await save(cacheName, cache);
  for (const item of items) item.blocks = cache[item.id] ?? [];
}
