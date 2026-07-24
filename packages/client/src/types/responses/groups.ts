// NOTE: Most endpoints in the current OpenAPI spec do not define response schemas.
// These named aliases are intentionally stable so you can refine them over time.

import type { FeaturedItem, OkResponse, Pagination } from "./common";
import type { HydratedWishlistItem } from "./lists";
export type { FeaturedItem, Image, OkResponse, Pagination } from "./common";

/**
 * List embedded on a group when `includeLists=1` is passed to `groups.getAll()`.
 * Items are fully hydrated (same shape as `lists.getById`).
 */
export type GroupSummaryList = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: HydratedWishlistItem[];
};

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
  /** Empty unless `includeLists=1` was requested. */
  lists: GroupSummaryList[];
  featuredItems: FeaturedItem[];
  createdAt: string;
  updatedAt: string;
};

export type GetGroupsResponse = {
  groups: GroupSummary[];
  pagination: Pagination;
};

export type GroupDetailList = {
  id: string;
  position: number;
  name: string;
  description: string | null;
  isShared: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: string[];
  featuredItems: FeaturedItem[];
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
  createdAt: string;
  updatedAt: string;
  listsCount: number;
  lists: GroupDetailList[];
  pagination: Pagination;
};

export type GroupMutationResponse = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GetGroupResponse = GroupDetail;
export type CreateGroupResponse = GroupMutationResponse;
export type DuplicateGroupResponse = GroupMutationResponse;
export type UpdateGroupDetailsResponse = GroupMutationResponse;
export type RemoveGroupResponse = OkResponse;
export type ReorderGroupResponse = unknown;
export type MarkGroupSharedResponse = GroupMutationResponse;
export type RevokeGroupSharedResponse = GroupMutationResponse;

