export type WjsApiErrorDetails<TBody = unknown> = {
  status: number;
  url: string;
  method: string;
  requestId?: string;
  body?: TBody;
};

export class WjsApiError<TBody = unknown> extends Error {
  readonly name = "WjsApiError";
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly requestId?: string;
  readonly body?: TBody;

  constructor(message: string, details: WjsApiErrorDetails<TBody>) {
    super(message);
    this.status = details.status;
    this.url = details.url;
    this.method = details.method;
    this.requestId = details.requestId;
    this.body = details.body;
  }
}

