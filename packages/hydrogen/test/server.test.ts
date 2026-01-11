import { describe, expect, it, vi } from "vitest";
import { createWjsServerContext } from "../src/server";

describe("createWjsServerContext", () => {
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

    const attach = createWjsServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    });

    const { wjs, wjsClient } = attach(context);
    // Should be registered onto the existing context object for route loaders/actions.
    expect((context as any).wjs).toBe(wjs);
    expect((context as any).wjsClient).toBe(wjsClient);
    const client = await wjs.getClient();
    await client.groups.getAll();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/groups");
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get("X-WJS-Api-Key")).toBe("merchant_key");
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBe("token_123");
  });

  it("wjsClient can be used directly without calling getClient()", async () => {
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

    createWjsServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    })(context);

    await (context as any).wjsClient.groups.getAll();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/groups");
  });

  it("bootstrapClientConfig does not expose token by default", async () => {
    const context = {
      customerAccount: {
        async getAccessToken() {
          return "token_123";
        },
      },
    };

    const { wjs } = createWjsServerContext({
      apiKey: "merchant_key",
      baseUrl: "https://example.test",
    })(context);

    const cfg = await wjs.bootstrapClientConfig();
    expect(cfg).toEqual({ apiKey: "merchant_key", baseUrl: "https://example.test" });
  });

  it("registers using context.set when available (context map style)", () => {
    const set = vi.fn();
    const ctx = { set };

    const attach = createWjsServerContext({ apiKey: "merchant_key" });
    const { wjs, wjsClient } = attach(ctx);

    expect(set).toHaveBeenCalledWith("wjs", wjs);
    expect(set).toHaveBeenCalledWith("wjsClient", wjsClient);
  });
});

