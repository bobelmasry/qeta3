// Scrape every store (or the ids given as arguments) into data/stores/<id>.json.
// A store that fails keeps its previous snapshot, so one outage never empties the site.
import { save } from "./lib.mjs";
import { STORES } from "./stores.mjs";
import * as woocommerce from "./platforms/woocommerce.mjs";
import * as odoo from "./platforms/odoo.mjs";

const PLATFORMS = { woocommerce, odoo };

const only = process.argv.slice(2);
const targets = only.length ? STORES.filter((s) => only.includes(s.id)) : STORES;

const results = await Promise.allSettled(
  targets.map(async (store) => {
    const log = (msg) => console.log(`[${store.id}] ${msg}`);
    const started = Date.now();
    const items = await PLATFORMS[store.platform].scrape(store, log);
    await save(`stores/${store.id}.json`, items);
    log(`done in ${Math.round((Date.now() - started) / 1000)}s`);
  }),
);

const failed = results
  .map((r, i) => r.status === "rejected" && `${targets[i].id}: ${r.reason.message}`)
  .filter(Boolean);
if (failed.length) {
  console.error(`failed:\n  ${failed.join("\n  ")}`);
  process.exitCode = 1;
}
