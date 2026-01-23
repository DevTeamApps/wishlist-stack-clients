import type { WjsClient } from "@devteam-sdg/wjs-client";
import type { WjsHydrogenServer } from "./types";

type ContextMapLike = {
  get?: (key: string) => unknown;
  wjs?: WjsHydrogenServer;
  wjsClient?: WjsClient;
};

async function maybeAwait<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? await value : value;
}

/**
 * Retrieve `wjsClient` from a Hydrogen/React Router loader context.
 *
 * Supports both styles:
 * - plain object: `context.wjsClient`
 * - context map: `context.get('wjsClient')`
 */
export async function getWjsClient(context: unknown): Promise<WjsClient> {
  const ctx = context as ContextMapLike | null | undefined;
  if (!ctx) throw new Error("Missing loader context (expected context.wjsClient).");

  if (ctx.wjsClient) return ctx.wjsClient;
  if (typeof ctx.get === "function") {
    const val = await maybeAwait(ctx.get("wjsClient") as any);
    if (val) return val as WjsClient;
  }

  throw new Error(
    "WJS client not found on loader context. Ensure you called createWjsServerContext(...)(context) in your server/app load context.",
  );
}

/**
 * Retrieve the server helper (`wjs`) from a Hydrogen/React Router loader context.
 * (Useful for bootstrap/token helpers; most route code should just use `wjsClient`.)
 */
export async function getWjs(context: unknown): Promise<WjsHydrogenServer> {
  const ctx = context as ContextMapLike | null | undefined;
  if (!ctx) throw new Error("Missing loader context (expected context.wjs).");

  if (ctx.wjs) return ctx.wjs;
  if (typeof ctx.get === "function") {
    const val = await maybeAwait(ctx.get("wjs") as any);
    if (val) return val as WjsHydrogenServer;
  }

  throw new Error(
    "WJS helper not found on loader context. Ensure you called createWjsServerContext(...)(context) in your server/app load context.",
  );
}

