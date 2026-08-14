---
"@sdg.la/wishlist-stack-sdk": minor
"@sdg.la/wishlist-stack-hydrogen": minor
---

Browns readiness / API limits and response shapes (sc-489527).

### Migration (storefronts)

- `lists.addItems` returns `{ listId, addedItems, addedCount }` (not the full list). Refresh with `lists.getById` / `getByIdAllItems` when you need every item.
- Use `lists.addItemsBatched` when adding more than 25 items.
- List detail is paginated (max pageSize 25) and includes `pagination`. Prefer `clampPageSize` / `getByIdAllItems`.
- Do not send `variantIds` on `lists.create`. Create then add items. `quantity` on add supports 1–999.
- `groups.reorder` is `POST /api/groups/reorder` with `{ groupIds }` (not per-group `listIds`).
- Optional client options: `defaultTimeoutMs`, `retryOnRateLimit`. Errors expose `retryAfter` and rate-limit headers; groups 503 maps to a clear disabled message.
- Register storefront CORS origins when the browser calls the API directly.

### SDK

- Typed `GetListResponse.pagination` and add delta response
- Helpers: `addItemsBatched`, `getByIdAllItems`, `clampPageSize`
- Error / timeout / opt-in 429 retry improvements
- Groups `includeLists` / 503 docs; reorder contract aligned to OpenAPI
