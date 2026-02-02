import { describe, expect, it } from "vitest";
import { WishlistStackApiError, isWishlistStackApiError } from "../../src/client/errors";

describe("WishlistStackApiError helpers", () => {
  it("isWishlistStackApiError narrows by shape (not instanceof)", () => {
    const err = new WishlistStackApiError("nope", { status: 400, url: "u", method: "GET" });
    expect(isWishlistStackApiError(err)).toBe(true);
    expect(isWishlistStackApiError({})).toBe(false);
    expect(isWishlistStackApiError(null)).toBe(false);
  });

  it("apiErrors/apiErrorMessages extract from ApiErrorResponse-like bodies", () => {
    const err = new WishlistStackApiError("bad", {
      status: 400,
      url: "u",
      method: "GET",
      body: { errors: [{ message: "m1", field: "f" }, { message: "m2" }] },
    });

    expect(err.apiErrors).toEqual([{ message: "m1", field: "f" }, { message: "m2" }]);
    expect(err.apiErrorMessages).toEqual(["m1", "m2"]);
  });
});

