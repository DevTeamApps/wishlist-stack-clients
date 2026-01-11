import { describe, expect, it } from "vitest";
import { createWjsMiddleware } from "../src/middleware";

describe("createWjsMiddleware", () => {
  it("attaches wjs and wjsClient to a plain object context", async () => {
    const ctx: any = {};
    const middleware = createWjsMiddleware({ apiKey: "k", baseUrl: "https://example.test" });

    const res = await middleware({ request: new Request("https://app.test"), context: ctx }, () => {
      return new Response("ok");
    });

    expect(res).toBeInstanceOf(Response);
    expect(ctx.wjs).toBeTruthy();
    expect(typeof ctx.wjs.getClient).toBe("function");
    expect(ctx.wjsClient).toBeTruthy();
    expect(typeof ctx.wjsClient.groups?.getAll).toBe("function");
  });

  it("uses context.set when available (context map style)", async () => {
    const entries = new Map<string, unknown>();
    const ctx: any = {
      set(key: string, value: unknown) {
        entries.set(key, value);
      },
    };

    const middleware = createWjsMiddleware({ apiKey: "k" });
    await middleware({ request: new Request("https://app.test"), context: ctx }, () => new Response("ok"));

    expect(entries.has("wjs")).toBe(true);
    expect(entries.has("wjsClient")).toBe(true);
  });
});

