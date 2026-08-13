import type { RequestArgs } from "../../client/request";
import { MAX_PAGINATION_SIZE } from "../../constants";
import { clampPage, clampPageSize } from "../../helpers/pagination";
import {
  isAddItemsDeltaResponse,
  isAddItemsLegacyResponse,
} from "../../types/guards";
import type { PaginatedQuery } from "../../types/query-options";
import type {
  AddItemsToListBody,
  CreateListBody,
  DuplicateListBody,
  ReorderListItemsBody,
  UpdateListBody,
  UpdateListItemBody,
} from "../../types/requests/lists";
import type {
  AddItemsToListDeltaResponse,
  AddItemsToListResponse,
  CreateListResponse,
  DuplicateListResponse,
  GetListResponse,
  GetListsResponse,
  HydratedWishlistItem,
  MarkListSharedResponse,
  RemoveItemFromListResponse,
  RemoveListResponse,
  ReorderListItemsResponse,
  RevokeListSharedResponse,
  UpdateListDetailsResponse,
  UpdateListItemResponse,
} from "../../types/responses/lists";
import type { Pagination } from "../../types/responses/common";

type RequestFn = <TResponse = unknown, TBody = unknown>(
  args: RequestArgs<TBody>,
) => Promise<TResponse>;

export type GetListsQuery = PaginatedQuery;
export type GetListQuery = Omit<PaginatedQuery, "query">;

export type AddItemsBatchedOptions = {
  /** Max items per POST (API hard max is 25). */
  batchSize?: number;
};

export type GetByIdAllItemsOptions = {
  pageSize?: number;
  sortBy?: GetListQuery["sortBy"];
  sortDirection?: GetListQuery["sortDirection"];
};

function chunkItems<T>(items: T[], batchSize: number): T[][] {
  const size = Math.max(1, Math.min(MAX_PAGINATION_SIZE, Math.trunc(batchSize) || MAX_PAGINATION_SIZE));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks.length ? chunks : [[]];
}

export function createListsResource(request: RequestFn) {
  const getById = (listId: string, query?: GetListQuery) =>
    request<GetListResponse>({
      method: "GET",
      path: `/api/lists/${encodeURIComponent(listId)}`,
      auth: "authenticated",
      query,
    });

  const addItems = (listId: string, body: AddItemsToListBody) =>
    request<AddItemsToListResponse, AddItemsToListBody>({
      method: "POST",
      path: `/api/lists/${encodeURIComponent(listId)}/add`,
      auth: "authenticated",
      body,
    });

  return {
    /** Returns all lists for the authenticated customer under the current merchant. */
    getAll: (query?: GetListsQuery) =>
      request<GetListsResponse>({
        method: "GET",
        path: "/api/lists",
        auth: "authenticated",
        query,
      }),

    /** Fetch list details by id. */
    getById,

    /**
     * Fetch every item on a list by walking pages when list detail is paginated.
     * Responses that already include all items on page 1 still work.
     */
    getByIdAllItems: async (listId: string, opts?: GetByIdAllItemsOptions): Promise<GetListResponse> => {
      const pageSize = clampPageSize(opts?.pageSize ?? MAX_PAGINATION_SIZE);
      const sortBy = opts?.sortBy;
      const sortDirection = opts?.sortDirection;

      const first = await getById(listId, {
        page: 1,
        pageSize,
        ...(sortBy ? { sortBy } : {}),
        ...(sortDirection ? { sortDirection } : {}),
      });

      const totalPages = first.pagination?.totalPages ?? 1;
      const allItems: HydratedWishlistItem[] = [...(first.items ?? [])];

      for (let page = 2; page <= totalPages; page++) {
        const next = await getById(listId, {
          page: clampPage(page),
          pageSize,
          ...(sortBy ? { sortBy } : {}),
          ...(sortDirection ? { sortDirection } : {}),
        });
        allItems.push(...(next.items ?? []));
      }

      const pagination: Pagination | undefined = first.pagination
        ? {
            ...first.pagination,
            page: 1,
            pageSize,
            totalCount: first.pagination.totalCount,
            totalPages: first.pagination.totalPages,
          }
        : undefined;

      return {
        ...first,
        items: allItems,
        ...(pagination ? { pagination } : {}),
      };
    },

    /**
     * Create a new list. Do not send `variantIds` — add items via `addItems`
     * or `addItemsBatched` after create.
     */
    create: (body: CreateListBody) =>
      request<CreateListResponse, CreateListBody>({
        method: "POST",
        path: "/api/lists",
        auth: "authenticated",
        body,
      }),

    /** Update list name/description. */
    update: (listId: string, body: UpdateListBody) =>
      request<UpdateListDetailsResponse, UpdateListBody>({
        method: "PATCH",
        path: `/api/lists/${encodeURIComponent(listId)}`,
        auth: "authenticated",
        body,
      }),

    /** Remove a list. */
    remove: (listId: string) =>
      request<RemoveListResponse>({
        method: "DELETE",
        path: `/api/lists/${encodeURIComponent(listId)}`,
        auth: "authenticated",
      }),

    /**
     * Duplicate a list (including all items) in a single call.
     * By default the copy stays in the same group as the source. Pass `groupId`
     * to place it in another group, or `groupId: null` to leave it ungrouped.
     * The copy is named `Copy of {original name}` and is not shared.
     */
    duplicate: (listId: string, body?: DuplicateListBody) =>
      request<DuplicateListResponse, DuplicateListBody>({
        method: "POST",
        path: `/api/lists/${encodeURIComponent(listId)}/duplicate`,
        auth: "authenticated",
        body,
      }),

    /**
     * Add one or more items to a list.
     * The response may be a delta (`addedItems` / `addedCount`) or the full list.
     * Prefer `addItemsBatched` when sending more than 25 items.
     */
    addItems,

    /**
     * Add items in sequential batches of ≤25 (API hard max).
     * Merges delta responses; if any response is a full-list shape,
     * returns the last full-list response.
     */
    addItemsBatched: async (
      listId: string,
      body: AddItemsToListBody,
      opts?: AddItemsBatchedOptions,
    ): Promise<AddItemsToListResponse> => {
      const items = body.items ?? [];
      const batchSize = opts?.batchSize ?? MAX_PAGINATION_SIZE;
      const chunks = chunkItems(items, batchSize);

      let lastLegacy: AddItemsToListResponse | undefined;
      const merged: AddItemsToListDeltaResponse = {
        listId,
        addedItems: [],
        addedCount: 0,
      };
      let sawDelta = false;

      for (const chunk of chunks) {
        const res = await addItems(listId, { items: chunk });
        if (isAddItemsDeltaResponse(res)) {
          sawDelta = true;
          merged.listId = res.listId;
          merged.addedItems.push(...res.addedItems);
          merged.addedCount += res.addedCount;
        } else if (isAddItemsLegacyResponse(res)) {
          lastLegacy = res;
        } else {
          lastLegacy = res;
        }
      }

      if (sawDelta && !lastLegacy) return merged;
      if (lastLegacy) return lastLegacy;
      return merged;
    },

    /** Update an item on a list. */
    updateItem: (listId: string, itemId: string, body: UpdateListItemBody) =>
      request<UpdateListItemResponse, UpdateListItemBody>({
        method: "PATCH",
        path: `/api/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
        auth: "authenticated",
        body,
      }),

    /** Remove an item from a list. */
    removeItem: (listId: string, itemId: string) =>
      request<RemoveItemFromListResponse>({
        method: "DELETE",
        path: `/api/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
        auth: "authenticated",
      }),

    /** Reorder all items in a list. */
    reorderItems: (listId: string, body: ReorderListItemsBody) =>
      request<ReorderListItemsResponse, ReorderListItemsBody>({
        method: "POST",
        path: `/api/lists/${encodeURIComponent(listId)}/reorder`,
        auth: "authenticated",
        body,
      }),

    /** Mark list as shared (public read-only). */
    share: (listId: string) =>
      request<MarkListSharedResponse>({
        method: "POST",
        path: `/api/lists/${encodeURIComponent(listId)}/share`,
        auth: "authenticated",
      }),

    /** Revoke list sharing. */
    unshare: (listId: string) =>
      request<RevokeListSharedResponse>({
        method: "DELETE",
        path: `/api/lists/${encodeURIComponent(listId)}/share`,
        auth: "authenticated",
      }),

    /**
     * Legacy endpoint kept in the OpenAPI spec (`/api/wishlists/{id}/add`).
     * Prefer `addItems(listId, body)` unless your server only supports the legacy route.
     */
    addItemsLegacy: (id: string, body: AddItemsToListBody) =>
      request<AddItemsToListResponse, AddItemsToListBody>({
        method: "POST",
        path: `/api/wishlists/${encodeURIComponent(id)}/add`,
        auth: "authenticated",
        body,
      }),
  };
}
