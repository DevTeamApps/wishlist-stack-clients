import { BASE_URL } from "../constants";
import { createRequest, type FetchLike } from "./request";
import { createListsResource } from "../resources/lists";
import { createGroupsResource } from "../resources/groups";
import { createSharedResource } from "../resources/shared";

export type CreateWjsClientOptions = {
  baseUrl?: string;
  apiKey: string;
  customerAccessToken?: string;
  fetch?: FetchLike;
};

export type WjsClient = {
  lists: ReturnType<typeof createListsResource>;
  groups: ReturnType<typeof createGroupsResource>;
  shared: ReturnType<typeof createSharedResource>;
};

export function createWjsClient(opts: CreateWjsClientOptions): WjsClient {
  if (!opts.apiKey) {
    throw new Error(
      "merchant api key is required. Pass it to createWjsClient({ apiKey })",
    );
  }

  const fetchImpl: FetchLike | undefined = opts.fetch ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) {
    throw new Error(
      "No fetch implementation found. Provide one via createWjsClient({ fetch }) or use Node 18+ / modern browsers.",
    );
  }

  const request = createRequest({
    baseUrl: opts.baseUrl ?? BASE_URL,
    apiKey: opts.apiKey,
    customerAccessToken: opts.customerAccessToken,
    fetch: fetchImpl,
  });

  return {
    lists: createListsResource(request),
    groups: createGroupsResource(request),
    shared: createSharedResource(request),
  };
}

