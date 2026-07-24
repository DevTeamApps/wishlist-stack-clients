import { describe, expect, it } from "vitest";
import { createWishlistStackClient } from "../../src/client/createWishlistStackClient";
import { createMockFetch } from "../helpers/mockFetch";

describe("lists resource", () => {
  it("supports pagination query params for lists.getById() (paginate items under list)", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.lists.getById("l_1", { page: 4, pageSize: 25 });

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/lists/l_1?page=4&pageSize=25");
    expect(call.init?.method).toBe("GET");
  });

  it("supports sort query params for lists.getAll() and lists.getById()", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.lists.getAll({ sortBy: "createdAt", sortDirection: "desc" });
    expect(String(mock.lastCall()!.input)).toBe(
      "https://example.test/api/lists?sortBy=createdAt&sortDirection=desc",
    );

    await client.lists.getById("l_1", { sortBy: "updatedAt", sortDirection: "asc" });
    expect(String(mock.lastCall()!.input)).toBe(
      "https://example.test/api/lists/l_1?sortBy=updatedAt&sortDirection=asc",
    );
  });

  it("calls POST /api/lists/:id/duplicate", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.lists.duplicate("l_1");

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/lists/l_1/duplicate");
    expect(call.init?.method).toBe("POST");
  });
});

