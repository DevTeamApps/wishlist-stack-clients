import { describe, expect, it } from "vitest";
import { createWishlistStackClient } from "../../src/client/createWishlistStackClient";
import { WishlistStackApiError } from "../../src/client/errors";
import { createMockFetch } from "../helpers/mockFetch";

describe("groups resource", () => {
  it("calls GET /api/groups with authenticated headers", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
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
    expect(headers.get("X-Wishlist-Stack-Api-Key")).toBe("k");
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBe("t");
  });

  it("supports pagination query params for groups.getAll()", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.getAll({ page: 2, pageSize: 10 });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups?page=2&pageSize=10");
  });

  it("supports sort query params for groups.getAll()", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.getAll({ sortBy: "updatedAt", sortDirection: "desc" });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe(
      "https://example.test/api/groups?sortBy=updatedAt&sortDirection=desc",
    );
  });

  it("normalizes includeLists to includeLists=1 for groups.getAll()", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.getAll({ includeLists: true, page: 1 });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups?page=1&includeLists=1");
  });

  it("calls POST /api/groups/:id/duplicate", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.duplicate("g_1");

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups/g_1/duplicate");
    expect(call.init?.method).toBe("POST");
  });

  it("calls POST /api/groups/reorder with groupIds body", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.reorder({ groupIds: ["g_3", "g_1", "g_2"] });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups/reorder");
    expect(call.init?.method).toBe("POST");
    expect(call.init?.body).toBe(JSON.stringify({ groupIds: ["g_3", "g_1", "g_2"] }));
  });

  it("supports pagination query params for groups.getById() (paginate lists under group)", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.groups.getById("g_1", { page: 3, pageSize: 5 });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/groups/g_1?page=3&pageSize=5");
  });

  it("rejects before fetch if merchant api key is missing", async () => {
    const mock = createMockFetch();
    expect(() =>
      createWishlistStackClient({
        baseUrl: "https://example.test",
        apiKey: "",
        fetch: mock.fetch,
      }),
    ).toThrow(/merchant api key is required/i);
    expect(mock.fetch).not.toHaveBeenCalled();
  });

  it("surfaces API error if customerAccessToken is missing", async () => {
    const mock = createMockFetch();
    mock.setResponder((call) => {
      const headers = new Headers(call.init?.headers as HeadersInit);
      const token = headers.get("X-Shopify-Customer-Access-Token");
      if (!token) {
        return new Response(
          JSON.stringify({ errors: [{ message: "Access token is invalid or revoked" }] }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      fetch: mock.fetch,
    });

    let err: unknown;
    try {
      await client.groups.getAll();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(WishlistStackApiError);
    expect((err as WishlistStackApiError).status).toBe(401);
    expect(mock.fetch).toHaveBeenCalledTimes(1);

    const call = mock.lastCall()!;
    const headers = new Headers(call.init?.headers as HeadersInit);
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBeNull();
  });
});

