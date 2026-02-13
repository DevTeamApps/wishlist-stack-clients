import { createWishlistStackClient, type WishlistStackClient } from "@sdg.la/wishlist-stack-sdk";
import type { WishlistStackHydrogenOptions, WishlistStackHydrogenServer } from "./types";

function createLazyWishlistStackClient(getClient: () => Promise<WishlistStackClient>): WishlistStackClient {
  return {
    lists: {
      getAll: (query) => getClient().then((c) => c.lists.getAll(query)),
      getById: (listId) => getClient().then((c) => c.lists.getById(listId)),
      create: (body) => getClient().then((c) => c.lists.create(body)),
      update: (listId, body) => getClient().then((c) => c.lists.update(listId, body)),
      remove: (listId) => getClient().then((c) => c.lists.remove(listId)),
      addItems: (listId, body) => getClient().then((c) => c.lists.addItems(listId, body)),
      updateItem: (listId, itemId, body) => getClient().then((c) => c.lists.updateItem(listId, itemId, body)),
      removeItem: (listId, itemId) => getClient().then((c) => c.lists.removeItem(listId, itemId)),
      reorderItems: (listId, body) => getClient().then((c) => c.lists.reorderItems(listId, body)),
      share: (listId) => getClient().then((c) => c.lists.share(listId)),
      unshare: (listId) => getClient().then((c) => c.lists.unshare(listId)),
      addItemsLegacy: (id, body) => getClient().then((c) => c.lists.addItemsLegacy(id, body)),
    },
    groups: {
      getAll: () => getClient().then((c) => c.groups.getAll()),
      getById: (groupId) => getClient().then((c) => c.groups.getById(groupId)),
      create: (body) => getClient().then((c) => c.groups.create(body)),
      update: (groupId, body) => getClient().then((c) => c.groups.update(groupId, body)),
      remove: (groupId) => getClient().then((c) => c.groups.remove(groupId)),
      reorder: (groupId, body) => getClient().then((c) => c.groups.reorder(groupId, body)),
      share: (groupId) => getClient().then((c) => c.groups.share(groupId)),
      unshare: (groupId) => getClient().then((c) => c.groups.unshare(groupId)),
    },
    shared: {
      getSharedList: (listId) => getClient().then((c) => c.shared.getSharedList(listId)),
      getSharedGroup: (groupId) => getClient().then((c) => c.shared.getSharedGroup(groupId)),
    },
  };
}

async function defaultGetCustomerAccessToken(context: unknown): Promise<string | undefined> {
  const anyCtx = context as any;
  const customerAccount = anyCtx?.customerAccount;
  const fn = customerAccount?.getAccessToken;
  if (typeof fn !== "function") return undefined;
  try {
    const token = await fn.call(customerAccount);
    return typeof token === "string" ? token : undefined;
  } catch {
    return undefined;
  }
}

export function createWishlistStackServerContext(options: WishlistStackHydrogenOptions) {
  return function attachToContext(context: unknown): { wishlistStack: WishlistStackHydrogenServer; wishlistStackClient: WishlistStackClient } {
    if (!options.apiKey) {
      throw new Error("merchant api key is required. Pass it to createWishlistStackServerContext({ apiKey })");
    }

    const getToken = async () => {
      if (options.getCustomerAccessToken) {
        const token = await options.getCustomerAccessToken(context);
        return typeof token === "string" ? token : undefined;
      }
      return await defaultGetCustomerAccessToken(context);
    };

    let cachedClient: WishlistStackClient | undefined;
    let cachedToken: string | undefined;

    const server: WishlistStackHydrogenServer = {
      async getCustomerAccessToken() {
        return await getToken();
      },
      async getClient() {
        const token = await getToken();
        // Cache by token value so calls within a single request reuse the client.
        if (cachedClient && cachedToken === token) return cachedClient;
        cachedToken = token;
        cachedClient = createWishlistStackClient({
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          customerAccessToken: token,
        });
        return cachedClient;
      },
      async bootstrapClientConfig(opts) {
        const expose = opts?.exposeCustomerAccessToken ?? false;
        const token = expose ? await getToken() : undefined;
        return {
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          customerAccessToken: token,
        };
      },
    };

    const wishlistStackClient = createLazyWishlistStackClient(server.getClient);

    const anyCtx = context as any;
    if (anyCtx && typeof anyCtx.set === "function") {
      // Context map style (some React Router middleware implementations).
      anyCtx.set("wishlistStack", server);
      anyCtx.set("wishlistStackClient", wishlistStackClient);
    } else if (anyCtx && typeof anyCtx === "object") {
      // Plain object style (Hydrogen load context is an object).
      anyCtx.wishlistStack = server;
      anyCtx.wishlistStackClient = wishlistStackClient;
    }

    return { wishlistStack: server, wishlistStackClient };
  };
}

