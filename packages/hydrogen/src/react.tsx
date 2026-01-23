import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createWjsClient, type WjsClient } from "@devteam-sdg/wjs-client";
import type { BootstrapClientConfig } from "./types";

export type WjsProviderMode = "proxy" | "direct";

/**
 * Lightweight client-side state for convenience features (e.g. “is this variant wishlisted?”).
 * Intentionally minimal and extendable.
 */
export type WjsGlobalState = {
  savedVariantIds?: string[];
  savedProductIds?: string[];
};

export type WjsProviderProps = {
  children: React.ReactNode;
  config: Pick<BootstrapClientConfig, "apiKey" | "baseUrl">;
  /**
   * Only used for `mode="direct"`.
   * In proxy mode, authenticated requests should be done server-side.
   */
  initialCustomerAccessToken?: string;
  mode?: WjsProviderMode;
  /**
   * Optional, app-managed global state (can be hydrated from a loader).
   * You can update it via `useWjs().setState(...)`.
   */
  initialState?: WjsGlobalState;
};

type WjsProviderValue = {
  client: WjsClient;
  mode: WjsProviderMode;
  state: WjsGlobalState;
  setState: (next: WjsGlobalState | ((prev: WjsGlobalState) => WjsGlobalState)) => void;
};

const WjsContext = createContext<WjsProviderValue | null>(null);

export function WjsProvider(props: WjsProviderProps) {
  const mode: WjsProviderMode = props.mode ?? "proxy";

  const [state, setState] = useState<WjsGlobalState>(props.initialState ?? {});

  const client = useMemo(() => {
    return createWjsClient({
      apiKey: props.config.apiKey,
      baseUrl: props.config.baseUrl,
      customerAccessToken: mode === "direct" ? props.initialCustomerAccessToken : undefined,
    });
  }, [props.config.apiKey, props.config.baseUrl, props.initialCustomerAccessToken, mode]);

  const setStateStable = useCallback(
    (next: WjsGlobalState | ((prev: WjsGlobalState) => WjsGlobalState)) => setState(next as any),
    [],
  );

  const value = useMemo(
    () => ({ client, mode, state, setState: setStateStable }),
    [client, mode, state, setStateStable],
  );

  return <WjsContext.Provider value={value}>{props.children}</WjsContext.Provider>;
}

export function useWjs(): WjsProviderValue {
  const ctx = useContext(WjsContext);
  if (!ctx) {
    throw new Error("useWjs must be used within <WjsProvider>.");
  }
  return ctx;
}

export function useWjsClient(): WjsClient {
  return useWjs().client;
}

