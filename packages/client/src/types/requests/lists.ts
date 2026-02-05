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
  }>;
};

export type UpdateListItemBody = {
  quantity?: number;
  note?: string;
  position?: number;
};

