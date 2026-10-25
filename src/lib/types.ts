export type Offer = {
  id: string;
  store: string;
  name: string;
  sku: string;
  url: string;
  price: number;
  regularPrice: number | null;
  inStock: boolean;
  image: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  group: string;
  sub: string | null;
  categories: string[];
  desc: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  offers: Offer[];
};

export type Store = { id: string; name: string; short: string; badge: string; url: string; count: number };

export const SORTS = {
  relevance: "Best match",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  stores: "Most stores",
  savings: "Biggest savings",
} as const;
export type Sort = keyof typeof SORTS;

export type Query = {
  q: string;
  group: string | null;
  sub: string | null;
  stores: string[];
  inStock: boolean;
  min: number | null;
  max: number | null;
  sort: Sort;
  page: number;
};

export const PAGE_SIZE = 24;

export type Block = { t: "h" | "p" | "li"; text: string } | { t: "spec"; k: string; v: string };

export type Details = { summary: string; from: string; url: string; blocks: Block[] };
