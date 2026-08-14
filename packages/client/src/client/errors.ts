export type WishlistStackApiErrorDetails<TBody = unknown> = {
  status: number;
  url: string;
  method: string;
  requestId?: string;
  body?: TBody;
  /** Value of the `Retry-After` response header when present (seconds or HTTP-date). */
  retryAfter?: string;
  /** Selected rate-limit response headers when present. */
  rateLimit?: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };
};

type ApiErrorItemLike = { message?: unknown; field?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorItemLike(value: unknown): value is ApiErrorItemLike {
  return isRecord(value) && "message" in value;
}

function extractApiErrors(body: unknown): Array<{ message: string; field?: string }> | undefined {
  if (!isRecord(body)) return undefined;
  const errors = body.errors;
  if (!Array.isArray(errors)) return undefined;
  const out: Array<{ message: string; field?: string }> = [];
  for (const e of errors) {
    if (!isApiErrorItemLike(e)) continue;
    const msg = typeof e.message === "string" ? e.message : undefined;
    if (!msg) continue;
    const field = typeof (e as any).field === "string" ? (e as any).field : undefined;
    out.push(field ? { message: msg, field } : { message: msg });
  }
  return out.length ? out : undefined;
}

export class WishlistStackApiError<TBody = unknown> extends Error {
  readonly name = "WishlistStackApiError";
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly requestId?: string;
  readonly body?: TBody;
  readonly retryAfter?: string;
  readonly rateLimit?: WishlistStackApiErrorDetails["rateLimit"];

  constructor(message: string, details: WishlistStackApiErrorDetails<TBody>) {
    super(message);
    this.status = details.status;
    this.url = details.url;
    this.method = details.method;
    this.requestId = details.requestId;
    this.body = details.body;
    this.retryAfter = details.retryAfter;
    this.rateLimit = details.rateLimit;
  }

  /**
   * Best-effort extraction of API error items from the response body.
   * Useful for UI/logging without needing to know the exact response shape.
   */
  get apiErrors(): Array<{ message: string; field?: string }> | undefined {
    return extractApiErrors(this.body);
  }

  /**
   * Convenience: extracted error messages (if present).
   */
  get apiErrorMessages(): string[] | undefined {
    const errs = this.apiErrors;
    return errs?.map((e) => e.message);
  }
}

/**
 * Bundler-safe type guard (prefer this over `instanceof WishlistStackApiError`).
 */
export function isWishlistStackApiError(value: unknown): value is WishlistStackApiError<unknown> {
  if (!isRecord(value)) return false;
  return (
    (value as any).name === "WishlistStackApiError" &&
    typeof (value as any).status === "number" &&
    typeof (value as any).url === "string" &&
    typeof (value as any).method === "string"
  );
}
