import type { Query } from "../client/query";
import type { PaginationParams } from "./pagination";

/**
 * Shared query option building blocks for list/group endpoints.
 *
 * Keep this extendable: as we add filters/sorts, we can add additional helpers/types here
 * and reuse them across endpoints without duplicating logic.
 */
export type PaginatedQuery<TExtra extends Query = Query> = PaginationParams & TExtra;

/**
 * Merge a base query with pagination parameters.
 * (Useful when an endpoint also gains filter/sort params over time.)
 */
export function withPagination<TExtra extends Query>(
  query?: TExtra,
  pagination?: PaginationParams,
): PaginatedQuery<TExtra> | undefined {
  if (!query && !pagination) return undefined;
  return { ...(query ?? {}), ...(pagination ?? {}) } as PaginatedQuery<TExtra>;
}

