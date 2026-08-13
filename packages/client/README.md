# @sdg.la/wishlist-stack-sdk

[![npm version](https://img.shields.io/npm/v/@sdg.la/wishlist-stack-sdk.svg)](https://www.npmjs.com/package/@sdg.la/wishlist-stack-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

TypeScript/JavaScript SDK for the Wishlist Stack API.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Server / Node.js / Workers](#server--nodejs--workers)
  - [Browser](#browser)
  - [Raw HTML (script module)](#raw-html-script-module)
  - [Shopify Liquid authentication](#shopify-liquid-authentication)
  - [Class API](#class-api)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Sorting](#sorting)
- [API Reference](#api-reference)
  - [Groups](#groups)
  - [Lists](#lists)
  - [Shared](#shared)
- [TypeScript Types](#typescript-types)
  - [Domain Types](#domain-types)
- [Related Packages](#related-packages)
- [License](#license)

## Features

- **TypeScript-first** — Full type definitions with exported types for all requests and responses
- **Universal** — Works in Node.js, browsers, and edge runtimes (Cloudflare Workers, Deno, etc.)
- **Flexible API** — Choose between functional `createWishlistStackClient()` or class-based `new WishlistStackClient()`
- **Built-in error handling** — Structured `WishlistStackApiError` with status codes, `Retry-After` / rate-limit headers, and API error messages
- **Pagination support** — List endpoints support `page` and `pageSize` (max **25**); helpers fetch all pages when needed
- **Batch helpers** — `lists.addItemsBatched` chunks adds to the max of 25 items per request
- **Sort support** — Collection endpoints accept `sortBy` (`position` | `createdAt` | `updatedAt`) and `sortDirection` (`asc` | `desc`)

## Requirements

- **Node.js 18+** (uses native `fetch`) or provide a custom `fetch` implementation
- **Modern browsers** with native `fetch` support

## Installation

```bash
npm install @sdg.la/wishlist-stack-sdk
```

```bash
yarn add @sdg.la/wishlist-stack-sdk
```

```bash
pnpm add @sdg.la/wishlist-stack-sdk
```

## Quick Start

```ts
import { createWishlistStackClient } from '@sdg.la/wishlist-stack-sdk';

const client = createWishlistStackClient({
  apiKey: 'your-merchant-api-key',
  customerAccessToken: 'customer-access-token', // required for authenticated endpoints
  // optional:
  // defaultTimeoutMs: 10_000,
  // retryOnRateLimit: true, // single retry with jitter on HTTP 429
});

// Fetch all groups
const { groups } = await client.groups.getAll();

// Fetch all lists
const { lists } = await client.lists.getAll();
```

### Pagination, batching, and add responses

The API paginates list detail (max `pageSize` **25**) and may return either a full list or an add **delta**. Use the helpers and type guards so storefronts work against both response shapes:

| Concern | Guidance |
|---------|----------|
| List detail | Prefer `page` / `pageSize` ≤ 25, or `lists.getByIdAllItems` for every item |
| Adding many items | Use `lists.addItemsBatched` (chunks of ≤ 25) |
| Add response | Delta `{ listId, addedItems, addedCount }` or full list — narrow with `isAddItemsDeltaResponse` |
| Create + items | Do not send `variantIds` on create; create the list, then `addItems` |
| `quantity` on add | Supported **1–999** (some deployments may still store `1`) |
| `includeLists` | Cap of **10 lists × 25 items**; use `getById` helpers for full data |
| Groups | May return **503** until enabled for the merchant |

```ts
import {
  isAddItemsDeltaResponse,
  clampPageSize,
} from '@sdg.la/wishlist-stack-sdk';

const res = await client.lists.addItemsBatched(id, { items: many });
if (isAddItemsDeltaResponse(res)) {
  // res.addedItems / res.addedCount — then refresh if needed:
  const full = await client.lists.getByIdAllItems(id, {
    pageSize: clampPageSize(25),
  });
}
```

## Usage

### Server / Node.js / Workers

```ts
import { createWishlistStackClient } from '@sdg.la/wishlist-stack-sdk';

const client = createWishlistStackClient({
  apiKey: process.env.WISHLIST_STACK_API_KEY!,
  baseUrl: process.env.WISHLIST_STACK_BASE_URL, // optional, defaults to production
  customerAccessToken: '...customer_access_token...',
});

const { groups } = await client.groups.getAll();
```

### Browser

```ts
import { createWishlistStackClient } from '@sdg.la/wishlist-stack-sdk';

const client = createWishlistStackClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://wishlist.devteam.run', // optional default
  customerAccessToken: '...optional...',
});

const { lists } = await client.lists.getAll();
```

> **Note:** If you use a strict Content Security Policy (CSP), you must allow your API domain in `connect-src`.

### Raw HTML (script module)

You can load the SDK in plain HTML without a bundler by using a `<script type="module">` tag and importing from a CDN:

```html
<script type="module">
  import { createWishlistStackClient } from "https://cdn.jsdelivr.net/npm/@sdg.la/wishlist-stack-sdk@0.10.1/+esm";

  window.wishlistClient = createWishlistStackClient({
    apiKey: "YOUR_MERCHANT_API_KEY",
    customerAccessToken: "...",
  });

  // Example usage:
  await window.wishlistClient.groups.getAll();
  await window.wishlistClient.lists.getAll();
</script>
```

Pin the version in the CDN URL (as shown above) so updates do not break your integration unexpectedly.

> **Note:** With a strict CSP, allow `https://cdn.jsdelivr.net` in `script-src` (for the module import) and your API domain in `connect-src`.

### Shopify Liquid authentication

Authenticated SDK calls require a customer access token. For Liquid themes, obtain one via Shopify's Customer Account API OAuth flow in the browser.

See [AUTH_EXAMPLE.md](./AUTH_EXAMPLE.md) for an example-only reference implementation adapted from Shopify's docs.

### Class API

If you prefer a class-based API, use `WishlistStackSDK`:

```ts
import { WishlistStackSDK } from '@sdg.la/wishlist-stack-sdk';

const client = new WishlistStackSDK({
  apiKey: process.env.WISHLIST_STACK_API_KEY!,
  baseUrl: process.env.WISHLIST_STACK_BASE_URL,
  customerAccessToken: '...optional...',
});

await client.groups.getAll();
await client.lists.getById('list-id');
```

**Back-compat aliases** are available on the class:

```ts
await client.getGroups();        // alias for client.groups.getAll()
await client.getGroupById('id'); // alias for client.groups.getById('id')
await client.getLists();         // alias for client.lists.getAll()
```

## Error Handling

Non-2xx responses throw `WishlistStackApiError`. Use the `isWishlistStackApiError` type guard for safe handling:

```ts
import { isWishlistStackApiError } from '@sdg.la/wishlist-stack-sdk';

try {
  await client.groups.getAll();
} catch (error) {
  if (isWishlistStackApiError(error)) {
    console.log(error.status);           // HTTP status code
    console.log(error.apiErrors);        // Array of { message, field? }
    console.log(error.apiErrorMessages); // Array of error message strings
    console.log(error.requestId);        // Request ID for debugging
    console.log(error.retryAfter);       // Retry-After header (429)
    console.log(error.rateLimit);        // X-RateLimit-* headers when present
  }
}
```

Groups endpoints may return **503** with message `Groups API disabled for this merchant` until the Groups API is enabled.

## Pagination

Endpoints that return lists support pagination via query parameters. Keep `pageSize` in **1–25** (use `clampPageSize()`). Prefer `lists.getByIdAllItems()` when you need every item.

```ts
import { clampPageSize } from '@sdg.la/wishlist-stack-sdk';

// Paginate groups
await client.groups.getAll({ page: 2, pageSize: 10 });

// includeLists is capped at 10 lists × 25 items
await client.groups.getAll({ includeLists: true });

// Paginate lists within a group
await client.groups.getById('group-id', { page: 1, pageSize: 25 });

// Paginate items within a list
await client.lists.getById('list-id', {
  page: 1,
  pageSize: clampPageSize(25),
});

// Or fetch every page:
await client.lists.getByIdAllItems('list-id', { pageSize: 25 });
```

**Pagination response structure:**

```ts
{
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

## Sorting

Collection endpoints accept optional sort parameters. Defaults match historical behavior (`sortBy=position`, `sortDirection=asc`). Sorting applies only to the primary collection returned by the endpoint.

```ts
// Recently updated groups first
await client.groups.getAll({ sortBy: 'updatedAt', sortDirection: 'desc' });

// Newest lists first
await client.lists.getAll({ sortBy: 'createdAt', sortDirection: 'desc' });

// Sort items in a list by updatedAt
await client.lists.getById('list-id', { sortBy: 'updatedAt', sortDirection: 'desc' });

// Shared endpoints support the same params
await client.shared.getSharedList('list-id', { sortBy: 'createdAt', sortDirection: 'asc' });
```

## API Reference

### Groups

> [View full Groups API reference](https://wishlist.devteam.run/docs#/groups)

---

#### `groups.getAll(query?)`

Fetch all groups for the authenticated customer.

- **Endpoint:** `GET /api/groups`
- **Parameters:** `query?` — `{ page?: number; pageSize?: number; query?: string; includeLists?: boolean | 1 | "1"; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetGroupsResponse>`

Pass `includeLists: true` (sent as `includeLists=1`) to embed lists under each group with hydrated items. Expect at most **10 lists × 25 items** per group — use `groups.getById` + `lists.getById` / `lists.getByIdAllItems` for full data. Without `includeLists`, `lists` is an empty array and only `featuredItems` are populated. Groups may return **503** until enabled for the merchant.

```ts
const { groups, pagination } = await client.groups.getAll({ page: 1, pageSize: 10, query: 'holiday', sortBy: 'updatedAt', sortDirection: 'desc' });

// Include lists + hydrated items
const { groups: withLists } = await client.groups.getAll({ includeLists: true });
```

<details>
<summary>Example response</summary>

```json
{
  "groups": [
    {
      "id": "cml8drad90001js09weonjojg",
      "name": "Holiday Lists",
      "description": "All my holiday wishlists",
      "position": 1,
      "shared": false,
      "listCount": 2,
      "lists": [],
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-18T12:00:00.000Z",
      "featuredItems": [
        {
          "variantId": 46932429275374,
          "image": {
            "altText": "Product image",
            "url": "https://cdn.shopify.com/s/files/1/example.jpg",
            "width": 800,
            "height": 800
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

</details>

<details>
<summary>Example response with <code>includeLists: true</code></summary>

```json
{
  "groups": [
    {
      "id": "cml8drad90001js09weonjojg",
      "name": "Holiday Lists",
      "description": "All my holiday wishlists",
      "position": 1,
      "shared": false,
      "listCount": 1,
      "lists": [
        {
          "id": "cml8drg8x0003js093j4ua6p8",
          "name": "Gift Ideas",
          "description": "Birthday gift ideas",
          "position": 1,
          "shared": false,
          "itemCount": 1,
          "items": [
            {
              "id": "item_1",
              "quantity": 1,
              "position": 1,
              "userNote": null,
              "product": {
                "id": "gid://shopify/Product/1",
                "title": "Example Product",
                "description": "",
                "availableForSale": true,
                "handle": "example-product",
                "productType": null,
                "category": null,
                "tags": [],
                "onlineStoreUrl": null,
                "metafields": [],
                "vendor": null,
                "variant": {
                  "id": "46932429275374",
                  "title": "Default",
                  "price": { "amount": "10.00", "currencyCode": "USD" },
                  "availableForSale": true,
                  "currentlyNotInStock": false,
                  "selectedOptions": [],
                  "metafields": []
                }
              }
            }
          ]
        }
      ],
      "featuredItems": [],
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-18T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

</details>

---

#### `groups.getById(groupId, query?)`

Fetch a single group by ID. Lists within the group are paginated.

- **Endpoint:** `GET /api/groups/{groupId}`
- **Parameters:**
  - `groupId` — `string`
  - `query?` — `{ page?: number; pageSize?: number; query?: string; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetGroupResponse>`

```ts
const group = await client.groups.getById('group-id', { page: 1, pageSize: 25, query: 'gift', sortBy: 'updatedAt', sortDirection: 'desc' });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drad90001js09weonjojg",
  "name": "Holiday Lists",
  "description": "All my holiday wishlists",
  "position": 1,
  "shared": false,
  "listCount": 1,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-18T12:00:00.000Z",
  "lists": [
    {
      "id": "cml8drg8x0003js093j4ua6p8",
      "name": "Gift Ideas",
      "description": "Birthday gift ideas",
      "position": 1,
      "shared": false,
      "itemCount": 2,
      "featuredItems": [
        {
          "variantId": 46932429275374,
          "image": {
            "altText": "Product image",
            "url": "https://cdn.shopify.com/s/files/1/example.jpg",
            "width": 800,
            "height": 800
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

</details>

---

#### `groups.create(body)`

Create a new group.

- **Endpoint:** `POST /api/groups`
- **Parameters:** `body` — `{ name?: string; description?: string }`
- **Returns:** `Promise<CreateGroupResponse>`

```ts
const group = await client.groups.create({ name: 'Favorites', description: 'My favorite items' });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drad90001js09weonjojg",
  "name": "Favorites",
  "description": "My favorite items",
  "position": 1,
  "shared": false,
  "listCount": 0,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

</details>

---

#### `groups.update(groupId, body)`

Update a group's name or description.

- **Endpoint:** `PATCH /api/groups/{groupId}`
- **Parameters:**
  - `groupId` — `string`
  - `body` — `{ name?: string; description?: string }`
- **Returns:** `Promise<UpdateGroupDetailsResponse>`

```ts
await client.groups.update('group-id', { name: 'Renamed Group' });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drad90001js09weonjojg",
  "name": "Renamed Group",
  "description": "All my holiday wishlists",
  "position": 1,
  "shared": false,
  "listCount": 2,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `groups.remove(groupId)`

Remove a group. Lists assigned to the group are unassigned, not deleted.

- **Endpoint:** `DELETE /api/groups/{groupId}`
- **Parameters:** `groupId` — `string`
- **Returns:** `Promise<RemoveGroupResponse>`

```ts
await client.groups.remove('group-id');
```

<details>
<summary>Example response</summary>

```json
{ "ok": true }
```

</details>

---

#### `groups.duplicate(groupId)`

Duplicate a group in a single call, including all of its lists and items. The copy is named `Copy of {original name}` and is not shared.

- **Endpoint:** `POST /api/groups/{groupId}/duplicate`
- **Parameters:** `groupId` — `string`
- **Returns:** `Promise<DuplicateGroupResponse>`

```ts
const copy = await client.groups.duplicate('group-id');
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cmlbe49qk0001ju094x1ya9co",
  "name": "Copy of Holiday Lists",
  "description": "All my holiday wishlists",
  "position": 2,
  "shared": false,
  "listCount": 2,
  "createdAt": "2025-01-22T09:15:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `groups.reorder(body)`

Reorder the customer's groups.

- **Endpoint:** `POST /api/groups/reorder`
- **Parameters:**
  - `body` — `{ groupIds: string[] }` (group CUIDs in the desired order)
- **Returns:** `Promise<ReorderGroupsResponse>`

```ts
await client.groups.reorder({ groupIds: ['group-3', 'group-1', 'group-2'] });
```

---

#### `groups.share(groupId)`

Mark a group as shared (public read-only). Also shares all lists within the group.

- **Endpoint:** `POST /api/groups/{groupId}/share`
- **Parameters:** `groupId` — `string`
- **Returns:** `Promise<MarkGroupSharedResponse>`

```ts
await client.groups.share('group-id');
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cmlbe49qk0001ju094x1ya9co",
  "name": "Holiday Lists",
  "description": "All my holiday wishlists",
  "position": 1,
  "shared": true,
  "listCount": 2,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `groups.unshare(groupId)`

Revoke sharing for a group and all of its lists.

- **Endpoint:** `DELETE /api/groups/{groupId}/share`
- **Parameters:** `groupId` — `string`
- **Returns:** `Promise<RevokeGroupSharedResponse>`

```ts
await client.groups.unshare('group-id');
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cmlbe49qk0001ju094x1ya9co",
  "name": "Holiday Lists",
  "description": "All my holiday wishlists",
  "position": 1,
  "shared": false,
  "listCount": 2,
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

### Lists

> [View full Lists API reference](https://wishlist.devteam.run/docs#/lists)

---

#### `lists.getAll(query?)`

Fetch all lists for the authenticated customer.

- **Endpoint:** `GET /api/lists`
- **Parameters:** `query?` — `{ page?: number; pageSize?: number; query?: string; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetListsResponse>`

```ts
const { lists, pagination } = await client.lists.getAll({ page: 1, pageSize: 10, sortBy: 'updatedAt', sortDirection: 'desc' });
```

<details>
<summary>Example response</summary>

```json
{
  "lists": [
    {
      "id": "cml8drg8x0003js093j4ua6p8",
      "name": "Gift Ideas",
      "description": "Birthday gift ideas",
      "position": 1,
      "shared": false,
      "itemCount": 3,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T14:00:00.000Z",
      "featuredProducts": [
        {
          "variantId": 46932429275374,
          "image": {
            "altText": "Product image",
            "url": "https://cdn.shopify.com/s/files/1/example.jpg",
            "width": 800,
            "height": 800
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

</details>

---

#### `lists.getById(listId, query?)`

Fetch a single list by ID. Items are hydrated with Shopify product data and may be paginated. When paginated, the response includes `pagination` (max `pageSize` **25**).

- **Endpoint:** `GET /api/lists/{listId}`
- **Parameters:**
  - `listId` — `string`
  - `query?` — `{ page?: number; pageSize?: number; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetListResponse>` (`ListDetail & { pagination?: Pagination }`)

```ts
const list = await client.lists.getById('list-id', { page: 1, pageSize: 25, sortBy: 'updatedAt', sortDirection: 'desc' });
// list.pagination?.totalPages when the API returns pagination
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Gift Ideas",
  "description": "Birthday gift ideas",
  "position": 1,
  "shared": false,
  "itemCount": 1,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:00:00.000Z",
  "items": [
    {
      "id": "cml8dveoj0002jf09vsqw10r2",
      "userNote": "Love this one",
      "quantity": 1,
      "position": 1,
      "product": {
        "id": "gid://shopify/Product/123456789",
        "title": "Classic T-Shirt",
        "description": "A comfortable classic t-shirt",
        "availableForSale": true,
        "handle": "classic-t-shirt",
        "productType": "Apparel",
        "category": null,
        "tags": ["summer", "casual"],
        "onlineStoreUrl": "https://example.myshopify.com/products/classic-t-shirt",
        "metafields": [],
        "variant": {
          "id": "gid://shopify/ProductVariant/46932429275374",
          "title": "Medium / Blue",
          "sku": "TSHIRT-M-BLUE",
          "price": { "amount": "29.99", "currencyCode": "USD" },
          "compareAtPrice": null,
          "availableForSale": true,
          "currentlyNotInStock": false,
          "selectedOptions": [
            { "name": "Size", "value": "Medium" },
            { "name": "Color", "value": "Blue" }
          ],
          "image": {
            "altText": "Classic T-Shirt in Blue",
            "url": "https://cdn.shopify.com/s/files/1/example.jpg",
            "width": 800,
            "height": 800
          },
          "metafields": []
        },
        "vendor": "Example Brand"
      },
      "properties": null
    }
  ]
}
```

</details>

---

#### `lists.getByIdAllItems(listId, opts?)`

Walk every page of `lists.getById` and return one list with all items concatenated. Use when you need the full wishlist and list detail is paginated.

```ts
const full = await client.lists.getByIdAllItems('list-id', { pageSize: 25 });
```

---

#### `lists.create(body)`

Create a new list, optionally assigned to a group. Do **not** send `variantIds` on create (the API may reject them). Create the list, then call `addItems` / `addItemsBatched`.

- **Endpoint:** `POST /api/lists`
- **Parameters:** `body` — `{ name?: string; description?: string; groupId?: string }`
- **Returns:** `Promise<CreateListResponse>`

```ts
const list = await client.lists.create({ name: 'Gift Ideas', groupId: 'group-id' });
await client.lists.addItems(list.id, {
  items: [{ variantId: 'gid://shopify/ProductVariant/123', quantity: 2 }],
});
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Gift Ideas",
  "description": null,
  "position": 1,
  "shared": false,
  "itemCount": 0,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

</details>

---

#### `lists.update(listId, body)`

Update a list's name, description, or group assignment.

- **Endpoint:** `PATCH /api/lists/{listId}`
- **Parameters:**
  - `listId` — `string`
  - `body` — `{ name?: string; description?: string; groupId?: string }`
- **Returns:** `Promise<UpdateListDetailsResponse>`

```ts
await client.lists.update('list-id', { name: 'Renamed List' });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Renamed List",
  "description": "Birthday gift ideas",
  "position": 1,
  "shared": false,
  "itemCount": 3,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `lists.remove(listId)`

Remove a list and all of its items.

- **Endpoint:** `DELETE /api/lists/{listId}`
- **Parameters:** `listId` — `string`
- **Returns:** `Promise<RemoveListResponse>`

```ts
await client.lists.remove('list-id');
```

<details>
<summary>Example response</summary>

```json
{ "ok": true }
```

</details>

---

#### `lists.duplicate(listId, body?)`

Duplicate a list in a single call, including all of its items (notes and custom `properties` preserved). By default the copy stays in the same group as the source. Pass an optional body to place it in another group or leave it ungrouped. The copy is named `Copy of {original name}` and is not shared.

- **Endpoint:** `POST /api/lists/{listId}/duplicate`
- **Parameters:**
  - `listId` — `string`
  - `body?` — `DuplicateListBody` (`{ groupId?: string | null }`)
- **Returns:** `Promise<DuplicateListResponse>`

```ts
// Same group as source (default)
const copy = await client.lists.duplicate('list-id');

// Place copy in another group (cross-project)
const crossProject = await client.lists.duplicate('list-id', { groupId: 'other-group-id' });

// Leave copy ungrouped
const ungrouped = await client.lists.duplicate('list-id', { groupId: null });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Copy of Gift Ideas",
  "description": "Birthday gift ideas",
  "position": 2,
  "shared": false,
  "itemCount": 3,
  "createdAt": "2025-01-22T09:15:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `lists.addItems(listId, body)`

Add one or more items to a list. Prefer `lists.addItemsBatched` when sending more than **25** items.

- **Endpoint:** `POST /api/lists/{listId}/add`
- **Parameters:**
  - `listId` — `string`
  - `body` — `AddItemsToListBody`

```ts
type AddItemsToListBody = {
  items?: Array<{
    variantId?: string;
    /** Supported range 1–999 (some deployments may still store 1). */
    quantity?: number;
    note?: string;
    properties?: Record<string, unknown> | null;
  }>;
};
```

- **Returns:** `Promise<AddItemsToListResponse>` — either:
  - Delta: `{ listId, addedItems, addedCount }`
  - Full list (same shape as `getById`)

Use `isAddItemsDeltaResponse` / `isAddItemsLegacyResponse` to narrow.

```ts
import { isAddItemsDeltaResponse } from '@sdg.la/wishlist-stack-sdk';

const res = await client.lists.addItems('list-id', {
  items: [
    { variantId: 'gid://shopify/ProductVariant/123', quantity: 1 },
    { variantId: 'gid://shopify/ProductVariant/456', note: 'Size M' },
  ],
});

if (isAddItemsDeltaResponse(res)) {
  console.log(res.addedCount, res.addedItems);
}
```

#### `lists.addItemsBatched(listId, body, opts?)`

Chunks `items` into sequential POSTs of ≤25 (configurable via `opts.batchSize`) and merges delta responses when present.

```ts
const res = await client.lists.addItemsBatched('list-id', { items: many });
```

---

#### `lists.updateItem(listId, itemId, body)`

Update an item on a list (variant, quantity, note, position, or custom properties). When `variantId` is provided, the item's product data is re-fetched from Shopify to reflect the new variant.

- **Endpoint:** `PATCH /api/lists/{listId}/items/{itemId}`
- **Parameters:**
  - `listId` — `string`
  - `itemId` — `string`
  - `body` — `{ variantId?: string; quantity?: number; note?: string; position?: number; properties?: Record<string, unknown> | null }`
- **Returns:** `Promise<UpdateListItemResponse>` — the updated hydrated item

```ts
await client.lists.updateItem('list-id', 'item-id', { quantity: 3, note: 'Updated note' });

// Change the variant stored on the item
await client.lists.updateItem('list-id', 'item-id', { variantId: '46932429275374' });
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8dveoj0002jf09vsqw10r2",
  "userNote": "Updated note",
  "quantity": 3,
  "position": 1,
  "product": {
    "id": "gid://shopify/Product/123456789",
    "title": "Classic T-Shirt",
    "description": "A comfortable classic t-shirt",
    "availableForSale": true,
    "handle": "classic-t-shirt",
    "productType": "Apparel",
    "category": null,
    "tags": ["summer", "casual"],
    "onlineStoreUrl": "https://example.myshopify.com/products/classic-t-shirt",
    "metafields": [],
    "variant": {
      "id": "gid://shopify/ProductVariant/46932429275374",
      "title": "Medium / Blue",
      "sku": "TSHIRT-M-BLUE",
      "price": { "amount": "29.99", "currencyCode": "USD" },
      "compareAtPrice": null,
      "availableForSale": true,
      "currentlyNotInStock": false,
      "selectedOptions": [
        { "name": "Size", "value": "Medium" },
        { "name": "Color", "value": "Blue" }
      ],
      "image": {
        "altText": "Classic T-Shirt in Blue",
        "url": "https://cdn.shopify.com/s/files/1/example.jpg",
        "width": 800,
        "height": 800
      },
      "metafields": []
    },
    "vendor": "Example Brand"
  },
  "properties": null
}
```

</details>

---

#### `lists.removeItem(listId, itemId)`

Remove an item from a list.

- **Endpoint:** `DELETE /api/lists/{listId}/items/{itemId}`
- **Parameters:**
  - `listId` — `string`
  - `itemId` — `string`
- **Returns:** `Promise<RemoveItemFromListResponse>`

```ts
await client.lists.removeItem('list-id', 'item-id');
```

<details>
<summary>Example response</summary>

```json
{ "ok": true }
```

</details>

---

#### `lists.reorderItems(listId, body)`

Reorder items in a list. You can submit all items or just a subset. Each submitted item specifies its ID and desired 1-based position. Items not included in the request keep their relative order and fill the remaining slots.

- **Endpoint:** `POST /api/lists/{listId}/reorder`
- **Parameters:**
  - `listId` — `string`
  - `body` — `{ items: Array<{ id: string; position: number }> }`
- **Returns:** `Promise<ReorderListItemsResponse>`

```ts
await client.lists.reorderItems('list-id', {
  items: [
    { id: 'item-3', position: 1 },
    { id: 'item-1', position: 2 },
    { id: 'item-2', position: 3 },
  ],
});
```

<details>
<summary>Example response</summary>

```json
{
  "updated": [
    { "id": "item-3", "position": 1 },
    { "id": "item-1", "position": 2 },
    { "id": "item-2", "position": 3 }
  ]
}
```

</details>

---

#### `lists.share(listId)`

Mark a list as shared (public read-only).

- **Endpoint:** `POST /api/lists/{listId}/share`
- **Parameters:** `listId` — `string`
- **Returns:** `Promise<MarkListSharedResponse>`

```ts
await client.lists.share('list-id');
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Gift Ideas",
  "description": "Birthday gift ideas",
  "position": 1,
  "shared": true,
  "itemCount": 3,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

---

#### `lists.unshare(listId)`

Revoke sharing for a list.

- **Endpoint:** `DELETE /api/lists/{listId}/share`
- **Parameters:** `listId` — `string`
- **Returns:** `Promise<RevokeListSharedResponse>`

```ts
await client.lists.unshare('list-id');
```

<details>
<summary>Example response</summary>

```json
{
  "id": "cml8drg8x0003js093j4ua6p8",
  "name": "Gift Ideas",
  "description": "Birthday gift ideas",
  "position": 1,
  "shared": false,
  "itemCount": 3,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-22T09:15:00.000Z"
}
```

</details>

### Shared

Public read-only endpoints for accessing shared lists and groups. These require only the merchant `apiKey` — no customer access token needed.

> [View full Shared API reference](https://wishlist.devteam.run/docs#/shared)

---

#### `shared.getSharedList(listId, query?)`

Fetch a public shared list with hydrated product details.

- **Endpoint:** `GET /api/shared/list/{listId}`
- **Parameters:**
  - `listId` — `string`
  - `query?` — `{ page?: number; pageSize?: number; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetSharedListResponse>` — same response shape as [`lists.getById`](#listsgetbyidlistid-query)

```ts
const list = await client.shared.getSharedList('list-id', { sortBy: 'updatedAt', sortDirection: 'desc' });
```

---

#### `shared.getSharedGroup(groupId, query?)`

Fetch a public shared group and its lists.

- **Endpoint:** `GET /api/shared/group/{groupId}`
- **Parameters:**
  - `groupId` — `string`
  - `query?` — `{ page?: number; pageSize?: number; query?: string; sortBy?: 'position' | 'createdAt' | 'updatedAt'; sortDirection?: 'asc' | 'desc' }`
- **Returns:** `Promise<GetSharedGroupResponse>` — same response shape as [`groups.getById`](#groupsgetbyidgroupid-query)

```ts
const group = await client.shared.getSharedGroup('group-id', { sortBy: 'createdAt', sortDirection: 'asc' });
```

## TypeScript Types

The package exports all request, response, and domain types. Import what you need:

```ts
import type {
  // Client
  CreateWishlistStackClientOptions,
  WishlistStackClient,

  // Errors
  WishlistStackApiError,
  WishlistStackApiErrorDetails,
  isWishlistStackApiError,

  // Helpers
  clampPageSize,
  isAddItemsDeltaResponse,
  isAddItemsLegacyResponse,

  // Groups
  GetGroupsResponse,
  GetGroupResponse,
  GroupSummary,
  GroupSummaryList,
  GroupDetail,
  GroupDetailList,
  GroupMutationResponse,
  CreateGroupBody,
  UpdateGroupBody,
  ReorderGroupsBody,
  ReorderGroupBody,
  ReorderGroupsResponse,
  DuplicateGroupResponse,

  // Lists
  GetListsResponse,
  GetListResponse,
  ListSummary,
  ListDetail,
  ListMutationResponse,
  CreateListBody,
  UpdateListBody,
  AddItemsToListBody,
  AddItemsToListResponse,
  AddItemsToListDeltaResponse,
  AddItemsToListLegacyResponse,
  UpdateListItemBody,
  ReorderListItemsBody,
  ReorderListItemsResponse,
  DuplicateListBody,
  DuplicateListResponse,

  // Shared
  GetSharedListResponse,
  GetSharedGroupResponse,

  // Items & Products
  HydratedWishlistItem,
  HydratedProduct,
  HydratedVariant,
  Money,
  SelectedOption,
  Metafield,

  // Common
  Pagination,
  PaginationParams,
  OkResponse,
  Image,
  FeaturedItem,
} from '@sdg.la/wishlist-stack-sdk';
```

### Domain Types

Below are the key domain types returned by the SDK. Expand any section to see the full shape.

<details>
<summary><code>Pagination</code></summary>

```ts
type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
```

</details>

<details>
<summary><code>GroupSummary</code></summary>

```ts
type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
  /** Empty unless `includeLists` was requested on `groups.getAll()`. */
  lists: GroupSummaryList[];
  featuredItems: FeaturedItem[];
  createdAt: string;
  updatedAt: string;
};

type GroupSummaryList = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  itemCount: number;
  items: HydratedWishlistItem[];
};
```

</details>

<details>
<summary><code>GroupDetail</code></summary>

```ts
type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
  createdAt: string;
  updatedAt: string;
  listsCount: number;
  lists: GroupDetailList[];
  pagination: Pagination;
};

type GroupDetailList = {
  id: string;
  position: number;
  name: string;
  description: string | null;
  isShared: boolean;
  itemCount: number;
  items: string[];
  featuredItems: FeaturedItem[];
};
```

</details>

<details>
<summary><code>ListSummary</code></summary>

```ts
type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  featuredProducts?: FeaturedItem[];
};
```

</details>

<details>
<summary><code>ListDetail</code></summary>

```ts
type ListDetail = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: HydratedWishlistItem[];
};
```

</details>

<details>
<summary><code>HydratedWishlistItem</code></summary>

```ts
type HydratedWishlistItem = {
  id: string;
  userNote?: string | null;
  quantity: number;
  position: number;
  product: HydratedProduct;
  properties?: Record<string, unknown> | null;
};
```

</details>

<details>
<summary><code>HydratedProduct</code> / <code>HydratedVariant</code></summary>

```ts
type HydratedProduct = {
  id: string | number;
  title: string;
  description: string;
  availableForSale: boolean;
  handle: string;
  productType: string | null;
  category: string | null;
  tags: string[];
  onlineStoreUrl: string | null;
  metafields: Metafield[];
  variant: HydratedVariant;
  vendor: string | null;
};

type HydratedVariant = {
  id: string | number;
  title: string;
  sku?: string | null;
  price: Money;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  selectedOptions: SelectedOption[];
  image?: Image | null;
  metafields: Metafield[];
};

type Money = { amount: string; currencyCode: string };
type SelectedOption = { name: string; value: string };
type Metafield = { key: string; value: string };
```

</details>

<details>
<summary><code>Image</code> / <code>FeaturedItem</code></summary>

```ts
type Image = {
  altText?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
};

type FeaturedItem = {
  variantId: string | number;
  image?: Image | null;
};
```

</details>

<details>
<summary><code>OkResponse</code></summary>

```ts
type OkResponse = { ok: true };
```

</details>

## Related Packages

- [`@sdg.la/wishlist-stack-hydrogen`](https://www.npmjs.com/package/@sdg.la/wishlist-stack-hydrogen) — Hydrogen/Remix integration with React hooks and middleware
