export type CreateGroupBody = {
  name?: string;
  description?: string;
};

export type UpdateGroupBody = {
  name?: string;
  description?: string;
};

export type ReorderGroupBody = {
  listIds?: string[];
};

