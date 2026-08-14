import { MAX_PAGINATION_SIZE } from "../constants";

/**
 * Clamp a page size to the API-allowed range (1–25) so requests
 * do not send invalid `pageSize` values.
 */
export function clampPageSize(n: number): number {
  if (!Number.isFinite(n)) return MAX_PAGINATION_SIZE;
  return Math.min(MAX_PAGINATION_SIZE, Math.max(1, Math.trunc(n)));
}

/**
 * Clamp a 1-based page index to at least 1.
 */
export function clampPage(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.trunc(n));
}
