export type CreateGroupBody = {
  name?: string;
  description?: string;
};

export type UpdateGroupBody = {
  name?: string;
  description?: string;
};

/**
 * Body for `POST /api/groups/reorder` — reorder the customer's groups.
 * `groupIds` must list every group CUID in the desired order.
 */
export type ReorderGroupsBody = {
  groupIds: string[];
};

/** @deprecated Use `ReorderGroupsBody` (`groupIds` on `POST /api/groups/reorder`). */
export type ReorderGroupBody = ReorderGroupsBody;
