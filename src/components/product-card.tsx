import Link from "next/link";
import type { Product, Store } from "@/lib/types";
import { ProductImage } from "./product-image";
import { Price, StoreBadge, formatPrice } from "./ui";

export { formatPrice };

const MAX_BADGES = 3;

export function ProductCard({ product, stores }: { product: Product; stores: Map<string, Store> }) {
  const inStock = product.offers.filter((o) => o.inStock);
  const cheapest = inStock[0] ?? product.offers[0];
  const spread = inStock.length > 1 ? product.maxPrice - product.minPrice : 0;
  // Pennies on a 1 EGP diode aren't worth a badge.
  const saving = spread >= 5 && spread / product.maxPrice >= 0.1 ? spread : 0;
  const storeIds = [...new Set(product.offers.map((o) => o.store))];

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <ProductImage srcs={product.images} />
        {saving > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-copper-soft px-2 py-0.5 text-[11px] font-semibold text-copper">
            Save {formatPrice(saving)}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-sunken/90 px-2 py-0.5 text-[11px] font-medium text-muted">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line p-3.5">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-faint">{product.sub ?? product.group}</p>
        <h2 className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</h2>

        <div className="mt-auto pt-1">
          <Price value={product.minPrice} className="text-lg font-semibold" />
          <p className="truncate text-xs text-muted">
            {product.offers.length > 1 ? "cheapest at " : "at "}
            <span className="font-medium text-ink">{stores.get(cheapest.store)?.name ?? cheapest.store}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-dashed border-line pt-2.5">
          <div className="flex gap-0.5">
            {storeIds.slice(0, MAX_BADGES).map((id) => (
              <StoreBadge key={id} id={id} store={stores.get(id)} size="sm" />
            ))}
          </div>
          <span className="whitespace-nowrap text-xs text-muted">
            {storeIds.length === 1 ? "1 store" : `${storeIds.length} stores`}
          </span>
        </div>
      </div>
    </Link>
  );
}
