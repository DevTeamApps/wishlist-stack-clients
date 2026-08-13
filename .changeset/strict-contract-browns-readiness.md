---
"@sdg.la/wishlist-stack-sdk": minor
"@sdg.la/wishlist-stack-hydrogen": minor
---

Browns readiness / API limits and dual response shapes (sc-489527).

### Migration (storefronts)

- Treat `lists.addItems` as dual-mode: may return `{ listId, addedItems, addedCount }` or the full list. Use `isAddItemsDeltaResponse` / `isAddItemsLegacyResponse`.
- Use `lists.addItemsBatched` when adding more than 25 items.
- Use `lists.getByIdAllItems` (or paginate `getById`) when list detail is paginated (max pageSize 25). Prefer `clampPageSize`.
- Do not send `variantIds` on `lists.create`. Create then add items. `quantity` on add supports 1–999.
- `groups.reorder` is `POST /api/groups/reorder` with `{ groupIds }` (not per-group `listIds`).
- Optional client options: `defaultTimeoutMs`, `retryOnRateLimit`. Errors expose `retryAfter` and rate-limit headers; groups 503 maps to a clear disabled message.
- Register storefront CORS origins when the browser calls the API directly.

### SDK

- Typed `GetListResponse` pagination and add delta/full-list union
- Helpers: `addItemsBatched`, `getByIdAllItems`, `clampPageSize`
- Error / timeout / opt-in 429 retry improvements
- Groups `includeLists` / 503 docs; reorder contract aligned to OpenAPI
