# @wjs-client/hydrogen

Hydrogen (react-router) integration for [`@wjs-client/client`](../client/).

This package supports **two server wiring styles**:
- **Context creation**: attach to your Hydrogen load context (`getLoadContext`).
- **Middleware-enabled**: attach via React Router middleware (when used).

It also provides:
- **Context helpers** (`getWjsClient`, `getWjs`) to avoid `context.get(...)` boilerplate
- **React Provider + hooks** for client-side usage (`@wjs-client/hydrogen/react`)

## Install

```bash
npm i @wjs-client/client @wjs-client/hydrogen
```

## 1) Server usage (attach to Hydrogen load context)

Use `createWjsServerContext()` to attach:
- `context.wjs` (server helper)
- `context.wjsClient` (ready-to-use client, lazy + request-scoped)

```ts
import {createWjsServerContext} from '@wjs-client/hydrogen/server';

export function getLoadContext(hydrogenContext: unknown) {
  createWjsServerContext({
    apiKey: process.env.WJS_API_KEY!, // merchant key
    baseUrl: process.env.WJS_BASE_URL,
  })(hydrogenContext);

  return hydrogenContext;
}
```

Now in loaders/actions you can do:

```ts
export async function loader({context}: any) {
  return await context.wjsClient.groups.getAll();
}
```

### Context-map vs object context

Some Hydrogen/React Router setups expose a `context.get(...)` API. To avoid conditional access, use helpers:

```ts
import {getWjsClient} from '@wjs-client/hydrogen';

export async function loader({context}: any) {
  const client = await getWjsClient(context);
  return await client.groups.getAll();
}
```

## 2) Server usage (middleware-enabled)

Register middleware and it will attach `wjs` to the middleware context.

```ts
import {createWjsMiddleware} from '@wjs-client/hydrogen/middleware';

export const middleware = [
  createWjsMiddleware({
    apiKey: process.env.WJS_API_KEY!,
    baseUrl: process.env.WJS_BASE_URL,
  }),
];
```

The middleware supports both `context.set(...)` (context map style) and plain object mutation.

## 3) Client usage (React Provider + hooks)

Import from `@wjs-client/hydrogen/react`:

```tsx
import {WjsProvider, useWjsClient} from '@wjs-client/hydrogen/react';
```

### Direct-from-browser (opt-in)

If you want client components to call the API directly, bootstrap config (and optionally token) in a loader and pass into the provider.

```ts
// root loader
export async function loader({context}: any) {
  const cfg = await context.wjs.bootstrapClientConfig({exposeCustomerAccessToken: true});
  return {wjs: cfg};
}
```

```tsx
import {WjsProvider} from '@wjs-client/hydrogen/react';
import {useLoaderData} from 'react-router';

export function App() {
  const data = useLoaderData() as any;
  return (
    <WjsProvider
      mode="direct"
      config={{apiKey: data.wjs.apiKey, baseUrl: data.wjs.baseUrl}}
      initialCustomerAccessToken={data.wjs.customerAccessToken}
    >
      {/* ... */}
    </WjsProvider>
  );
}
```

Then, anywhere in your app:

```ts
import {useWjsClient} from '@wjs-client/hydrogen/react';

export function MyComponent() {
  const client = useWjsClient();
  // await client.groups.getAll()
  return null;
}
```

### Optional global state (for “wishlisted?” checks)

```ts
import {useWjs} from '@wjs-client/hydrogen/react';

export function ProductCard({variantId}: {variantId: string}) {
  const {state} = useWjs();
  const saved = state.savedVariantIds?.includes(variantId) ?? false;
  // render “saved” UI
  return null;
}
```

You can hydrate `initialState` in your root route loader and pass it to `<WjsProvider initialState={...} />` when you add an endpoint for it.

