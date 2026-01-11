import type { WjsHydrogenOptions } from "./types";
import { createWjsServerContext } from "./server";

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
export function createWjsMiddleware(options: WjsHydrogenOptions) {
  const attach = createWjsServerContext(options);
  return async function wjsMiddleware(args: MiddlewareArgs, next: MiddlewareNext) {
    const ctxObj = args.context ?? {};
    // `attach` registers `wjs` and `wjsClient` onto the context (supports `set()` and mutation).
    attach(ctxObj);

    return await next();
  };
}

