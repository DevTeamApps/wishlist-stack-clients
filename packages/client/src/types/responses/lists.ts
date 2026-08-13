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
  createdAt: string;
  updatedAt: string;
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

/** GET `/api/lists/:listId` — may include `pagination` when the API paginates items. */
export type GetListResponse = ListDetail & {
  pagination?: Pagination;
};

export type ListMutationResponse = Omit<ListSummary, "featuredProducts">;

export type CreateListResponse = ListMutationResponse;
export type DuplicateListResponse = ListMutationResponse;
export type UpdateListDetailsResponse = ListMutationResponse;
export type RemoveListResponse = OkResponse;

/** Add response that returns only the newly added items. */
export type AddItemsToListDeltaResponse = {
  listId: string;
  addedItems: HydratedWishlistItem[];
  addedCount: number;
};

/** Add response that returns the full list (same shape as `getById`). */
export type AddItemsToListLegacyResponse = ListDetail;

export type AddItemsToListResponse =
  | AddItemsToListDeltaResponse
  | AddItemsToListLegacyResponse;

export type UpdateListItemResponse = unknown;
export type RemoveItemFromListResponse = OkResponse;
export type ReorderListItemsResponse = {
  updated: Array<{ id: string; position: number }>;
};
export type MarkListSharedResponse = ListMutationResponse;
export type RevokeListSharedResponse = ListMutationResponse;

