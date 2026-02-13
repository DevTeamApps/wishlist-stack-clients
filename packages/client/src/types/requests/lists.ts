export type CreateListBody = {
  name?: string;
  description?: string;
  groupId?: string;
};

export type UpdateListBody = {
  name?: string;
  description?: string;
  groupId?: string;
};

export type AddItemsToListBody = {
  items?: Array<{
    variantId?: string;
    quantity?: number;
    note?: string;
    properties?: Record<string, unknown> | null;
  }>;
};

export type UpdateListItemBody = {
  variantId?: string;
  quantity?: number;
  note?: string;
  position?: number;
  properties?: Record<string, unknown> | null;
};

export type ReorderListItemsBody = {
  items: Array<{ id: string; position: number }>;
};

