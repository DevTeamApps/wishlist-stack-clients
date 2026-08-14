/**
 * Create a new list. Do **not** send `variantIds` — the API may reject them.
 * Create the list, then call `lists.addItems` or `lists.addItemsBatched`.
 */
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
    /** Quantity for the item (1–999). */
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

export type DuplicateListBody = {
  /** Destination group. Omit to keep source group; `null` to ungroup. */
  groupId?: string | null;
};

