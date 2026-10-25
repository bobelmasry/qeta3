export function clean(text: string): string;
export function tokenize(text: string): string[];
export function isModelCode(token: string): boolean;
export function isQuantity(token: string): boolean;
export function partCore(token: string): string | null;
