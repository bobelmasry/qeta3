export const DETAIL_SHARDS: number;
export function shardOf(productId: string): string;
export function productSlug(id: string, name: string): string;
export function idFromSlug(slug: string): string | null;
