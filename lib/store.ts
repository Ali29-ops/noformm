/**
 * Compatibility facade over the database repositories.
 * New code should import from `@/lib/repo/*` directly.
 */
import { getAllProducts, getProductBySlug } from "./repo/products";

export type Stock = { price: number; quantity: number };

export async function getInventory(): Promise<Record<string, Stock>> {
  const products = await getAllProducts({ includeInactive: true });
  const out: Record<string, Stock> = {};
  for (const product of products) {
    out[product.slug] = { price: product.price, quantity: product.available };
  }
  return out;
}

export async function getStock(slug: string): Promise<Stock> {
  const product = await getProductBySlug(slug);
  if (!product) return { price: 0, quantity: 0 };
  return { price: product.price, quantity: product.available };
}

export { slugify } from "./repo/products";
export { listOrders as getOrders, getOrdersByCustomer } from "./repo/orders";
export { listEnquiries as getEnquiries, addEnquiry } from "./repo/enquiries";
export { getCustomerByEmail, getCustomerById, createCustomer } from "./repo/customers";
export type { OrderStatus } from "./db/schema";
