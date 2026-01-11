// NOTE: Most endpoints in the current OpenAPI spec do not define response schemas.
// These named aliases are intentionally stable so you can refine them over time.

import type { GetGroupResponse } from "./groups";
import type { GetListResponse } from "./lists";

export type GetSharedListResponse = GetListResponse;
export type GetSharedGroupResponse = GetGroupResponse;

