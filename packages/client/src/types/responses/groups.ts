// NOTE: Most endpoints in the current OpenAPI spec do not define response schemas.
// These named aliases are intentionally stable so you can refine them over time.

import type { FeaturedItem, OkResponse, Pagination } from "./common";
export type { FeaturedItem, Image, OkResponse, Pagination } from "./common";

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  shared: boolean;
  listCount: number;
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

export type GetGroupResponse = GroupDetail;
export type CreateGroupResponse = unknown;
export type UpdateGroupDetailsResponse = unknown;
export type RemoveGroupResponse = OkResponse;
export type ReorderGroupResponse = unknown;
export type MarkGroupSharedResponse = unknown;
export type RevokeGroupSharedResponse = unknown;

