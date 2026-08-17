export type OkResponse = { ok: true };

export type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/** Pagination metadata returned by list-detail endpoints. */
export type ListDetailPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  /** Compatibility alias for `totalItems`. */
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Image = {
  altText?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
};

export type FeaturedItem = {
  variantId: string | number;
  image?: Image | null;
};
