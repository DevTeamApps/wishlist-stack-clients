import type { WishlistStackHydrogenOptions } from "./types";
import { createWishlistStackServerContext } from "./server";

type MiddlewareArgs = {
  request: Request;
  context: any;
};

type MiddlewareNext = () => Promise<Response> | Response;

/**
 * React Router middleware helper (Hydrogen react-router, middleware-enabled).
 *
 * We intentionally avoid importing react-router types here; we only require the
 * common shape: an object `context` that we can mutate (or that has `set()`).
 */
export function createWishlistStackMiddleware(options: WishlistStackHydrogenOptions) {
  const attach = createWishlistStackServerContext(options);
  return async function wishlistStackMiddleware(args: MiddlewareArgs, next: MiddlewareNext) {
    const ctxObj = args.context ?? {};
    // `attach` registers `wishlistStack` and `wishlistStackClient` onto the context (supports `set()` and mutation).
    attach(ctxObj);

    return await next();
  };
}

