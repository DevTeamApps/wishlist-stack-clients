import { describe, expect, it } from "vitest";
import type { WishlistStackClient } from "@sdg.la/wishlist-stack-sdk";
import { getWishlistStackClient } from "../src/context";

describe("getWishlistStackClient", () => {
  it("reads wishlistStackClient from plain object context", async () => {
    const wishlistStackClient = {} as WishlistStackClient;
    const ctx: any = { wishlistStackClient };

    await expect(getWishlistStackClient(ctx)).resolves.toBe(wishlistStackClient);
  });

  it("reads wishlistStackClient from context.get('wishlistStackClient')", async () => {
    const wishlistStackClient = {} as WishlistStackClient;
    const ctx: any = {
      get(key: string) {
        return key === "wishlistStackClient" ? wishlistStackClient : undefined;
      },
    };

    await expect(getWishlistStackClient(ctx)).resolves.toBe(wishlistStackClient);
  });
});
