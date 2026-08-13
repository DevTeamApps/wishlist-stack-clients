export { createWishlistStackClient } from "./client/createWishlistStackClient";
export type { CreateWishlistStackClientOptions, WishlistStackClient } from "./client/createWishlistStackClient";

export { WishlistStackClient as WishlistStackSDK } from "./WishlistStackClient";
export { WishlistStackApiError, isWishlistStackApiError } from "./client/errors";
export { clampPageSize, clampPage } from "./helpers/pagination";

export * from "./types";

