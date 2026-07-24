import { describe, expect, it } from "vitest";
import { createWishlistStackClient } from "../../src/client/createWishlistStackClient";
import { createMockFetch } from "../helpers/mockFetch";

describe("shared resource", () => {
  it("calls shared endpoints without requiring customerAccessToken", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      fetch: mock.fetch,
    });

    await client.shared.getSharedList("list_1");

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/shared/list/list_1");
    expect(call.init?.method).toBe("GET");

    const headers = new Headers(call.init?.headers as HeadersInit);
    expect(headers.get("X-Wishlist-Stack-Api-Key")).toBe("k");
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBeNull();
  });

  it("supports sort and pagination query params on shared endpoints", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      fetch: mock.fetch,
    });

    await client.shared.getSharedList("list_1", {
      page: 2,
      pageSize: 10,
      sortBy: "updatedAt",
      sortDirection: "desc",
    });
    expect(String(mock.lastCall()!.input)).toBe(
      "https://example.test/api/shared/list/list_1?page=2&pageSize=10&sortBy=updatedAt&sortDirection=desc",
    );

    await client.shared.getSharedGroup("group_1", {
      sortBy: "createdAt",
      sortDirection: "asc",
    });
    expect(String(mock.lastCall()!.input)).toBe(
      "https://example.test/api/shared/group/group_1?sortBy=createdAt&sortDirection=asc",
    );
  });
});

