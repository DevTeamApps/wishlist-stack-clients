export type WjsHydrogenOptions = {
  apiKey: string;
  baseUrl?: string;
  /**
   * Override how we retrieve the customer access token.
   * If omitted, we attempt to call `context.customerAccount.getAccessToken()`.
   */
  getCustomerAccessToken?: (context: unknown) => Promise<string | undefined> | string | undefined;
};

export type BootstrapClientConfig = {
  apiKey: string;
  baseUrl?: string;
  customerAccessToken?: string;
};

export type WjsHydrogenServer = {
  getCustomerAccessToken(): Promise<string | undefined>;
  getClient(): Promise<import("@wjs-client/client").WjsClient>;
  bootstrapClientConfig(opts?: { exposeCustomerAccessToken?: boolean }): Promise<BootstrapClientConfig>;
};

declare global {
  // Merge into Hydrogen’s global additional context type so `context.wjs` is typed in loaders/actions.
  // Consumers can also define their own additional context in their app alongside this.
  interface HydrogenAdditionalContext {
    wjs: WjsHydrogenServer;
    /**
     * Lazy, request-scoped client. Methods automatically resolve the underlying
     * authenticated client for the current request.
     *
     * Usage: `await context.wjsClient.groups.getAll()`
     */
    wjsClient: import("@wjs-client/client").WjsClient;
  }
}

