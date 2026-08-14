import { describe, expect, it } from "vitest";
import { createRequest } from "../../src/client/request";
import { WishlistStackApiError } from "../../src/client/errors";
import { createMockFetch } from "../helpers/mockFetch";

describe("createRequest", () => {
  it("adds merchant api key header", async () => {
    const mock = createMockFetch();
    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await request({
      method: "GET",
      path: "/api/groups",
      auth: "authenticated",
    });

    const call = mock.lastCall();
    expect(call).toBeTruthy();
    const headers = new Headers(call!.init?.headers as HeadersInit);
    expect(headers.get("X-Wishlist-Stack-Api-Key")).toBe("k");
  });

  it("adds customer access token only for authenticated endpoints", async () => {
    const mock = createMockFetch();
    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await request({
      method: "GET",
      path: "/api/shared/list/abc",
      auth: "merchant",
    });

    const call = mock.lastCall();
    const headers = new Headers(call!.init?.headers as HeadersInit);
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBeNull();
  });

  it("surfaces API error if authenticated endpoint is called without customerAccessToken", async () => {
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
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: undefined,
      fetch: mock.fetch,
    });

    let err: unknown;
    try {
      await request({
        method: "GET",
        path: "/api/groups",
        auth: "authenticated",
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(WishlistStackApiError);
    const apiErr = err as WishlistStackApiError;
    expect(apiErr.status).toBe(401);
    expect(apiErr.method).toBe("GET");
    expect(apiErr.url).toBe("https://example.test/api/groups");
    expect(apiErr.body).toEqual({ errors: [{ message: "Access token is invalid or revoked" }] });
    expect(mock.fetch).toHaveBeenCalledTimes(1);

    const call = mock.lastCall()!;
    const headers = new Headers(call.init?.headers as HeadersInit);
    expect(headers.get("X-Shopify-Customer-Access-Token")).toBeNull();
  });

  it("serializes JSON body and sets content-type", async () => {
    const mock = createMockFetch();
    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await request({
      method: "POST",
      path: "/api/groups",
      auth: "authenticated",
      body: { name: "n" },
    });

    const call = mock.lastCall()!;
    const headers = new Headers(call.init?.headers as HeadersInit);
    expect(headers.get("content-type")).toContain("application/json");
    expect(call.init?.body).toBe(JSON.stringify({ name: "n" }));
  });

  it("returns undefined for 204 responses", async () => {
    const mock = createMockFetch();
    mock.setResponder(() => new Response(null, { status: 204 }));

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const result = await request({
      method: "DELETE",
      path: "/api/groups/1",
      auth: "authenticated",
    });
    expect(result).toBeUndefined();
  });

  it("parses JSON responses", async () => {
    const mock = createMockFetch();
    mock.setResponder(
      () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    const result = await request<{ ok: boolean }>({
      method: "GET",
      path: "/api/groups",
      auth: "authenticated",
    });
    expect(result.ok).toBe(true);
  });

  it("throws WishlistStackApiError on non-2xx and captures error body + request id", async () => {
    const mock = createMockFetch();
    mock.setResponder(
      () =>
        new Response(
          JSON.stringify({ errors: [{ message: "bad", field: "name" }] }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
              "fly-request-id": "req-123",
            },
          },
        ),
    );

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    let err: unknown;
    try {
      await request({
        method: "POST",
        path: "/api/groups",
        auth: "authenticated",
        body: { name: "" },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(WishlistStackApiError);
    const apiErr = err as WishlistStackApiError;
    expect(apiErr.status).toBe(400);
    expect(apiErr.method).toBe("POST");
    expect(apiErr.url).toBe("https://example.test/api/groups");
    expect(apiErr.requestId).toBe("req-123");
    expect(apiErr.body).toEqual({ errors: [{ message: "bad", field: "name" }] });
  });

  it("captures Retry-After and rate-limit headers on errors", async () => {
    const mock = createMockFetch();
    mock.setResponder(
      () =>
        new Response(JSON.stringify({ errors: [{ message: "slow down" }] }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "2",
            "x-ratelimit-limit": "10000",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1700000000",
            "x-nf-request-id": "nf-abc",
          },
        }),
    );

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    let err: unknown;
    try {
      await request({ method: "GET", path: "/api/lists", auth: "authenticated" });
    } catch (e) {
      err = e;
    }

    const apiErr = err as WishlistStackApiError;
    expect(apiErr.status).toBe(429);
    expect(apiErr.retryAfter).toBe("2");
    expect(apiErr.rateLimit).toEqual({
      limit: "10000",
      remaining: "0",
      reset: "1700000000",
    });
    expect(apiErr.requestId).toBe("nf-abc");
  });

  it("maps groups 503 to a clear disabled message", async () => {
    const mock = createMockFetch();
    mock.setResponder(() => new Response(JSON.stringify({}), { status: 503 }));

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
    });

    await expect(
      request({ method: "GET", path: "/api/groups", auth: "authenticated" }),
    ).rejects.toMatchObject({
      status: 503,
      message: "Groups API disabled for this merchant",
    });
  });

  it("retries once on 429 when retryOnRateLimit is enabled", async () => {
    const mock = createMockFetch();
    let hits = 0;
    mock.setResponder(() => {
      hits += 1;
      if (hits === 1) {
        return new Response(JSON.stringify({ errors: [{ message: "rate" }] }), {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "0",
          },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
      retryOnRateLimit: true,
    });

    const result = await request<{ ok: boolean }>({
      method: "GET",
      path: "/api/lists",
      auth: "authenticated",
    });
    expect(result.ok).toBe(true);
    expect(mock.fetch).toHaveBeenCalledTimes(2);
  });

  it("applies defaultTimeoutMs via AbortController", async () => {
    const mock = createMockFetch();
    mock.setResponder(async (call) => {
      expect(call.init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const request = createRequest({
      baseUrl: "https://example.test",
      apiKey: "k",
      customerAccessToken: "t",
      fetch: mock.fetch,
      defaultTimeoutMs: 5_000,
    });

    await request({ method: "GET", path: "/api/lists", auth: "authenticated" });
  });
});

