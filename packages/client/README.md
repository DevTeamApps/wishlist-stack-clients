# @wjs-client/client

TypeScript/JavaScript SDK for the Wishlist JS API.

## Install

```bash
npm i @wjs-client/client
```

## Usage (Node / server / workers)

```ts
import {createWjsClient} from '@wjs-client/client';

const client = createWjsClient({
  apiKey: process.env.WJS_API_KEY!, // merchant key
  baseUrl: process.env.WJS_BASE_URL, // optional
  // Optional: include when calling authenticated endpoints
  customerAccessToken: '...customer_access_token...',
});

const groups = await client.groups.getAll();
```

## Usage (browser)

```ts
import {createWjsClient} from '@wjs-client/client';

const client = createWjsClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://wishlist-js.fly.dev', // or your API base
  customerAccessToken: '...optional...',
});

// If customerAccessToken is missing, the API should return an auth error response.
const lists = await client.lists.getAll();
```

Note: if you are using a strict Content Security Policy (CSP), you must allow your API domain in `connect-src` for browser calls.

## Class API (optional)

If you prefer a `new`-style API, use the `WJSClient` class. It wraps `createWjsClient()` and exposes the same resources: `lists`, `groups`, and `shared`.

```ts
import {WJSClient} from '@wjs-client/client';

const client = new WJSClient({
  apiKey: process.env.WJS_API_KEY!,       // merchant key
  baseUrl: process.env.WJS_BASE_URL,      // optional
  customerAccessToken: '...optional...',   // include for authenticated endpoints
});

// Same resource methods as createWjsClient()
await client.groups.getAll();
await client.groups.getById('groupId');
await client.lists.getAll();
```

### Back-compat aliases

For convenience, the class also includes a few alias methods:

```ts
await client.getGroups();           // alias for client.groups.getAll()
await client.getGroupById('id');    // alias for client.groups.getById('id')
await client.getLists();            // alias for client.lists.getAll()
```

## Errors

Non-2xx responses throw `WjsApiError`. For UI-friendly handling:

```ts
import {isWjsApiError} from '@wjs-client/client';

try {
  await client.groups.getAll();
} catch (e) {
  if (isWjsApiError(e)) {
    console.log(e.status);           // HTTP status
    console.log(e.apiErrors);        // best-effort [{message, field?}]
    console.log(e.apiErrorMessages); // best-effort [message]
  }
}
```

## Pagination/query params

Some endpoints accept pagination query params:

```ts
await client.groups.getAll({page: 2, pageSize: 10});
await client.groups.getById('groupId', {page: 1, pageSize: 25}); // paginate lists under group
await client.lists.getById('listId', {page: 1, pageSize: 25});   // paginate items under list
```

## Client methods reference

### Groups

- **Api endpoint**: `/api/groups`
  - **Function call**: `client.groups.getAll(query?)`
  - **Description**: Fetches all groups for the authenticated customer
  - **Params**:
    - `query?.page?: number`
    - `query?.pageSize?: number`

- **Api endpoint**: `/api/groups/{groupId}`
  - **Function call**: `client.groups.getById(groupId, query?)`
  - **Description**: Fetches a single group by id (lists are paginated)
  - **Params**:
    - `groupId: string`
    - `query?.page?: number`
    - `query?.pageSize?: number`

- **Api endpoint**: `/api/groups`
  - **Function call**: `client.groups.create(body)`
  - **Description**: Creates a new group
  - **Params**:
    - `body.name?: string`
    - `body.description?: string`

- **Api endpoint**: `/api/groups/{groupId}`
  - **Function call**: `client.groups.update(groupId, body)`
  - **Description**: Updates group name/description
  - **Params**:
    - `groupId: string`
    - `body.name?: string`
    - `body.description?: string`

- **Api endpoint**: `/api/groups/{groupId}`
  - **Function call**: `client.groups.remove(groupId)`
  - **Description**: Removes a group
  - **Params**:
    - `groupId: string`

- **Api endpoint**: `/api/groups/{groupId}/reorder`
  - **Function call**: `client.groups.reorder(groupId, body)`
  - **Description**: Reorders lists in a group
  - **Params**:
    - `groupId: string`
    - `body.listIds?: string[]`

- **Api endpoint**: `/api/groups/{groupId}/share`
  - **Function call**: `client.groups.share(groupId)`
  - **Description**: Marks a group as shared (public read-only)
  - **Params**:
    - `groupId: string`

- **Api endpoint**: `/api/groups/{groupId}/share`
  - **Function call**: `client.groups.unshare(groupId)`
  - **Description**: Revokes sharing for a group
  - **Params**:
    - `groupId: string`

### Lists

- **Api endpoint**: `/api/lists`
  - **Function call**: `client.lists.getAll(query?)`
  - **Description**: Returns all lists for the authenticated customer
  - **Params**:
    - `query?.page?: number`
    - `query?.pageSize?: number`

- **Api endpoint**: `/api/lists/{listId}`
  - **Function call**: `client.lists.getById(listId, query?)`
  - **Description**: Fetches a single list by id (items are paginated)
  - **Params**:
    - `listId: string`
    - `query?.page?: number`
    - `query?.pageSize?: number`

- **Api endpoint**: `/api/lists`
  - **Function call**: `client.lists.create(body)`
  - **Description**: Creates a new list
  - **Params**:
    - `body.name?: string`
    - `body.description?: string`

- **Api endpoint**: `/api/lists/{listId}`
  - **Function call**: `client.lists.update(listId, body)`
  - **Description**: Updates list name/description
  - **Params**:
    - `listId: string`
    - `body.name?: string`
    - `body.description?: string`

- **Api endpoint**: `/api/lists/{listId}`
  - **Function call**: `client.lists.remove(listId)`
  - **Description**: Removes a list
  - **Params**:
    - `listId: string`

- **Api endpoint**: `/api/lists/{listId}/add`
  - **Function call**: `client.lists.addItems(listId, body)`
  - **Description**: Adds one or more items to a list
  - **Params**:
    - `listId: string`
    - `body.items?: Array<{ variantId?: string; quantity?: number; note?: string }>`

- **Api endpoint**: `/api/lists/{listId}/items/{itemId}`
  - **Function call**: `client.lists.updateItem(listId, itemId, body)`
  - **Description**: Updates a single item on a list
  - **Params**:
    - `listId: string`
    - `itemId: string`
    - `body.quantity?: number`
    - `body.note?: string`

- **Api endpoint**: `/api/lists/{listId}/items/{itemId}`
  - **Function call**: `client.lists.removeItem(listId, itemId)`
  - **Description**: Removes a single item from a list
  - **Params**:
    - `listId: string`
    - `itemId: string`

- **Api endpoint**: `/api/lists/{listId}/share`
  - **Function call**: `client.lists.share(listId)`
  - **Description**: Marks a list as shared (public read-only)
  - **Params**:
    - `listId: string`

- **Api endpoint**: `/api/lists/{listId}/share`
  - **Function call**: `client.lists.unshare(listId)`
  - **Description**: Revokes sharing for a list
  - **Params**:
    - `listId: string`

- **Api endpoint**: `/api/wishlists/{id}/add` (legacy)
  - **Function call**: `client.lists.addItemsLegacy(id, body)`
  - **Description**: Legacy add-items route; prefer `addItems` unless only the legacy route is available
  - **Params**:
    - `id: string`
    - `body.items?: Array<{ variantId?: string; quantity?: number; note?: string }>`

### Shared (public read-only)

- **Api endpoint**: `/api/shared/list/{listId}`
  - **Function call**: `client.shared.getSharedList(listId)`
  - **Description**: Fetches a public, read-only view of a shared list
  - **Params**:
    - `listId: string`

- **Api endpoint**: `/api/shared/group/{groupId}`
  - **Function call**: `client.shared.getSharedGroup(groupId)`
  - **Description**: Fetches a public, read-only view of a shared group
  - **Params**:
    - `groupId: string`
