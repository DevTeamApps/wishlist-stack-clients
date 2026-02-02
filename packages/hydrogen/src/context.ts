import type { WishlistStackClient } from "@sdg.la/wishlist-stack-sdk";
import type { WishlistStackHydrogenServer } from "./types";

type ContextMapLike = {
  get?: (key: string) => unknown;
  wishlistStack?: WishlistStackHydrogenServer;
  wishlistStackClient?: WishlistStackClient;
};

async function maybeAwait<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? await value : value;
}

/**
 * Retrieve `wishlistStackClient` from a Hydrogen/React Router loader context.
 *
 * Supports both styles:
 * - plain object: `context.wishlistStackClient`
 * - context map: `context.get('wishlistStackClient')`
 */
export async function getWishlistStackClient(context: unknown): Promise<WishlistStackClient> {
  const ctx = context as ContextMapLike | null | undefined;
  if (!ctx) throw new Error("Missing loader context (expected context.wishlistStackClient).");

  if (ctx.wishlistStackClient) return ctx.wishlistStackClient;
  if (typeof ctx.get === "function") {
    const val = await maybeAwait(ctx.get("wishlistStackClient") as any);
    if (val) return val as WishlistStackClient;
  }

  throw new Error(
    "Wishlist Stack client not found on loader context. Ensure you called createWishlistStackServerContext(...)(context) in your server/app load context.",
  );
}

/**
 * Retrieve the server helper (`wishlistStack`) from a Hydrogen/React Router loader context.
 * (Useful for bootstrap/token helpers; most route code should just use `wishlistStackClient`.)
 */
export async function getWishlistStack(context: unknown): Promise<WishlistStackHydrogenServer> {
  const ctx = context as ContextMapLike | null | undefined;
  if (!ctx) throw new Error("Missing loader context (expected context.wishlistStack).");

  if (ctx.wishlistStack) return ctx.wishlistStack;
  if (typeof ctx.get === "function") {
    const val = await maybeAwait(ctx.get("wishlistStack") as any);
    if (val) return val as WishlistStackHydrogenServer;
  }

  throw new Error(
    "Wishlist Stack helper not found on loader context. Ensure you called createWishlistStackServerContext(...)(context) in your server/app load context.",
  );
}

