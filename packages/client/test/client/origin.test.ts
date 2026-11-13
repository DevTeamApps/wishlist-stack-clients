import { expect, it } from "vitest";
import { createWishlistStackClient, clampPageSize } from "../../src";
import { createMockFetch } from "../helpers/mockFetch";

it("uses the canonical origin without changing request authentication or pagination", async () => {
  const mock = createMockFetch();
  const client = createWishlistStackClient({ apiKey: "synthetic-key", customerAccessToken: "synthetic-token", fetch: mock.fetch });
  await client.lists.getById("synthetic-list", { page: 2, pageSize: 25 });
  const call = mock.lastCall()!;
  const url = new URL(String(call.input));
  expect(url.origin).toBe("https://app.wishliststack.com");
  expect(url.pathname).toBe("/api/lists/synthetic-list");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.searchParams.get("pageSize")).toBe("25");
  expect(new Headers(call.init?.headers).get("X-Wishlist-Stack-Api-Key")).toBe("synthetic-key");
  expect(new Headers(call.init?.headers).get("X-Shopify-Customer-Access-Token")).toBe("synthetic-token");
  expect(clampPageSize(25)).toBe(25);
});

it.each(["https://wishlist.devteam.run", "https://example.test/apps/wishlist-stack", "/apps/wishlist-stack"])("preserves an explicit base URL: %s", async (baseUrl) => {
  const mock = createMockFetch();
  const client = createWishlistStackClient({ apiKey: "synthetic-key", fetch: mock.fetch, baseUrl });
  await client.shared.getSharedList("synthetic-share");
  expect(String(mock.lastCall()!.input)).toBe(`${baseUrl}/api/shared/list/synthetic-share`);
  expect(new Headers(mock.lastCall()!.init?.headers).has("X-Shopify-Customer-Access-Token")).toBe(false);
});
