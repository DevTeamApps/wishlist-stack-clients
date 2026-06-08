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
  - [Shopify Liquid authentication](#shopify-liquid-authentication)
  - [Class API](#class-api)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
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
- **Built-in error handling** — Structured `WishlistStackApiError` with status codes and API error messages
- **Pagination support** — All list endpoints support `page` and `pageSize` parameters

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
});

// Fetch all groups
const { groups } = await client.groups.getAll();

// Fetch all lists
const { lists } = await client.lists.getAll();
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
  }
}
```

## Pagination

Endpoints that return lists support pagination via query parameters:

```ts
// Paginate groups
await client.groups.getAll({ page: 2, pageSize: 10 });

// Paginate lists within a group
await client.groups.getById('group-id', { page: 1, pageSize: 25 });

// Paginate items within a list
await client.lists.getById('list-id', { page: 1, pageSize: 25 });
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

## API Reference

### Groups

> [View full Groups API reference](https://wishlist.devteam.run/docs#/groups)

---

#### `groups.getAll(query?)`

Fetch all groups for the authenticated customer.

- **Endpoint:** `GET /api/groups`
- **Parameters:** `query?` — `{ page?: number; pageSize?: number, query?: string }`
- **Returns:** `Promise<GetGroupsResponse>`

```ts
const { groups, pagination } = await client.groups.getAll({ page: 1, pageSize: 10, query: 'holiday' });
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

---

#### `groups.getById(groupId, query?)`

Fetch a single group by ID. Lists within the group are paginated.

- **Endpoint:** `GET /api/groups/{groupId}`
- **Parameters:**
  - `groupId` — `string`
  - `query?` — `{ page?: number; pageSize?: number, query?: string }`
- **Returns:** `Promise<GetGroupResponse>`

```ts
const group = await client.groups.getById('group-id', { page: 1, pageSize: 25, query: 'gift' });
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

#### `groups.reorder(groupId, body)`

Reorder lists within a group.

- **Endpoint:** `POST /api/groups/{groupId}/reorder`
- **Parameters:**
  - `groupId` — `string`
  - `body` — `{ listIds?: string[] }`
- **Returns:** `Promise<ReorderGroupResponse>`

```ts
await client.groups.reorder('group-id', { listIds: ['list-3', 'list-1', 'list-2'] });
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
- **Parameters:** `query?` — `{ page?: number; pageSize?: number, query?: string }`
- **Returns:** `Promise<GetListsResponse>`

```ts
const { lists, pagination } = await client.lists.getAll({ page: 1, pageSize: 10 });
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

Fetch a single list by ID. Items are hydrated with Shopify product data and paginated.

- **Endpoint:** `GET /api/lists/{listId}`
- **Parameters:**
  - `listId` — `string`
  - `query?` — `{ page?: number; pageSize?: number }`
- **Returns:** `Promise<GetListResponse>`

```ts
const list = await client.lists.getById('list-id', { page: 1, pageSize: 25 });
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

#### `lists.create(body)`

Create a new list, optionally assigned to a group.

- **Endpoint:** `POST /api/lists`
- **Parameters:** `body` — `{ name?: string; description?: string; groupId?: string }`
- **Returns:** `Promise<CreateListResponse>`

```ts
const list = await client.lists.create({ name: 'Gift Ideas', groupId: 'group-id' });
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

#### `lists.addItems(listId, body)`

Add one or more items to a list.

- **Endpoint:** `POST /api/lists/{listId}/add`
- **Parameters:**
  - `listId` — `string`
  - `body` — `AddItemsToListBody`

```ts
type AddItemsToListBody = {
  items?: Array<{
    variantId?: string;
    quantity?: number;
    note?: string;
    properties?: Record<string, unknown> | null;
  }>;
};
```

- **Returns:** `Promise<AddItemsToListResponse>` — the updated list with hydrated items (same shape as `getById`)

```ts
await client.lists.addItems('list-id', {
  items: [
    { variantId: 'gid://shopify/ProductVariant/123', quantity: 1 },
    { variantId: 'gid://shopify/ProductVariant/456', note: 'Size M' },
  ],
});
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

#### `shared.getSharedList(listId)`

Fetch a public shared list with hydrated product details.

- **Endpoint:** `GET /api/shared/list/{listId}`
- **Parameters:** `listId` — `string`
- **Returns:** `Promise<GetSharedListResponse>` — same response shape as [`lists.getById`](#listsgetbyidlistid-query)

```ts
const list = await client.shared.getSharedList('list-id');
```

---

#### `shared.getSharedGroup(groupId)`

Fetch a public shared group and its lists.

- **Endpoint:** `GET /api/shared/group/{groupId}`
- **Parameters:** `groupId` — `string`
- **Returns:** `Promise<GetSharedGroupResponse>` — same response shape as [`groups.getById`](#groupsgetbyidgroupid-query)

```ts
const group = await client.shared.getSharedGroup('group-id');
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

  // Groups
  GetGroupsResponse,
  GetGroupResponse,
  GroupSummary,
  GroupDetail,
  GroupDetailList,
  CreateGroupBody,
  UpdateGroupBody,
  ReorderGroupBody,

  // Lists
  GetListsResponse,
  GetListResponse,
  ListSummary,
  ListDetail,
  CreateListBody,
  UpdateListBody,
  AddItemsToListBody,
  UpdateListItemBody,
  ReorderListItemsBody,
  ReorderListItemsResponse,

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
  featuredItems: FeaturedItem[];
  createdAt: string;
  updatedAt: string;
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
