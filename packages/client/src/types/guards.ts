import type { AddItemsToListResponse } from "./responses/lists";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * True when the value matches the add-items response shape
 * (`{ listId, addedItems, addedCount }`).
 */
export function isAddItemsDeltaResponse(
  value: AddItemsToListResponse | unknown,
): value is AddItemsToListResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.listId === "string" &&
    Array.isArray(value.addedItems) &&
    typeof value.addedCount === "number"
  );
}
