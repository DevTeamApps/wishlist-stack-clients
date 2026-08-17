import { toQueryString, type Query } from "./query";
import { WishlistStackApiError } from "./errors";
import type { ApiErrorResponse } from "../types/common";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type AuthMode = "authenticated" | "merchant";

export type RequestContext = {
  baseUrl: string;
  apiKey: string;
  customerAccessToken?: string;
  fetch: FetchLike;
  /** Applied when a call does not pass `timeoutMs`. */
  defaultTimeoutMs?: number;
  /** When true, retry safe GET requests once on HTTP 429 with jittered delay. */
  retryOnRateLimit?: boolean;
};

export type RequestArgs<TBody> = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  auth: AuthMode;
  query?: Query;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Marks a non-GET operation as safe to retry once on HTTP 429. */
  retryable?: boolean;
};

async function safeParseJson(res: Response): Promise<unknown | undefined> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return undefined;
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

function pickRequestId(res: Response): string | undefined {
  return (
    res.headers.get("fly-request-id") ??
    res.headers.get("x-request-id") ??
    res.headers.get("x-nf-request-id") ??
    res.headers.get("x-netlify-request-id") ??
    undefined
  );
}

function pickRateLimit(res: Response): { limit?: string; remaining?: string; reset?: string } | undefined {
  const limit = res.headers.get("x-ratelimit-limit") ?? undefined;
  const remaining = res.headers.get("x-ratelimit-remaining") ?? undefined;
  const reset = res.headers.get("x-ratelimit-reset") ?? undefined;
  if (!limit && !remaining && !reset) return undefined;
  return { limit, remaining, reset };
}

function errorMessageFor(status: number, path: string): string {
  if (status === 503 && path.includes("/api/groups")) {
    return "Groups API disabled for this merchant";
  }
  return `Wishlist Stack API request failed (${status})`;
}

function parseRetryAfterMs(retryAfter: string | undefined): number {
  if (!retryAfter) return 0;
  const asSeconds = Number(retryAfter);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, 30_000);
  }
  const asDate = Date.parse(retryAfter);
  if (!Number.isNaN(asDate)) {
    return Math.min(Math.max(0, asDate - Date.now()), 30_000);
  }
  return 0;
}

function jitterDelayMs(baseMs: number): number {
  const base = Math.max(100, baseMs || 500);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(base + jitter, 30_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRequest(ctx: RequestContext) {
  return async function request<TResponse = unknown, TBody = unknown>(
    args: RequestArgs<TBody>,
  ): Promise<TResponse> {
    const url = `${ctx.baseUrl}${args.path}${toQueryString(args.query)}`;

    const headers: Record<string, string> = {
      "X-Wishlist-Stack-Api-Key": ctx.apiKey,
      ...(args.headers ?? {}),
    };

    if (args.auth === "authenticated") {
      const token = ctx.customerAccessToken;
      // If token is missing, still perform the request and let the API return the appropriate
      // error response (which we will surface as a WishlistStackApiError based on the HTTP response).
      if (token) headers["X-Shopify-Customer-Access-Token"] = token;
    }

    let body: BodyInit | undefined;
    if (args.body !== undefined) {
      // Only JSON bodies are supported for this SDK.
      headers["content-type"] ??= "application/json";
      body = JSON.stringify(args.body);
    }

    const timeoutMs = args.timeoutMs ?? ctx.defaultTimeoutMs;

    const doFetch = async (): Promise<Response> => {
      const controller = timeoutMs ? new AbortController() : undefined;
      const timeout =
        timeoutMs && controller
          ? setTimeout(() => controller.abort(), timeoutMs)
          : undefined;

      const signal = args.signal
        ? args.signal
        : controller
          ? controller.signal
          : undefined;

      try {
        return await ctx.fetch(url, {
          method: args.method,
          headers,
          body,
          signal,
        });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };

    let res = await doFetch();

    const retryable = args.method === "GET" || args.retryable === true;
    if (!res.ok && res.status === 429 && ctx.retryOnRateLimit && retryable) {
      const retryAfter = res.headers.get("retry-after") ?? undefined;
      await sleep(jitterDelayMs(parseRetryAfterMs(retryAfter)));
      res = await doFetch();
    }

    if (!res.ok) {
      const errBody = (await safeParseJson(res)) as ApiErrorResponse | unknown;
      const retryAfter = res.headers.get("retry-after") ?? undefined;
      throw new WishlistStackApiError<ApiErrorResponse | unknown>(errorMessageFor(res.status, args.path), {
        status: res.status,
        url,
        method: args.method,
        requestId: pickRequestId(res),
        body: errBody,
        retryAfter,
        rateLimit: pickRateLimit(res),
      });
    }

    if (res.status === 204) return undefined as TResponse;

    const parsed = await safeParseJson(res);
    // If server didn't return JSON, return the raw text as unknown.
    if (parsed === undefined) {
      const text = await res.text().catch(() => "");
      return text as unknown as TResponse;
    }

    return parsed as TResponse;
  };
}
