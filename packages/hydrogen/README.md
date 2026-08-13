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

## Environment Setup

Add your merchant API key to your `.env` file (or deployment environment):

```
WISHLIST_STACK_API_KEY=your-merchant-api-key-here
```

For Hydrogen projects, this is loaded from your local `.env` file during
development via MiniOxygen. In production (Oxygen), set it as an environment
variable in your deployment configuration.

> **Note:** In Hydrogen/Oxygen, environment variables are accessed via the `env`
> parameter (e.g. `env.WISHLIST_STACK_API_KEY`), not `process.env`.

## Content Security Policy (CSP)

Hydrogen storefronts use `createContentSecurityPolicy` in `app/entry.server.tsx`.
If you use `mode="direct"` (the browser calls the API directly), you must allow
the API domain in `connectSrc`:

```ts
// app/entry.server.tsx
const {nonce, header, NonceProvider} = createContentSecurityPolicy({
  shop: {
    checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
    storeDomain: context.env.PUBLIC_STORE_DOMAIN,
  },
  connectSrc: ['https://wishlist.devteam.run'],
});
```

Without this, client-side API calls will be silently blocked by the browser's
Content Security Policy. If you use a custom `baseUrl`, add that domain instead.

## API limits and storefront guidance

1. Register the storefront origin for CORS if the browser calls the API directly.
2. Keep CSP `connectSrc` pointed at your API `baseUrl` (see above).
3. Prefer `wishlistStackClient.lists.addItemsBatched` for large adds and
   `getByIdAllItems` when you need every item under paginated list detail.
4. Re-exported helpers: `clampPageSize`, `isAddItemsDeltaResponse`,
   `isAddItemsLegacyResponse` from `@sdg.la/wishlist-stack-hydrogen`.

## 1) Server usage (attach to Hydrogen load context)

Use `createWishlistStackServerContext()` to create:
- `wishlistStack` — server helper (bootstrap config, get tokens)
- `wishlistStackClient` — ready-to-use client (lazy, request-scoped)

In your `app/lib/context.ts`, call it after `createHydrogenContext` and assign the
returned values back to the context:

```ts
import {createHydrogenContext} from '@shopify/hydrogen';
import {createWishlistStackServerContext} from '@sdg.la/wishlist-stack-hydrogen/server';

// Inside createHydrogenRouterContext, after createHydrogenContext(...)
const wishlistStackContext = createWishlistStackServerContext({
  apiKey: env.WISHLIST_STACK_API_KEY!,
  baseUrl: env.WISHLIST_STACK_BASE_URL, // optional
})(hydrogenContext);

hydrogenContext.wishlistStack = wishlistStackContext.wishlistStack;
hydrogenContext.wishlistStackClient = wishlistStackContext.wishlistStackClient;

return hydrogenContext;
```

> **Important:** You must explicitly assign `wishlistStack` and
> `wishlistStackClient` back onto the context object. The library's internal
> context mutation does not work with Hydrogen's `createHydrogenContext` return
> value.

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your merchant API key |
| `baseUrl` | `string` | No | API base URL (defaults to production) |
| `getCustomerAccessToken` | `(context: unknown) => Promise<string \| undefined> \| string \| undefined` | No | Override how the customer access token is resolved. If omitted, the library calls `context.customerAccount.getAccessToken()` automatically. |

Example with explicit token resolution:

```ts
createWishlistStackServerContext({
  apiKey: env.WISHLIST_STACK_API_KEY!,
  getCustomerAccessToken: hydrogenContext.customerAccount.getAccessToken,
})
```

Now in loaders/actions you can do:

```ts
export async function loader({context}: any) {
  // includeLists is capped (10 lists × 25 items).
  // Prefer lists.getById / getByIdAllItems for full list data.
  return await context.wishlistStackClient.groups.getAll({ includeLists: true });
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

> **Prerequisites:**
> - Enable `future.v8_middleware: true` in `react-router.config.ts`
> - Add `WISHLIST_STACK_API_KEY` to your `.env` file (see Environment Setup)

Export middleware from the route module where you want it to run.
For global coverage, add it to `app/root.tsx`:

```ts
// app/root.tsx
import {createWishlistStackMiddleware} from '@sdg.la/wishlist-stack-hydrogen/middleware';

export const middleware = [
  ({context, request}: any, next: any) => {
    const env = context.env ?? context.get?.('env');
    return createWishlistStackMiddleware({
      apiKey: env?.WISHLIST_STACK_API_KEY,
    })({context, request}, next);
  },
];
```

> **Hydrogen note:** `process.env` is not available in Hydrogen's Cloudflare
> Workers runtime. You must read env vars from `context.env` at request time.

In loaders/actions, use the helper to access the client:

```ts
import {getWishlistStack, getWishlistStackClient} from '@sdg.la/wishlist-stack-hydrogen';

export async function loader({context}: Route.LoaderArgs) {
  const client = await getWishlistStackClient(context);
  return await client.groups.getAll();
}
```

> **Important:** With middleware, use `getWishlistStack(context)` or
> `getWishlistStackClient(context)` helpers — not direct property access
> (`context.wishlistStack`). The middleware sets values via `context.set()`
> which is not accessible via property access in Hydrogen's context proxy.

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
// app/root.tsx
import {WishlistStackProvider} from '@sdg.la/wishlist-stack-hydrogen/react';
import {useRouteLoaderData, Outlet} from 'react-router';

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  if (!data) return <Outlet />;

  return (
    <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
      <WishlistStackProvider
        mode="direct"
        config={{
          apiKey: data.wishlistStack.apiKey,
          baseUrl: data.wishlistStack.baseUrl,
        }}
        initialCustomerAccessToken={data.wishlistStack.customerAccessToken}
      >
        <PageLayout {...data}>
          <Outlet />
        </PageLayout>
      </WishlistStackProvider>
    </Analytics.Provider>
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

The provider exposes lightweight client-side state for convenience:

```ts
type WishlistStackGlobalState = {
  savedVariantIds?: string[];
  savedProductIds?: string[];
};
```

#### Checking if a variant is saved

```ts
import {useWishlistStack} from '@sdg.la/wishlist-stack-hydrogen/react';

export function ProductCard({variantId}: {variantId: string}) {
  const {state} = useWishlistStack();
  const saved = state.savedVariantIds?.includes(variantId) ?? false;
  return <button>{saved ? '♥ Wishlisted' : '♡ Add to Wishlist'}</button>;
}
```

#### Updating state after mutations

Use `setState` from the hook to keep state in sync after add/remove operations:

```ts
const {setState} = useWishlistStack();

// After adding
setState((prev) => ({
  ...prev,
  savedVariantIds: [...(prev.savedVariantIds ?? []), variantId],
}));

// After removing
setState((prev) => ({
  ...prev,
  savedVariantIds: prev.savedVariantIds?.filter((id) => id !== variantId),
}));
```

#### Hydrating saved IDs from the server
To hydrate `savedVariantIds`, fetch lists server-side and extract the IDs:

```ts
// In your root loader, after bootstrapClientConfig:
let savedVariantIds: string[] = [];
if (cfg.customerAccessToken) {
  try {
    const {lists} = await context.wishlistStackClient.lists.getAll();
    for (const list of lists) {
      const detail = await context.wishlistStackClient.lists.getById(list.id);
      for (const item of detail.items) {
        savedVariantIds.push(String(item.product.variant.id));
      }
    }
  } catch {
    // Customer may not have any lists yet
  }
}

return { wishlistStack: cfg, wishlistStackInitialState: {savedVariantIds} };
```

Then pass to the provider:

```tsx
<WishlistStackProvider
  mode="direct"
  config={{apiKey: data.wishlistStack.apiKey, baseUrl: data.wishlistStack.baseUrl}}
  initialCustomerAccessToken={data.wishlistStack.customerAccessToken}
  initialState={data.wishlistStackInitialState}
>
```

> **Performance note:** For stores with many lists/items, consider adding a
> dedicated bulk endpoint (e.g. `GET /api/customers/saved-variant-ids`) to
> avoid multiple sequential round-trips during SSR.
