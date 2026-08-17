import { describe, expectTypeOf, it } from "vitest";
import type {
  AddItemsToListBody,
  ContainsVariantsBody,
  CreateListBody,
} from "../../src/types/requests/lists";
import type {
  ContainsVariantsResponse,
  GetListResponse,
  VariantMembershipMatch,
} from "../../src/types/responses/lists";

type IsRequired<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

describe("request type contracts", () => {
  it("requires fields that the API requires", () => {
    expectTypeOf<IsRequired<CreateListBody, "name">>().toEqualTypeOf<true>();
    expectTypeOf<IsRequired<AddItemsToListBody, "items">>().toEqualTypeOf<true>();
    expectTypeOf<
      IsRequired<AddItemsToListBody["items"][number], "variantId">
    >().toEqualTypeOf<true>();
    expectTypeOf<IsRequired<ContainsVariantsBody, "variantIds">>().toEqualTypeOf<true>();
  });

  it("exports the membership response shape", () => {
    expectTypeOf<ContainsVariantsResponse>().toEqualTypeOf<{
      listId: string;
      present: Record<string, boolean>;
      matches: Record<string, VariantMembershipMatch[]>;
    }>();
  });

  it("models list-detail pagination separately from collections", () => {
    expectTypeOf<GetListResponse["pagination"]>().toEqualTypeOf<{
      page: number;
      pageSize: number;
      totalItems: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }>();
  });
});
