import { cookies } from "next/headers";
import { CART_COOKIE, parseCart, type CartLine } from "./cart-model";

export { CART_COOKIE, parseCart, cartCount, formatUsd, sameLine, type CartLine } from "./cart-model";

export async function readCart(): Promise<CartLine[]> {
  const jar = await cookies();
  return parseCart(jar.get(CART_COOKIE)?.value);
}
