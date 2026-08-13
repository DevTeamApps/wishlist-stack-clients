import type {
  AddItemsToListDeltaResponse,
  AddItemsToListLegacyResponse,
  AddItemsToListResponse,
} from "./responses/lists";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * True when the add response is the delta shape
 * (`{ listId, addedItems, addedCount }`).
 */
export function isAddItemsDeltaResponse(
  value: AddItemsToListResponse | unknown,
): value is AddItemsToListDeltaResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.listId === "string" &&
    Array.isArray(value.addedItems) &&
    typeof value.addedCount === "number"
  );
}

/**
 * True when the add response is the full-list shape
 * (same as `lists.getById` without requiring pagination).
 */
export function isAddItemsLegacyResponse(
  value: AddItemsToListResponse | unknown,
): value is AddItemsToListLegacyResponse {
  if (!isRecord(value)) return false;
  if (isAddItemsDeltaResponse(value)) return false;
  return typeof value.id === "string" && Array.isArray(value.items);
}
