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
  - [Class API](#class-api)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [API Reference](#api-reference)
  - [Groups](#groups)
  - [Lists](#lists)
  - [Shared](#shared)
- [TypeScript Types](#typescript-types)
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `groups.getAll(query?)` | `GET /api/groups` | Fetch all groups for the authenticated customer |
| `groups.getById(groupId, query?)` | `GET /api/groups/{groupId}` | Fetch a single group by ID (lists are paginated) |
| `groups.create(body)` | `POST /api/groups` | Create a new group |
| `groups.update(groupId, body)` | `PATCH /api/groups/{groupId}` | Update group name/description |
| `groups.remove(groupId)` | `DELETE /api/groups/{groupId}` | Remove a group |
| `groups.reorder(groupId, body)` | `POST /api/groups/{groupId}/reorder` | Reorder lists within a group |
| `groups.share(groupId)` | `POST /api/groups/{groupId}/share` | Mark a group as shared (public read-only) |
| `groups.unshare(groupId)` | `DELETE /api/groups/{groupId}/share` | Revoke sharing for a group |

**Parameters:**

```ts
// Query parameters (for getAll, getById)
{ page?: number; pageSize?: number }

// Create/Update body
{ name?: string; description?: string }

// Reorder body
{ listIds: string[] }
```

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| `lists.getAll(query?)` | `GET /api/lists` | Fetch all lists for the authenticated customer |
| `lists.getById(listId, query?)` | `GET /api/lists/{listId}` | Fetch a single list by ID (items are paginated) |
| `lists.create(body)` | `POST /api/lists` | Create a new list |
| `lists.update(listId, body)` | `PATCH /api/lists/{listId}` | Update list name/description |
| `lists.remove(listId)` | `DELETE /api/lists/{listId}` | Remove a list |
| `lists.addItems(listId, body)` | `POST /api/lists/{listId}/add` | Add items to a list |
| `lists.updateItem(listId, itemId, body)` | `PATCH /api/lists/{listId}/items/{itemId}` | Update an item on a list |
| `lists.removeItem(listId, itemId)` | `DELETE /api/lists/{listId}/items/{itemId}` | Remove an item from a list |
| `lists.share(listId)` | `POST /api/lists/{listId}/share` | Mark a list as shared (public read-only) |
| `lists.unshare(listId)` | `DELETE /api/lists/{listId}/share` | Revoke sharing for a list |

**Parameters:**

```ts
// Query parameters (for getAll, getById)
{ page?: number; pageSize?: number }

// Create/Update body
{ name?: string; description?: string, groupId?: string }

// Add items body
{ items: Array<{ variantId: string; quantity?: number; note?: string }> }

// Update item body
{ quantity?: number; note?: string }
```

### Shared

Public read-only endpoints for accessing shared lists and groups:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `shared.getSharedList(listId)` | `GET /api/shared/list/{listId}` | Fetch a public shared list |
| `shared.getSharedGroup(groupId)` | `GET /api/shared/group/{groupId}` | Fetch a public shared group |

## TypeScript Types

The package exports all types for use in your application:

```ts
import type {
  // Client types
  CreateWishlistStackClientOptions,
  WishlistStackClient,

  // Error types
  WishlistStackApiError,
  WishlistStackApiErrorDetails,

  // Response types
  GetGroupsResponse,
  GetGroupResponse,
  GroupSummary,
  GroupDetail,
  GetListsResponse,
  GetListResponse,
  ListSummary,
  ListDetail,
  HydratedWishlistItem,
  HydratedProduct,
  HydratedVariant,

  // Common types
  Pagination,
  PaginationParams,
} from '@sdg.la/wishlist-stack-sdk';
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@sdg.la/wishlist-stack-hydrogen`](https://www.npmjs.com/package/@sdg.la/wishlist-stack-hydrogen) | Hydrogen/Remix integration with React hooks and middleware |
