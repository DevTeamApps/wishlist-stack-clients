import { describe, expect, it } from "vitest";
import { createWjsClient } from "../../src/client/createWjsClient";
import { createMockFetch } from "../helpers/mockFetch";

describe("groups resource", () => {
  it("calls GET /api/groups with authenticated headers", async () => {
    const mock = createMockFetch();
    const client = createWjsClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.getAll();

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups");
    expect(call.init?.method).toBe("GET");

    const headers = new Headers(call.init?.headers as HeadersInit);
    expect(headers.get("X-WJS-Api-Key")).toBe("k");
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBe("t");
  });

  it("rejects before fetch if merchant api key is missing", async () => {
    const mock = createMockFetch();
    expect(() =>
      createWjsClient({
        baseUrl: "https://example.test",
        apiKey: "",
        fetch: mock.fetch,
      }),
    ).toThrow(/merchant api key is required/i);
    expect(mock.fetch).not.toHaveBeenCalled();
  });

  it("rejects before fetch if customerAccessToken is missing", async () => {
    const mock = createMockFetch();
    const client = createWjsClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      fetch: mock.fetch,
    });

    await expect(client.groups.getAll()).rejects.toThrow(/customerAccessToken is required/i);
    expect(mock.fetch).not.toHaveBeenCalled();
  });
});

