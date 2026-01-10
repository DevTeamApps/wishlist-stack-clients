import type { RequestArgs } from "../../client/request";
import type { GetSharedGroupResponse, GetSharedListResponse } from "../../types/responses/shared";

type RequestFn = <TResponse = unknown, TBody = unknown>(
  args: RequestArgs<TBody>,
) => Promise<TResponse>;

export function createSharedResource(request: RequestFn) {
  return {
    /** Public read-only view of a shared list. Requires only merchant apiKey. */
    getSharedList: (listId: string) =>
      request<GetSharedListResponse>({
        method: "GET",
        path: `/api/shared/list/${encodeURIComponent(listId)}`,
        auth: "merchant",
      }),

    /** Public read-only view of a shared group. Requires only merchant apiKey. */
    getSharedGroup: (groupId: string) =>
      request<GetSharedGroupResponse>({
        method: "GET",
        path: `/api/shared/group/${encodeURIComponent(groupId)}`,
        auth: "merchant",
      }),
  };
}

