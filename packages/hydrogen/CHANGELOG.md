# @sdg.la/wishlist-stack-hydrogen

## 0.14.0

### Minor Changes

- [#28](https://github.com/DevTeamApps/wishlist-stack-clients/pull/28) [`99026f7`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/99026f725c3075436a5230133903a50250c0ba34) Thanks [@n8cotoa](https://github.com/n8cotoa)! - Browns readiness / API limits and response shapes (sc-489527).

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

### Patch Changes

- Updated dependencies [[`99026f7`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/99026f725c3075436a5230133903a50250c0ba34)]:
  - @sdg.la/wishlist-stack-sdk@0.14.0

## 0.13.0

### Minor Changes

- [#26](https://github.com/DevTeamApps/wishlist-stack-clients/pull/26) [`5354838`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/53548388e60599285d9ce7812cd407402fb79c94) Thanks [@n8cotoa](https://github.com/n8cotoa)! - Add optional groupId body to lists.duplicate for cross-project and ungrouped copies

### Patch Changes

- Updated dependencies [[`5354838`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/53548388e60599285d9ce7812cd407402fb79c94)]:
  - @sdg.la/wishlist-stack-sdk@0.13.0

## 0.12.0

### Minor Changes

- [#24](https://github.com/DevTeamApps/wishlist-stack-clients/pull/24) [`d5919e6`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/d5919e6b0149bdc915757bd8065a1ee8f51a3e74) Thanks [@tdbunting](https://github.com/tdbunting)! - Add sort options to list queries

### Patch Changes

- Updated dependencies [[`d5919e6`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/d5919e6b0149bdc915757bd8065a1ee8f51a3e74)]:
  - @sdg.la/wishlist-stack-sdk@0.12.0

## Unreleased

### Patch Changes

- Forward `lists.getById` and shared collection query params (including sort) through the Hydrogen lazy client wrapper

## 0.11.0

### Minor Changes

- [#23](https://github.com/DevTeamApps/wishlist-stack-clients/pull/23) [`cfc51f6`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/cfc51f6abc5d014912b9ca2cb4bbd2dbe60c6d11) Thanks [@n8cotoa](https://github.com/n8cotoa)! - Add groups.getAll includeLists support and group/list duplicate endpoints

### Patch Changes

- [#19](https://github.com/DevTeamApps/wishlist-stack-clients/pull/19) [`523f84d`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/523f84d67862f354668fa925bed70183b68581cc) Thanks [@n8cotoa](https://github.com/n8cotoa)! - README update

- [#19](https://github.com/DevTeamApps/wishlist-stack-clients/pull/19) [`17ec8a8`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/17ec8a82e5190bb8ecefee9ebee95fb4b1d4207c) Thanks [@n8cotoa](https://github.com/n8cotoa)! - README update for latest Hydrogen version

- Updated dependencies [[`cfc51f6`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/cfc51f6abc5d014912b9ca2cb4bbd2dbe60c6d11)]:
  - @sdg.la/wishlist-stack-sdk@0.11.0

## 0.10.1

### Patch Changes

- [#17](https://github.com/DevTeamApps/wishlist-stack-clients/pull/17) [`4107e30`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/4107e3075bc395b167cb8cef0a99ce1a6338cd97) Thanks [@n8cotoa](https://github.com/n8cotoa)! - Ensure query args are passed to internal methods for fuzzy search feature

- Updated dependencies []:
  - @sdg.la/wishlist-stack-sdk@0.10.1

## 0.10.0

### Minor Changes

- [#15](https://github.com/DevTeamApps/wishlist-stack-clients/pull/15) [`86932cb`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/86932cb6723bedf14725a435a5ade633ae0d3c54) Thanks [@n8cotoa](https://github.com/n8cotoa)! - Update types for query search parameter

### Patch Changes

- Updated dependencies [[`86932cb`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/86932cb6723bedf14725a435a5ade633ae0d3c54)]:
  - @sdg.la/wishlist-stack-sdk@0.10.0

## 0.9.7

### Patch Changes

- [#13](https://github.com/DevTeamApps/wishlist-stack-clients/pull/13) [`94a1669`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/94a16690ab6dc7a1a71db5582c0a666c3d7e6bd8) Thanks [@tdbunting](https://github.com/tdbunting)! - Add functions to bulk update list item positions

- Updated dependencies [[`94a1669`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/94a16690ab6dc7a1a71db5582c0a666c3d7e6bd8)]:
  - @sdg.la/wishlist-stack-sdk@0.9.7

## 0.9.6

### Patch Changes

- Updated dependencies [[`bd4d49e`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/bd4d49eb0766e3599afc0fe225c06284985ba50d)]:
  - @sdg.la/wishlist-stack-sdk@0.9.6

## 0.9.5

### Patch Changes

- Updated dependencies [[`de5f6d0`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/de5f6d0484384d51055ae4423d772d7e3a4f3c92)]:
  - @sdg.la/wishlist-stack-sdk@0.9.5

## 0.9.4

### Patch Changes

- Updated dependencies [[`9b8c870`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/9b8c8709c3e8a95cc2c48bf18bc69b20486ebf00), [`59c8544`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/59c85448cee0663de223e3f4676aab205914efdd)]:
  - @sdg.la/wishlist-stack-sdk@0.9.4

## 0.9.3

### Patch Changes

- Updated dependencies [[`aee775c`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/aee775c81d2a2674eb25d2cc06dfcb51e92d738b)]:
  - @sdg.la/wishlist-stack-sdk@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies [[`381666e`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/381666e3013c2995f1e96daca79bcc9cbe042ec3)]:
  - @sdg.la/wishlist-stack-sdk@0.9.2

## 0.9.1

### Patch Changes

- [#4](https://github.com/DevTeamApps/wishlist-stack-clients/pull/4) [`8156d29`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/8156d290da9fd5088de53cd812bae9c6ae9d5fde) Thanks [@tdbunting](https://github.com/tdbunting)! - First deploy

- Updated dependencies [[`8156d29`](https://github.com/DevTeamApps/wishlist-stack-clients/commit/8156d290da9fd5088de53cd812bae9c6ae9d5fde)]:
  - @sdg.la/wishlist-stack-sdk@0.9.1

## 0.9.0

Initial release under the @sdg.la organization.

This package was previously published as @devteam-sdg/wjs-hydrogen.
