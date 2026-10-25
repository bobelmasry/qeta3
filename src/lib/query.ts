import { SORTS, type Query, type Sort } from "./types";

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const num = (v: string) => (v.trim() !== "" && Number.isFinite(+v) ? +v : null);

export function parseQuery(params: Params): Query {
  const sort = one(params.sort);
  const store = params.store;
  return {
    q: one(params.q).slice(0, 200),
    group: one(params.cat) || null,
    sub: (one(params.cat) && one(params.sub)) || null,
    stores: (Array.isArray(store) ? store : store ? [store] : []).filter(Boolean),
    inStock: one(params.stock) === "1",
    min: num(one(params.min)),
    max: num(one(params.max)),
    sort: sort in SORTS ? (sort as Sort) : "relevance",
    page: Math.max(1, Math.floor(num(one(params.page)) ?? 1)),
  };
}

/** Build a URL for `query` with `changes` applied; any change other than paging resets to page 1. */
export function hrefFor(query: Query, changes: Partial<Query> = {}) {
  const next = { ...query, page: 1, ...changes };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.group) sp.set("cat", next.group);
  if (next.group && next.sub) sp.set("sub", next.sub);
  for (const s of next.stores) sp.append("store", s);
  if (next.inStock) sp.set("stock", "1");
  if (next.min != null) sp.set("min", String(next.min));
  if (next.max != null) sp.set("max", String(next.max));
  if (next.sort !== "relevance") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}
