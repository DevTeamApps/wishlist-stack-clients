// NOTE: Most endpoints in the current OpenAPI spec do not define response schemas.
// These named aliases are intentionally stable so you can refine them over time.

type GroupsResponseItem = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
};

export type GetGroupsResponse = {
    groups: GroupsResponseItem[]
};

export type GetGroupResponse = unknown;
export type CreateGroupResponse = unknown;
export type UpdateGroupDetailsResponse = unknown;
export type RemoveGroupResponse = unknown;
export type ReorderGroupResponse = unknown;
export type MarkGroupSharedResponse = unknown;
export type RevokeGroupSharedResponse = unknown;

