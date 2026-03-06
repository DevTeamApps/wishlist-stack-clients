import type { RequestArgs } from "../../client/request";
import type { PaginatedQuery } from "../../types/query-options";
import type {
  AddItemsToListBody,
  CreateListBody,
  ReorderListItemsBody,
  UpdateListBody,
  UpdateListItemBody,
} from "../../types/requests/lists";
import type {
  AddItemsToListResponse,
  CreateListResponse,
  GetListResponse,
  GetListsResponse,
  MarkListSharedResponse,
  RemoveItemFromListResponse,
  RemoveListResponse,
  ReorderListItemsResponse,
  RevokeListSharedResponse,
  UpdateListDetailsResponse,
  UpdateListItemResponse,
} from "../../types/responses/lists";

type RequestFn = <TResponse = unknown, TBody = unknown>(
  args: RequestArgs<TBody>,
) => Promise<TResponse>;

export type GetListsQuery = PaginatedQuery;
export type GetListQuery = Omit<PaginatedQuery, "query">;

export function createListsResource(request: RequestFn) {
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
    getById: (listId: string, query?: GetListQuery) =>
      request<GetListResponse>({
        method: "GET",
        path: `/api/lists/${encodeURIComponent(listId)}`,
        auth: "authenticated",
        query,
      }),

    /** Create a new list. */
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

    /** Add one or more items to a list. */
    addItems: (listId: string, body: AddItemsToListBody) =>
      request<AddItemsToListResponse, AddItemsToListBody>({
        method: "POST",
        path: `/api/lists/${encodeURIComponent(listId)}/add`,
        auth: "authenticated",
        body,
      }),

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

