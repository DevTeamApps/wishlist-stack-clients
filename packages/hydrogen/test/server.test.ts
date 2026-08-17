import { describe, expect, it, vi } from "vitest";
import { createWishlistStackServerContext } from "../src/server";

describe("createWishlistStackServerContext", () => {
  it("uses context.customerAccount.getAccessToken() and builds a client", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock;

    const context = {
      customerAccount: {
        async getAccessToken() {
          return "token_123";
        },
      },
    };

    const attach = createWishlistStackServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    });

    const { wishlistStack, wishlistStackClient } = attach(context);
    // Should be registered onto the existing context object for route loaders/actions.
    expect((context as any).wishlistStack).toBe(wishlistStack);
    expect((context as any).wishlistStackClient).toBe(wishlistStackClient);
    const client = await wishlistStack.getClient();
    await client.groups.getAll();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/groups");
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get("X-Wishlist-Stack-Api-Key")).toBe("merchant_key");
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBe("token_123");
  });

  it("wishlistStackClient can be used directly without calling getClient()", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock;

    const context = {
      customerAccount: {
        async getAccessToken() {
          return "token_123";
        },
      },
    };

    createWishlistStackServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    })(context);

    await (context as any).wishlistStackClient.groups.getAll();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/groups");
  });

  it("proxies list membership checks through the lazy client", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({ listId: "l_1", present: { "123": true } }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock;
    const context = {
      customerAccount: {
        async getAccessToken() {
          return "token_123";
        },
      },
    };

    createWishlistStackServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    })(context);

    const result = await (context as any).wishlistStackClient.lists.containsVariants("l_1", {
      variantIds: ["123"],
    });

    expect(result.present["123"]).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/lists/l_1/contains");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ variantIds: ["123"] }));
  });

  it("bootstrapClientConfig does not expose token by default", async () => {
    const context = {
      customerAccount: {
        async getAccessToken() {
          return "token_123";
        },
      },
    };

    const { wishlistStack } = createWishlistStackServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    })(context);

    const cfg = await wishlistStack.bootstrapClientConfig();
    expect(cfg).toEqual({ apiKey: "merchant_key", baseUrl: "https://example.test" });
  });

  it("registers using context.set when available (context map style)", () => {
    const set = vi.fn();
    const ctx = { set };

    const attach = createWishlistStackServerContext({ apiKey: "merchant_key" });
    const { wishlistStack, wishlistStackClient } = attach(ctx);

    expect(set).toHaveBeenCalledWith("wishlistStack", wishlistStack);
    expect(set).toHaveBeenCalledWith("wishlistStackClient", wishlistStackClient);
  });
});
