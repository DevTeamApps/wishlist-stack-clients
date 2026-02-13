// NOTE: Most endpoints in the current OpenAPI spec do not define response schemas.
// These named aliases are intentionally stable so you can refine them over time.

import type { FeaturedItem, Image, OkResponse, Pagination } from "./common";
export type { FeaturedItem, Image, OkResponse, Pagination } from "./common";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type Metafield = {
  key: string;
  value: string;
};

export type HydratedVariant = {
  id: string | number;
  title: string;
  sku?: string | null;
  price: Money;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  selectedOptions: SelectedOption[];
  image?: Image | null;
  metafields: Metafield[];
};

export type HydratedProduct = {
  id: string | number;
  title: string;
  description: string;
  availableForSale: boolean;
  handle: string;
  productType: string | null;
  category: string | null;
  tags: string[];
  onlineStoreUrl: string | null;
  metafields: Metafield[];
  variant: HydratedVariant;
  vendor: string | null;
};

export type HydratedWishlistItem = {
  id: string;
  userNote?: string | null;
  quantity: number;
  position: number;
  product: HydratedProduct;
  properties?: Record<string, unknown> | null;
};

export type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  featuredProducts?: FeaturedItem[];
};

export type ListDetail = Omit<ListSummary, "featuredProducts"> & {
  items: HydratedWishlistItem[];
};

/** GET `/api/lists` */
export type GetListsResponse = {
  lists: ListSummary[];
  pagination: Pagination;
};

/** GET `/api/lists/:listId` */
export type GetListResponse = ListDetail;

export type CreateListResponse = unknown;
export type UpdateListDetailsResponse = unknown;
export type RemoveListResponse = OkResponse;
export type AddItemsToListResponse = unknown;
export type UpdateListItemResponse = unknown;
export type RemoveItemFromListResponse = OkResponse;
export type ReorderListItemsResponse = {
  updated: Array<{ id: string; position: number }>;
};
export type MarkListSharedResponse = unknown;
export type RevokeListSharedResponse = unknown;

