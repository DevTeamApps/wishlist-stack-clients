export type OkResponse = { ok: true };

export type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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

