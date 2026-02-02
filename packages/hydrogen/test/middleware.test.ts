import { describe, expect, it } from "vitest";
import { createWishlistStackMiddleware } from "../src/middleware";

describe("createWishlistStackMiddleware", () => {
  it("attaches wishlistStack and wishlistStackClient to a plain object context", async () => {
    const ctx: any = {};
    const middleware = createWishlistStackMiddleware({ apiKey: "k", baseUrl: "https://example.test" });

    const res = await middleware({ request: new Request("https://app.test"), context: ctx }, () => {
      return new Response("ok");
    });

    expect(res).toBeInstanceOf(Response);
    expect(ctx.wishlistStack).toBeTruthy();
    expect(typeof ctx.wishlistStack.getClient).toBe("function");
    expect(ctx.wishlistStackClient).toBeTruthy();
    expect(typeof ctx.wishlistStackClient.groups?.getAll).toBe("function");
  });

  it("uses context.set when available (context map style)", async () => {
    const entries = new Map<string, unknown>();
    const ctx: any = {
      set(key: string, value: unknown) {
        entries.set(key, value);
      },
    };

    const middleware = createWishlistStackMiddleware({ apiKey: "k" });
    await middleware({ request: new Request("https://app.test"), context: ctx }, () => new Response("ok"));

    expect(entries.has("wishlistStack")).toBe(true);
    expect(entries.has("wishlistStackClient")).toBe(true);
  });
});
