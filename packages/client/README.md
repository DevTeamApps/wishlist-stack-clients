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

