import type { Query } from "../client/query";
import type { PaginationParams } from "./pagination";

export const SORT_FIELDS = ["position", "createdAt", "updatedAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

/**
 * Collection sort options for multi-resource GET endpoints.
 * Defaults on the API are `sortBy=position` and `sortDirection=asc`.
 */
export type SortParams = {
  sortBy?: SortField;
  sortDirection?: SortDirection;
};

/**
 * Shared query option building blocks for list/group endpoints.
 *
 * Keep this extendable: as we add filters/sorts, we can add additional helpers/types here
 * and reuse them across endpoints without duplicating logic.
 */
export type PaginatedQuery<TExtra extends Query = Query> = PaginationParams & SortParams & TExtra;

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

/**
 * Merge a base query with sort parameters.
 */
export function withSort<TExtra extends Query>(
  query?: TExtra,
  sort?: SortParams,
): (TExtra & SortParams) | undefined {
  if (!query && !sort) return undefined;
  return { ...(query ?? {}), ...(sort ?? {}) } as TExtra & SortParams;
}

