import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { WjsProvider, useWjsClient } from "../src/react";

function UsesClient() {
  const client = useWjsClient();
  // basic smoke: we have the expected namespaces
  expect(typeof client.groups.getAll).toBe("function");
  expect(typeof client.lists.getAll).toBe("function");
  expect(typeof client.shared.getSharedList).toBe("function");
  return null;
}

describe("WjsProvider/useWjsClient", () => {
  it("provides a client instance (proxy mode default)", () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }));
    globalThis.fetch = fetchMock;

    const html = renderToString(
      <WjsProvider config={{ apiKey: "k", baseUrl: "https://example.test" }}>
        <UsesClient />
      </WjsProvider>,
    );
    expect(typeof html).toBe("string");
  });
});

