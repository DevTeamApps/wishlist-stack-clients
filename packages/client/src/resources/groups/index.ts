import type { RequestArgs } from "../../client/request";
import type { CreateGroupBody, ReorderGroupsBody, UpdateGroupBody } from "../../types/requests/groups";
import type { PaginatedQuery } from "../../types/query-options";
import type {
  CreateGroupResponse,
  DuplicateGroupResponse,
  GetGroupResponse,
  GetGroupsResponse,
  MarkGroupSharedResponse,
  RemoveGroupResponse,
  ReorderGroupsResponse,
  RevokeGroupSharedResponse,
  UpdateGroupDetailsResponse,
} from "../../types/responses/groups";

type RequestFn = <TResponse = unknown, TBody = unknown>(
  args: RequestArgs<TBody>,
) => Promise<TResponse>;

export type GetGroupsQuery = PaginatedQuery<{
  /**
   * When truthy (`true`, `1`, or `"1"`), each group includes embedded `lists`
   * with hydrated items (`includeLists=1`).
   *
   * Expect at most **10 lists × 25 items** per group. For full data use
   * `groups.getById` plus `lists.getById` / `lists.getByIdAllItems`. Groups
   * endpoints may return **503** until the Groups API is enabled for the merchant.
   */
  includeLists?: boolean | 1 | "1";
}>;
export type GetGroupQuery = PaginatedQuery;

function normalizeGetGroupsQuery(query?: GetGroupsQuery): GetGroupsQuery | undefined {
  if (!query) return undefined;
  const { includeLists, ...rest } = query;
  if (includeLists) {
    return { ...rest, includeLists: 1 };
  }
  return Object.keys(rest).length > 0 ? rest : undefined;
}

export function createGroupsResource(request: RequestFn) {
  return {
    /**
     * Fetch groups for the authenticated customer.
     * May return **503** when the Groups API is disabled for this merchant.
     */
    getAll: (query?: GetGroupsQuery) =>
      request<GetGroupsResponse>({
        method: "GET",
        path: "/api/groups",
        auth: "authenticated",
        query: normalizeGetGroupsQuery(query),
      }),

    /**
     * Fetch group details by id.
     * May return **503** when the Groups API is disabled for this merchant.
     */
    getById: (groupId: string, query?: GetGroupQuery) =>
      request<GetGroupResponse>({
        method: "GET",
        path: `/api/groups/${encodeURIComponent(groupId)}`,
        auth: "authenticated",
        query,
      }),

    /** Create a new group. */
    create: (body: CreateGroupBody) =>
      request<CreateGroupResponse, CreateGroupBody>({
        method: "POST",
        path: "/api/groups",
        auth: "authenticated",
        body,
      }),

    /** Update group name/description. */
    update: (groupId: string, body: UpdateGroupBody) =>
      request<UpdateGroupDetailsResponse, UpdateGroupBody>({
        method: "PATCH",
        path: `/api/groups/${encodeURIComponent(groupId)}`,
        auth: "authenticated",
        body,
      }),

    /** Remove a group. */
    remove: (groupId: string) =>
      request<RemoveGroupResponse>({
        method: "DELETE",
        path: `/api/groups/${encodeURIComponent(groupId)}`,
        auth: "authenticated",
      }),

    /**
     * Duplicate a group (including all lists and items) in a single call.
     * The copy is named `Copy of {original name}` and is not shared.
     */
    duplicate: (groupId: string) =>
      request<DuplicateGroupResponse>({
        method: "POST",
        path: `/api/groups/${encodeURIComponent(groupId)}/duplicate`,
        auth: "authenticated",
      }),

    /**
     * Reorder the customer's groups (`POST /api/groups/reorder`).
     * Body must include `groupIds` in the desired order — not list IDs, and
     * not a per-group path.
     */
    reorder: (body: ReorderGroupsBody) =>
      request<ReorderGroupsResponse, ReorderGroupsBody>({
        method: "POST",
        path: "/api/groups/reorder",
        auth: "authenticated",
        body,
      }),

    /** Mark group as shared (public read-only). */
    share: (groupId: string) =>
      request<MarkGroupSharedResponse>({
        method: "POST",
        path: `/api/groups/${encodeURIComponent(groupId)}/share`,
        auth: "authenticated",
      }),

    /** Revoke group sharing. */
    unshare: (groupId: string) =>
      request<RevokeGroupSharedResponse>({
        method: "DELETE",
        path: `/api/groups/${encodeURIComponent(groupId)}/share`,
        auth: "authenticated",
      }),
  };
}
