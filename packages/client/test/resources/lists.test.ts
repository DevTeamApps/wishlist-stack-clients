import { describe, expect, it } from "vitest";
import { createWishlistStackClient } from "../../src/client/createWishlistStackClient";
import { createMockFetch } from "../helpers/mockFetch";
import { isAddItemsDeltaResponse } from "../../src/types/guards";
import { clampPageSize } from "../../src/helpers/pagination";

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
    expect(call.init?.body).toBeUndefined();
  });

  it("sends optional groupId body for lists.duplicate()", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await client.lists.duplicate("l_1", { groupId: "g_2" });
    expect(mock.lastCall()!.init?.body).toBe(JSON.stringify({ groupId: "g_2" }));

    await client.lists.duplicate("l_1", { groupId: null });
    expect(mock.lastCall()!.init?.body).toBe(JSON.stringify({ groupId: null }));
  });

  it("types getById responses that include pagination", async () => {
    const mock = createMockFetch();
    mock.setResponder(
      () =>
        new Response(
          JSON.stringify({
            id: "l_1",
            name: "Wishlist",
            description: null,
            position: 1,
            shared: false,
            itemCount: 2,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            items: [{ id: "i1", quantity: 1, position: 1, product: {}, createdAt: "", updatedAt: "" }],
            pagination: {
              page: 1,
              pageSize: 25,
              totalItems: 2,
              totalCount: 2,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );

    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const res = await client.lists.getById("l_1");
    expect(res.pagination.pageSize).toBe(25);
    expect(res.items).toHaveLength(1);
  });

  it("returns addItems delta response", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    mock.setResponder(
      () =>
        new Response(
          JSON.stringify({
            listId: "l_1",
            addedItems: [{ id: "i1", quantity: 1, position: 1, product: {}, createdAt: "", updatedAt: "" }],
            addedCount: 1,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    const res = await client.lists.addItems("l_1", { items: [{ variantId: "v1" }] });
    expect(isAddItemsDeltaResponse(res)).toBe(true);
    expect(res.addedCount).toBe(1);
    expect(res.listId).toBe("l_1");
  });

  it("checks variant membership without fetching list pages", async () => {
    const mock = createMockFetch();
    mock.setResponder(
      () =>
        new Response(
          JSON.stringify({
            listId: "l_1",
            present: {
              "123": true,
              "gid://shopify/ProductVariant/456": false,
            },
            matches: {
              "123": [
                {
                  id: "i1",
                  variantId: "123",
                  quantity: 2,
                  position: 4,
                  note: null,
                  properties: { color: "blue" },
                },
              ],
              "gid://shopify/ProductVariant/456": [],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const body = {
      variantIds: ["123", "gid://shopify/ProductVariant/456"],
    };
    const res = await client.lists.containsVariants("list/one", body);

    const call = mock.lastCall()!;
    expect(String(call.input)).toBe("https://example.test/api/lists/list%2Fone/contains");
    expect(call.init?.method).toBe("POST");
    expect(call.init?.body).toBe(JSON.stringify(body));
    expect(res.present["123"]).toBe(true);
    expect(res.present["gid://shopify/ProductVariant/456"]).toBe(false);
    expect(res.matches["123"][0]).toMatchObject({ id: "i1", quantity: 2 });
  });

  it("treats membership checks as retry-safe reads", async () => {
    const mock = createMockFetch();
    let hits = 0;
    mock.setResponder(() => {
      hits += 1;
      return new Response(
        JSON.stringify(
          hits === 1
            ? { errors: [{ message: "rate" }] }
            : {
                listId: "l_1",
                present: { "123": true },
                matches: { "123": [] },
              },
        ),
        {
          status: hits === 1 ? 429 : 200,
          headers: { "content-type": "application/json", "retry-after": "0" },
        },
      );
    });
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      retryOnRateLimit: true,
      fetch: mock.fetch,
    });

    const response = await client.lists.containsVariants("l_1", {
      variantIds: ["123"],
    });

    expect(response.present["123"]).toBe(true);
    expect(mock.calls).toHaveLength(2);
  });

  it("addItemsBatched splits 30 items into 25+5 POSTs and merges responses", async () => {
    const mock = createMockFetch();
    let callCount = 0;
    mock.setResponder((call) => {
      callCount += 1;
      const body = JSON.parse(String(call.init?.body ?? "{}")) as { items?: unknown[] };
      const n = body.items?.length ?? 0;
      return new Response(
        JSON.stringify({
          listId: "l_1",
          addedItems: Array.from({ length: n }, (_, i) => ({
            id: `i_${callCount}_${i}`,
            quantity: 1,
            position: i,
            product: {},
            createdAt: "",
            updatedAt: "",
          })),
          addedCount: n,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const items = Array.from({ length: 30 }, (_, i) => ({ variantId: `v_${i}` }));
    const res = await client.lists.addItemsBatched("l_1", { items });

    expect(mock.calls).toHaveLength(2);
    const bodies = mock.calls.map((c) => JSON.parse(String(c.init?.body ?? "{}")));
    expect(bodies[0].items).toHaveLength(25);
    expect(bodies[1].items).toHaveLength(5);
    expect(res.addedCount).toBe(30);
    expect(res.addedItems).toHaveLength(30);
  });

  it("rejects an empty addItemsBatched call without making a request", async () => {
    const mock = createMockFetch();
    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await expect(
      client.lists.addItemsBatched("l_1", { items: [] }),
    ).rejects.toThrow("requires at least one item");
    expect(mock.calls).toHaveLength(0);
  });

  it("getByIdAllItems follows pagination across two pages", async () => {
    const mock = createMockFetch();
    mock.setResponder((call) => {
      const url = String(call.input);
      const page = Number(new URL(url).searchParams.get("page") ?? "1");
      const items =
        page === 1
          ? [{ id: "i1", quantity: 1, position: 1, product: {}, createdAt: "", updatedAt: "" }]
          : [{ id: "i2", quantity: 1, position: 2, product: {}, createdAt: "", updatedAt: "" }];
      return new Response(
        JSON.stringify({
          id: "l_1",
          name: "Wishlist",
          description: null,
          position: 1,
          shared: false,
          itemCount: 2,
          createdAt: "",
          updatedAt: "",
          items,
          pagination: {
            page,
            pageSize: 1,
            totalItems: 2,
            totalCount: 2,
            totalPages: 2,
            hasNextPage: page < 2,
            hasPreviousPage: page > 1,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const client = createWishlistStackClient({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const res = await client.lists.getByIdAllItems("l_1", { pageSize: 1 });
    expect(mock.calls).toHaveLength(2);
    expect(res.items.map((i) => i.id)).toEqual(["i1", "i2"]);
    expect(res.pagination.totalPages).toBe(2);
  });
});

describe("clampPageSize", () => {
  it("never emits pageSize > 25", () => {
    expect(clampPageSize(100)).toBe(25);
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(-3)).toBe(1);
    expect(clampPageSize(12.9)).toBe(12);
    expect(clampPageSize(Number.NaN)).toBe(25);
  });
});
