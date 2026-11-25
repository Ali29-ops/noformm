export const CART_COOKIE = "nf_cart";

export type CartLine = {
  slug: string;
  quantity: number;
  color?: string;
  material?: string;
  size?: string;
};

export function sameLine(a: CartLine, slug: string, color?: string, material?: string, size?: string) {
  return a.slug === slug && (a.color ?? "") === (color ?? "") && (a.material ?? "") === (material ?? "") && (a.size ?? "") === (size ?? "");
}

export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => typeof line.slug === "string" && Number.isFinite(line.quantity))
      .map((line) => ({
        slug: line.slug,
        quantity: Math.max(1, Math.floor(line.quantity)),
        color: typeof line.color === "string" && line.color ? line.color : undefined,
        size: typeof line.size === "string" && line.size ? line.size : undefined,
        material: typeof line.material === "string" && line.material ? line.material : undefined,
      }));
  } catch {
    return [];
  }
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
