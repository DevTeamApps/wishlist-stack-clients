import { describe, expect, it } from "vitest";
import { toQueryString } from "../../src/client/query";

describe("toQueryString", () => {
  it("omits null/undefined and stringifies primitives", () => {
    expect(
      toQueryString({
        a: 1,
        b: true,
        c: "x",
        d: null,
        e: undefined,
      }),
    ).toBe("?a=1&b=true&c=x");
  });

  it("repeats array values", () => {
    const qs = toQueryString({ tag: ["a", "b"], n: [1, 2] });
    // URLSearchParams ordering is stable for insertion; assert by containment.
    expect(qs.startsWith("?")).toBe(true);
    expect(qs).toContain("tag=a");
    expect(qs).toContain("tag=b");
    expect(qs).toContain("n=1");
    expect(qs).toContain("n=2");
  });
});

