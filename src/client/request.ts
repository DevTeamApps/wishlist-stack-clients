import { toQueryString, type Query } from "./query";
import { WjsApiError } from "./errors";
import type { ApiErrorResponse } from "../types/common";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type AuthMode = "authenticated" | "merchant";

export type RequestContext = {
  baseUrl: string;
  apiKey: string;
  customerAccessToken?: string;
  fetch: FetchLike;
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

export function createRequest(ctx: RequestContext) {
  return async function request<TResponse = unknown, TBody = unknown>(
    args: RequestArgs<TBody>,
  ): Promise<TResponse> {
    const url = `${ctx.baseUrl}${args.path}${toQueryString(args.query)}`;

    const headers: Record<string, string> = {
      "X-WJS-Api-Key": ctx.apiKey,
      ...(args.headers ?? {}),
    };

    if (args.auth === "authenticated") {
      const token = ctx.customerAccessToken;
      if (!token) {
        throw new Error(
          "customerAccessToken is required for authenticated endpoints. Pass it to createWjsClient({ customerAccessToken })",
        );
      }
      headers["X-Shopify-Customer-Access-Token"] = token;
    }

    let body: BodyInit | undefined;
    if (args.body !== undefined) {
      // Only JSON bodies are supported for this SDK.
      headers["content-type"] ??= "application/json";
      body = JSON.stringify(args.body);
    }

    const controller = args.timeoutMs ? new AbortController() : undefined;
    const timeout =
      args.timeoutMs && controller
        ? setTimeout(() => controller.abort(), args.timeoutMs)
        : undefined;

    const signal = args.signal
      ? args.signal
      : controller
        ? controller.signal
        : undefined;

    const res = await ctx.fetch(url, {
      method: args.method,
      headers,
      body,
      signal,
    });

    if (timeout) clearTimeout(timeout);

    if (!res.ok) {
      const errBody = (await safeParseJson(res)) as ApiErrorResponse | unknown;
      const requestId =
        res.headers.get("fly-request-id") ??
        res.headers.get("x-request-id") ??
        undefined;
      throw new WjsApiError<ApiErrorResponse | unknown>(`WJS API request failed (${res.status})`, {
        status: res.status,
        url,
        method: args.method,
        requestId,
        body: errBody,
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

