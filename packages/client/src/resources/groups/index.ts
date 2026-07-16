import type { RequestArgs } from "../../client/request";
import type { CreateGroupBody, ReorderGroupBody, UpdateGroupBody } from "../../types/requests/groups";
import type { PaginatedQuery } from "../../types/query-options";
import type {
  CreateGroupResponse,
  DuplicateGroupResponse,
  GetGroupResponse,
  GetGroupsResponse,
  MarkGroupSharedResponse,
  RemoveGroupResponse,
  ReorderGroupResponse,
  RevokeGroupSharedResponse,
  UpdateGroupDetailsResponse,
} from "../../types/responses/groups";

type RequestFn = <TResponse = unknown, TBody = unknown>(
  args: RequestArgs<TBody>,
) => Promise<TResponse>;

export type GetGroupsQuery = PaginatedQuery<{
  /**
   * When truthy (`true`, `1`, or `"1"`), each group includes its full `lists`
   * array with hydrated items. Sent to the API as `includeLists=1`.
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
    /** Fetch groups for the authenticated customer. */
    getAll: (query?: GetGroupsQuery) =>
      request<GetGroupsResponse>({
        method: "GET",
        path: "/api/groups",
        auth: "authenticated",
        query: normalizeGetGroupsQuery(query),
      }),

    /** Fetch group details by id. */
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

    /** Reorder a group (spec uses listIds payload). */
    reorder: (groupId: string, body: ReorderGroupBody) =>
      request<ReorderGroupResponse, ReorderGroupBody>({
        method: "POST",
        path: `/api/groups/${encodeURIComponent(groupId)}/reorder`,
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
