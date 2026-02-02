# @sdg.la/wishlist-stack-hydrogen

Hydrogen (react-router) integration for [`@sdg.la/wishlist-stack-sdk`](../client/).

This package supports **two server wiring styles**:
- **Context creation**: attach to your Hydrogen load context (`getLoadContext`).
- **Middleware-enabled**: attach via React Router middleware (when used).

It also provides:
- **Context helpers** (`getWishlistStackClient`, `getWishlistStack`) to avoid `context.get(...)` boilerplate
- **React Provider + hooks** for client-side usage (`@sdg.la/wishlist-stack-hydrogen/react`)

## Install

```bash
npm i @sdg.la/wishlist-stack-sdk @sdg.la/wishlist-stack-hydrogen
```

## 1) Server usage (attach to Hydrogen load context)

Use `createWishlistStackServerContext()` to attach:
- `context.wishlistStack` (server helper)
- `context.wishlistStackClient` (ready-to-use client, lazy + request-scoped)

```ts
import {createWishlistStackServerContext} from '@sdg.la/wishlist-stack-hydrogen/server';

export function getLoadContext(hydrogenContext: unknown) {
  createWishlistStackServerContext({
    apiKey: process.env.WISHLIST_STACK_API_KEY!, // merchant key
    baseUrl: process.env.WISHLIST_STACK_BASE_URL,
  })(hydrogenContext);

  return hydrogenContext;
}
```

Now in loaders/actions you can do:

```ts
export async function loader({context}: any) {
  return await context.wishlistStackClient.groups.getAll();
}
```

### Context-map vs object context

Some Hydrogen/React Router setups expose a `context.get(...)` API. To avoid conditional access, use helpers:

```ts
import {getWishlistStackClient} from '@sdg.la/wishlist-stack-hydrogen';

export async function loader({context}: any) {
  const client = await getWishlistStackClient(context);
  return await client.groups.getAll();
}
```

## 2) Server usage (middleware-enabled)

Register middleware and it will attach `wishlistStack` to the middleware context.

```ts
import {createWishlistStackMiddleware} from '@sdg.la/wishlist-stack-hydrogen/middleware';

export const middleware = [
  createWishlistStackMiddleware({
    apiKey: process.env.WISHLIST_STACK_API_KEY!,
    baseUrl: process.env.WISHLIST_STACK_BASE_URL,
  }),
];
```

The middleware supports both `context.set(...)` (context map style) and plain object mutation.

## 3) Client usage (React Provider + hooks)

Import from `@sdg.la/wishlist-stack-hydrogen/react`:

```tsx
import {WishlistStackProvider, useWishlistStackClient} from '@sdg.la/wishlist-stack-hydrogen/react';
```

### Direct-from-browser (opt-in)

If you want client components to call the API directly, bootstrap config (and optionally token) in a loader and pass into the provider.

```ts
// root loader
export async function loader({context}: any) {
  const cfg = await context.wishlistStack.bootstrapClientConfig({exposeCustomerAccessToken: true});
  return {wishlistStack: cfg};
}
```

```tsx
import {WishlistStackProvider} from '@sdg.la/wishlist-stack-hydrogen/react';
import {useLoaderData} from 'react-router';

export function App() {
  const data = useLoaderData() as any;
  return (
    <WishlistStackProvider
      mode="direct"
      config={{apiKey: data.wishlistStack.apiKey, baseUrl: data.wishlistStack.baseUrl}}
      initialCustomerAccessToken={data.wishlistStack.customerAccessToken}
    >
      {/* ... */}
    </WishlistStackProvider>
  );
}
```

Then, anywhere in your app:

```ts
import {useWishlistStackClient} from '@sdg.la/wishlist-stack-hydrogen/react';

export function MyComponent() {
  const client = useWishlistStackClient();
  // await client.groups.getAll()
  return null;
}
```

### Optional global state (for "wishlisted?" checks)

```ts
import {useWishlistStack} from '@sdg.la/wishlist-stack-hydrogen/react';

export function ProductCard({variantId}: {variantId: string}) {
  const {state} = useWishlistStack();
  const saved = state.savedVariantIds?.includes(variantId) ?? false;
  // render "saved" UI
  return null;
}
```

You can hydrate `initialState` in your root route loader and pass it to `<WishlistStackProvider initialState={...} />` when you add an endpoint for it.
