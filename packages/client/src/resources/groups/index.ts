import type { RequestArgs } from "../../client/request";
import type { CreateGroupBody, ReorderGroupBody, UpdateGroupBody } from "../../types/requests/groups";
import type { PaginatedQuery } from "../../types/query-options";
import type {
  CreateGroupResponse,
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

export type GetGroupsQuery = PaginatedQuery;
export type GetGroupQuery = PaginatedQuery;

export function createGroupsResource(request: RequestFn) {
  return {
    /** Fetch groups for the authenticated customer. */
    getAll: (query?: GetGroupsQuery) =>
      request<GetGroupsResponse>({
        method: "GET",
        path: "/api/groups",
        auth: "authenticated",
        query,
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

