import { describe, expect, it } from "vitest";
import type { WjsClient } from "@devteam-sdg/wjs-client";
import { getWjsClient } from "../src/context";

describe("getWjsClient", () => {
  it("reads wjsClient from plain object context", async () => {
    const wjsClient = {} as WjsClient;
    const ctx: any = { wjsClient };

    await expect(getWjsClient(ctx)).resolves.toBe(wjsClient);
  });

  it("reads wjsClient from context.get('wjsClient')", async () => {
    const wjsClient = {} as WjsClient;
    const ctx: any = {
      get(key: string) {
        return key === "wjsClient" ? wjsClient : undefined;
      },
    };

    await expect(getWjsClient(ctx)).resolves.toBe(wjsClient);
  });
});

