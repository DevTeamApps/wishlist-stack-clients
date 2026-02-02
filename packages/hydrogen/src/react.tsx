import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createWishlistStackClient, type WishlistStackClient } from "@sdg.la/wishlist-stack-sdk";
import type { BootstrapClientConfig } from "./types";

export type WishlistStackProviderMode = "proxy" | "direct";

/**
 * Lightweight client-side state for convenience features (e.g. "is this variant wishlisted?").
 * Intentionally minimal and extendable.
 */
export type WishlistStackGlobalState = {
  savedVariantIds?: string[];
  savedProductIds?: string[];
};

export type WishlistStackProviderProps = {
  children: React.ReactNode;
  config: Pick<BootstrapClientConfig, "apiKey" | "baseUrl">;
  /**
   * Only used for `mode="direct"`.
   * In proxy mode, authenticated requests should be done server-side.
   */
  initialCustomerAccessToken?: string;
  mode?: WishlistStackProviderMode;
  /**
   * Optional, app-managed global state (can be hydrated from a loader).
   * You can update it via `useWishlistStack().setState(...)`.
   */
  initialState?: WishlistStackGlobalState;
};

type WishlistStackProviderValue = {
  client: WishlistStackClient;
  mode: WishlistStackProviderMode;
  state: WishlistStackGlobalState;
  setState: (next: WishlistStackGlobalState | ((prev: WishlistStackGlobalState) => WishlistStackGlobalState)) => void;
};

const WishlistStackContext = createContext<WishlistStackProviderValue | null>(null);

export function WishlistStackProvider(props: WishlistStackProviderProps) {
  const mode: WishlistStackProviderMode = props.mode ?? "proxy";

  const [state, setState] = useState<WishlistStackGlobalState>(props.initialState ?? {});

  const client = useMemo(() => {
    return createWishlistStackClient({
      apiKey: props.config.apiKey,
      baseUrl: props.config.baseUrl,
      customerAccessToken: mode === "direct" ? props.initialCustomerAccessToken : undefined,
    });
  }, [props.config.apiKey, props.config.baseUrl, props.initialCustomerAccessToken, mode]);

  const setStateStable = useCallback(
    (next: WishlistStackGlobalState | ((prev: WishlistStackGlobalState) => WishlistStackGlobalState)) => setState(next as any),
    [],
  );

  const value = useMemo(
    () => ({ client, mode, state, setState: setStateStable }),
    [client, mode, state, setStateStable],
  );

  return <WishlistStackContext.Provider value={value}>{props.children}</WishlistStackContext.Provider>;
}

export function useWishlistStack(): WishlistStackProviderValue {
  const ctx = useContext(WishlistStackContext);
  if (!ctx) {
    throw new Error("useWishlistStack must be used within <WishlistStackProvider>.");
  }
  return ctx;
}

export function useWishlistStackClient(): WishlistStackClient {
  return useWishlistStack().client;
}
