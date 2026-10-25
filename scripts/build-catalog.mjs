// Merge per-store snapshots into data/catalog.json: listings for the same part at different
// stores are grouped into one product so their prices can be compared side by side.
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, fixMojibake, save } from "./lib.mjs";
import { STORES } from "./stores.mjs";
import { classify } from "./taxonomy.mjs";
import { tokenize, isModelCode, isQuantity, partCore } from "../src/lib/normalize.mjs";
import { shardOf, productSlug } from "../src/lib/details-shard.mjs";

const MATCH_THRESHOLD = 0.62;
const MODEL_WEIGHT = 3;
const MAX_DF = 400; // tokens in more listings than this don't generate candidate pairs
// Words that turn a listing into a different thing than its namesake: an HC-SR04 bracket is not
// an HC-SR04, and an SMD part is not its through-hole twin.
// Variant words: "Jetson Orin Nano" and "Jetson Orin NX" are different boards.
const VARIANTS = new Set("nano nx mini micro pro max plus lite ultra mega uno leonardo zero air".split(" "));
const DISTINGUISHERS = new Set(
  "smd holder bracket shield case box cover socket stand mount adapter cable kit set expansion breakout wifi".split(" "),
);

// Photon resizes and caches any public WordPress upload; it reaches hosts that block hotlinking.
function viaImageCdn(url) {
  const original = url.replace(/-\d+x\d+(\.\w+)$/, "$1");
  return `https://i0.wp.com/${original.replace(/^https?:\/\//, "")}?w=300`;
}

// ---------- load ----------
const listings = [];
const loaded = [];
for (const store of STORES) {
  try {
    const items = JSON.parse(await readFile(path.join(DATA_DIR, "stores", `${store.id}.json`), "utf8"));
    for (const item of items) {
      if (!item.price || !item.name) continue;
      if (store.imageCdn && item.image) item.image = viaImageCdn(item.image);
      item.name = fixMojibake(item.name);
      item.desc = fixMojibake(item.desc ?? "");
      item.blocks = (item.blocks ?? []).map((b) =>
        b.t === "spec" ? { ...b, k: fixMojibake(b.k), v: fixMojibake(b.v) } : { ...b, text: fixMojibake(b.text) },
      );
      listings.push(item);
    }
    loaded.push({ ...store, count: items.length });
  } catch {
    console.warn(`no snapshot for ${store.id}, skipping`);
  }
}
console.log(`${listings.length} priced listings from ${loaded.length} stores`);

// ---------- vectors ----------
// Names only: store SKUs are mostly internal codes (bin locations, store prefixes) and add noise.
// Part numbers after "for"/"compatible with" name what the item fits ("LCD for Arduino Mega2560"),
// not what it is, so they don't count as the item's own model code.
function features(item) {
  const tokens = new Set(tokenize(item.name));
  const own = item.name.split(/\b(?:for|compatible with|replacement)\b/i)[0];
  return {
    tokens,
    models: new Set(tokenize(own).filter(isModelCode)),
    quantities: new Set([...tokens].filter(isQuantity)),
    versions: new Set([...tokens].filter((t) => /^\d{1,2}$/.test(t))),
  };
}

const feats = listings.map(features);
const df = new Map();
for (const f of feats) for (const t of f.tokens) df.set(t, (df.get(t) ?? 0) + 1);
const N = listings.length;
const idf = (t) => Math.log(1 + N / (df.get(t) ?? 1));

const vectors = feats.map((f) => {
  const v = new Map();
  for (const t of f.tokens) v.set(t, idf(t) * (f.models.has(t) ? MODEL_WEIGHT : 1));
  const norm = Math.hypot(...v.values()) || 1;
  for (const [t, w] of v) v.set(t, w / norm);
  return v;
});

// ---------- candidate pairs (sparse dot products via an inverted index) ----------
const postings = new Map();
vectors.forEach((v, i) => {
  for (const t of v.keys()) {
    if (df.get(t) > MAX_DF) continue;
    (postings.get(t) ?? postings.set(t, []).get(t)).push(i);
  }
});

function unitOf(q) {
  return q.replace(/^[\d.]+/, "");
}

// L7805CV and 7805 are the same regulator: compare part numbers by their numeric core too.
function sharesModel(a, b) {
  const cores = new Set([...b].flatMap((m) => [m, partCore(m)]));
  return [...a].some((m) => cores.has(m) || cores.has(partCore(m)));
}

function score(i, j, dot) {
  const a = feats[i];
  const b = feats[j];
  let s = dot;
  // Different part numbers mean different parts, however similar the rest of the title.
  if (a.models.size && b.models.size && !sharesModel(a.models, b.models)) s *= 0.35;
  // Bare small numbers are usually versions: Raspberry Pi 4 vs Pi 5.
  if (a.versions.size && b.versions.size && ![...a.versions].some((v) => b.versions.has(v))) s *= 0.4;
  // Same unit with different values (5v vs 12v, 10k vs 4.7k) is a different variant.
  for (const q of a.quantities) {
    const u = unitOf(q);
    const other = [...b.quantities].filter((x) => unitOf(x) === u);
    if (other.length && !other.includes(q)) s *= 0.5;
  }
  const ratio = Math.max(listings[i].price, listings[j].price) / Math.min(listings[i].price, listings[j].price);
  if (ratio > 3) s *= 0.6;
  for (const d of DISTINGUISHERS) if (a.tokens.has(d) !== b.tokens.has(d)) s *= 0.55;
  const va = [...a.tokens].filter((t) => VARIANTS.has(t));
  const vb = [...b.tokens].filter((t) => VARIANTS.has(t));
  if (va.length && vb.length && !va.some((t) => vb.includes(t))) s *= 0.4;
  return s;
}

const edges = [];
vectors.forEach((v, i) => {
  const dots = new Map();
  for (const [t, w] of v) {
    for (const j of postings.get(t) ?? []) {
      if (j <= i || listings[j].store === listings[i].store) continue;
      dots.set(j, (dots.get(j) ?? 0) + w * vectors[j].get(t));
    }
  }
  for (const [j, dot] of dots) {
    if (dot < MATCH_THRESHOLD * 0.8) continue;
    const s = score(i, j, dot);
    if (s >= MATCH_THRESHOLD) edges.push([s, i, j]);
  }
});
edges.sort((x, y) => y[0] - x[0]);
console.log(`${edges.length} candidate matches`);

// ---------- clustering: strongest edges first, at most one listing per store per product ----------
const clusterOf = listings.map((_, i) => i);
const members = new Map(listings.map((_, i) => [i, [i]]));

function join(ci, cj) {
  for (const k of members.get(cj)) clusterOf[k] = ci;
  members.get(ci).push(...members.get(cj));
  members.delete(cj);
}

// Identical names at similar prices are the same product, even twice at one store (stores do
// list items twice). This runs before the one-listing-per-store rule below.
const byExactName = new Map();
listings.forEach((item, i) => {
  const key = tokenize(item.name).join(" ");
  (byExactName.get(key) ?? byExactName.set(key, []).get(key)).push(i);
});
for (const group of byExactName.values()) {
  group.sort((a, b) => listings[a].price - listings[b].price);
  for (let k = 1; k < group.length; k++) {
    const [a, b] = [group[k - 1], group[k]];
    if (listings[b].price / listings[a].price <= 1.6 && clusterOf[a] !== clusterOf[b]) join(clusterOf[a], clusterOf[b]);
  }
}

for (const [, i, j] of edges) {
  const ci = clusterOf[i];
  const cj = clusterOf[j];
  if (ci === cj) continue;
  const A = members.get(ci);
  const B = members.get(cj);
  const stores = new Set(A.map((k) => listings[k].store));
  if (B.some((k) => stores.has(listings[k].store))) continue;
  join(ci, cj);
}

// ---------- details ----------
// The richest description among a product's listings, specs tables counting extra.
function richness(item) {
  const blocks = item.blocks ?? [];
  const text = blocks.reduce((n, b) => n + (b.text?.length ?? b.k.length + b.v.length), 0);
  return Math.min(text, 3000) + 60 * blocks.filter((b) => b.t === "spec").length + (item.desc ? 100 : 0);
}

const details = {};

// ---------- assemble ----------
const products = [...members.values()].map((idx) => {
  const offers = idx
    .map((k) => listings[k])
    .sort((a, b) => b.inStock - a.inStock || a.price - b.price)
    .map(({ id, store, name, sku, url, price, regularPrice, inStock, image }) => ({
      id, store, name, sku, url, price, regularPrice, inStock, image,
    }));
  const lead = idx.map((k) => listings[k]).sort((a, b) => b.name.length - a.name.length)[0];
  const inStock = offers.filter((o) => o.inStock);
  const prices = (inStock.length ? inStock : offers).map((o) => o.price);
  const categories = [...new Set(idx.flatMap((k) => listings[k].categories))];
  const { group, sub } = classify(
    idx.flatMap((k) => [...listings[k].categories].reverse()),
    idx.map((k) => listings[k].name),
  );
  // Every offer's image; the page falls back along this list when one fails to load.
  const images = [...new Set(offers.map((o) => o.image).filter(Boolean))];
  const id = lead.id.replace(":", "-");
  const source = idx.map((k) => listings[k]).sort((a, b) => richness(b) - richness(a))[0];
  const summary = idx.map((k) => listings[k].desc).sort((a, b) => b.length - a.length)[0] ?? "";
  if (summary || source.blocks?.length) {
    (details[shardOf(id)] ??= {})[id] = { summary, from: source.store, url: source.url, blocks: source.blocks ?? [] };
  }
  return {
    id,
    slug: productSlug(id, lead.name),
    name: lead.name,
    images,
    group,
    sub,
    categories,
    desc: idx.map((k) => listings[k].desc).find(Boolean)?.slice(0, 200) ?? "",
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    inStock: inStock.length > 0,
    offers,
  };
});

const multi = products.filter((p) => p.offers.length > 1);
console.log(
  `${products.length} products; ${multi.length} found at 2+ stores (${multi.filter((p) => p.offers.length > 2).length} at 3+)`,
);

await rm(path.join(DATA_DIR, "details"), { recursive: true, force: true });
for (const [shard, entries] of Object.entries(details)) await save(`details/${shard}.json`, entries);
const described = Object.values(details).reduce((n, d) => n + Object.values(d).filter((x) => x.blocks.length).length, 0);
console.log(`${described} products with a full description`);

await save("catalog.json", {
  builtAt: new Date().toISOString(),
  stores: loaded.map(({ id, name, short, badge, url, count }) => ({ id, name, short, badge, url, count })),
  products,
});
