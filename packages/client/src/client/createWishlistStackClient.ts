import { BASE_URL } from "../constants";
import { createRequest, type FetchLike } from "./request";
import { createListsResource } from "../resources/lists";
import { createGroupsResource } from "../resources/groups";
import { createSharedResource } from "../resources/shared";

export type CreateWishlistStackClientOptions = {
  baseUrl?: string;
  apiKey: string;
  customerAccessToken?: string;
  fetch?: FetchLike;
  /** Default request timeout in ms when a call does not pass `timeoutMs`. */
  defaultTimeoutMs?: number;
  /** When true, retry safe reads once on HTTP 429 (default: false). */
  retryOnRateLimit?: boolean;
};

export type WishlistStackClient = {
  lists: ReturnType<typeof createListsResource>;
  groups: ReturnType<typeof createGroupsResource>;
  shared: ReturnType<typeof createSharedResource>;
};

export function createWishlistStackClient(opts: CreateWishlistStackClientOptions): WishlistStackClient {
  if (!opts.apiKey) {
    throw new Error(
      "merchant api key is required. Pass it to createWishlistStackClient({ apiKey })",
    );
  }

  // Cloudflare Workers (and some other runtimes) can throw "Illegal invocation" if you
  // capture `globalThis.fetch` and call it later without the correct `this` binding.
  // So: default to a wrapper that calls `globalThis.fetch(...)` directly.
  const fetchImpl: FetchLike | undefined =
    opts.fetch ??
    (typeof globalThis.fetch === "function"
      ? ((input, init) => globalThis.fetch(input, init)) // keep correct invocation context
      : undefined);

  if (!fetchImpl) {
    throw new Error(
      "No fetch implementation found. Provide one via createWishlistStackClient({ fetch }) or use Node 18+ / modern browsers.",
    );
  }

  const request = createRequest({
    baseUrl: opts.baseUrl ?? BASE_URL,
    apiKey: opts.apiKey,
    customerAccessToken: opts.customerAccessToken,
    fetch: fetchImpl,
    defaultTimeoutMs: opts.defaultTimeoutMs,
    retryOnRateLimit: opts.retryOnRateLimit,
  });

  return {
    lists: createListsResource(request),
    groups: createGroupsResource(request),
    shared: createSharedResource(request),
  };
}
