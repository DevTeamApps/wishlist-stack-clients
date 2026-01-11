import { vi } from "vitest";

export type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

export type MockFetch = ReturnType<typeof createMockFetch>["fetch"];

export function createMockFetch() {
  const calls: FetchCall[] = [];

  let responder: (call: FetchCall) => Response | Promise<Response> = () =>
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: FetchCall = { input, init };
    calls.push(call);
    return await responder(call);
  });

  return {
    fetch,
    calls,
    setResponder(next: typeof responder) {
      responder = next;
    },
    lastCall(): FetchCall | undefined {
      return calls[calls.length - 1];
    },
  };
}

