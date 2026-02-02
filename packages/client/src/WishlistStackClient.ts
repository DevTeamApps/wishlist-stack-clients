import { createWishlistStackClient, type CreateWishlistStackClientOptions, type WishlistStackClient as IWishlistStackClient } from "./client/createWishlistStackClient";

/**
 * Class wrapper around `createWishlistStackClient()` for users who prefer `new`.
 * Exposes `lists`, `groups`, and `shared` resources.
 */
export class WishlistStackClient implements IWishlistStackClient {
  readonly lists: IWishlistStackClient["lists"];
  readonly groups: IWishlistStackClient["groups"];
  readonly shared: IWishlistStackClient["shared"];

  constructor(opts: CreateWishlistStackClientOptions) {
    const client = createWishlistStackClient(opts);
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
