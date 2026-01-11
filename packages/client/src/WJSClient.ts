import { createWjsClient, type CreateWjsClientOptions, type WjsClient } from "./client/createWjsClient";

/**
 * Class wrapper around `createWjsClient()` for users who prefer `new`.
 * Exposes `lists`, `groups`, and `shared` resources.
 */
export class WJSClient implements WjsClient {
  readonly lists: WjsClient["lists"];
  readonly groups: WjsClient["groups"];
  readonly shared: WjsClient["shared"];

  constructor(opts: CreateWjsClientOptions) {
    const client = createWjsClient(opts);
    this.lists = client.lists;
    this.groups = client.groups;
    this.shared = client.shared;
  }

  /** Back-compat alias: `client.groups.getAll()` */
  getGroups() {
    return this.groups.getAll();
  }

  /** Back-compat alias: `client.groups.getById(groupId)` */
  getGroupById(groupId: string) {
    return this.groups.getById(groupId);
  }

  /** Back-compat alias: `client.lists.getAll()` */
  getLists() {
    return this.lists.getAll();
  }
}

