import { describe, expect, it } from "vitest";
import { WjsApiError, isWjsApiError } from "../../src/client/errors";

describe("WjsApiError helpers", () => {
  it("isWjsApiError narrows by shape (not instanceof)", () => {
    const err = new WjsApiError("nope", { status: 400, url: "u", method: "GET" });
    expect(isWjsApiError(err)).toBe(true);
    expect(isWjsApiError({})).toBe(false);
    expect(isWjsApiError(null)).toBe(false);
  });

  it("apiErrors/apiErrorMessages extract from ApiErrorResponse-like bodies", () => {
    const err = new WjsApiError("bad", {
      status: 400,
      url: "u",
      method: "GET",
      body: { errors: [{ message: "m1", field: "f" }, { message: "m2" }] },
    });

    expect(err.apiErrors).toEqual([{ message: "m1", field: "f" }, { message: "m2" }]);
    expect(err.apiErrorMessages).toEqual(["m1", "m2"]);
  });
});

