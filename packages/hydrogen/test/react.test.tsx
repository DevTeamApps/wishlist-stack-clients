import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { WishlistStackProvider, useWishlistStackClient } from "../src/react";

function UsesClient() {
  const client = useWishlistStackClient();
  // basic smoke: we have the expected namespaces
  expect(typeof client.groups.getAll).toBe("function");
  expect(typeof client.lists.getAll).toBe("function");
  expect(typeof client.shared.getSharedList).toBe("function");
  return null;
}

describe("WishlistStackProvider/useWishlistStackClient", () => {
  it("provides a client instance (proxy mode default)", () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }));
    globalThis.fetch = fetchMock;

    const html = renderToString(
      <WishlistStackProvider config={{ apiKey: "k", baseUrl: "https://example.test" }}>
        <UsesClient />
      </WishlistStackProvider>,
    );
    expect(typeof html).toBe("string");
  });
});
