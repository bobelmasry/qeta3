# Qeta3 — electronics prices across Egypt

Search electronic components across Egyptian stores and compare prices for the same part side by side.

## Data pipeline

```bash
npm run scrape            # all stores -> data/stores/<id>.json  (or: npm run scrape -- uge ram)
npm run catalog           # match + classify -> data/catalog.json
npm run update-data       # both
```

The running site picks up a rebuilt `data/catalog.json` on the next request (no restart needed).

- **Stores** live in `scripts/stores.mjs`. Adding a store on a supported platform is one line.
- **Platforms** (`scripts/platforms/`):
  - `woocommerce`: the public Store API (`/wp-json/wc/store/v1/products`), clean JSON.
  - `odoo`: parses the `/shop` grid, plus a category crawl to tag products.
  A failed store keeps its previous snapshot.
- **Matching** (`scripts/build-catalog.mjs`) groups listings of the same part across stores:
  - TF-IDF over normalized names, with model codes weighted 3×.
  - Penalties for different part numbers (cores are compared, so `L7805CV` = `7805`), different
    versions (Pi 4 vs Pi 5), different values (5V vs 12V), SMD vs through-hole, accessory words
    (holder, bracket…), and large price gaps.
  - Each product holds at most one listing per store.
- **Categories** (`scripts/taxonomy.mjs`) are a two-level tree shared by all stores. Product names
  and store categories vote on the group.
- **Search** (`src/lib/catalog.ts`) is an in-memory MiniSearch index that uses the same tokenizer as
  the matcher (`src/lib/normalize.mjs`):
  - `HC-SR04` = `hcsr04` = `hc sr04`, and `10KΩ` = `10k`.
  - Fuzzy matching for words but never part numbers; Arabic part names map to English.

## Stores

UGE, RAM, Makers, Free Electronic, Micro Ohm, Most Electronic, Lancer3D, Ekostra, 3DUINO, ElectroHub.

Images from Makers and ElectroHub go through WordPress's image CDN (`i0.wp.com`): Makers' host
blocks hotlinking, and ElectroHub's is flaky. Each card also falls back across every store's
image for that product.

Not included:
- **El Gammal** (custom app; there's no public catalog API, only its private back-office database).
- **Future Electronics** (rate-limited behind Cloudflare).

## Dev

```bash
npm run dev
```
