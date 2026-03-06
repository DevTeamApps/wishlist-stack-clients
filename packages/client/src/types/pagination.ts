import { MAX_PAGINATION_SIZE } from "../constants";

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  query?: string;
};

export const DEFAULT_PAGE = 1 as const;
export const DEFAULT_PAGE_SIZE = MAX_PAGINATION_SIZE;

