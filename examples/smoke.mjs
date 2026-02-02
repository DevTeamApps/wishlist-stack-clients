// Local smoke runner (manual): builds then imports from dist.
//
// Usage:
//   WISHLIST_STACK_BASE_URL="https://api.example.com" WISHLIST_STACK_API_KEY="..." node examples/smoke.mjs
//   WISHLIST_STACK_BASE_URL="..." WISHLIST_STACK_API_KEY="..." WISHLIST_STACK_CUSTOMER_ACCESS_TOKEN="..." node examples/smoke.mjs

import { createWishlistStackClient } from "../packages/client/dist/index.js";

const baseUrl = process.env.WISHLIST_STACK_BASE_URL;
const apiKey = process.env.WISHLIST_STACK_API_KEY;
const customerAccessToken = process.env.WISHLIST_STACK_CUSTOMER_ACCESS_TOKEN;

if (!baseUrl || !apiKey) {
  throw new Error("Set WISHLIST_STACK_BASE_URL and WISHLIST_STACK_API_KEY to run this smoke script.");
}

const client = createWishlistStackClient({ baseUrl, apiKey, customerAccessToken });

console.log("Calling shared.getSharedList('demo')...");
try {
  const shared = await client.shared.getSharedList("demo");
  console.log("shared.getSharedList OK:", shared);
} catch (e) {
  console.error("shared.getSharedList failed:", e);
}

if (customerAccessToken) {
  console.log("Calling groups.getAll()...");
  try {
    const groups = await client.groups.getAll();
    console.log("groups.getAll OK:", groups);
  } catch (e) {
    console.error("groups.getAll failed:", e);
  }
} else {
  console.log("Skipping authenticated call; set WISHLIST_STACK_CUSTOMER_ACCESS_TOKEN to test it.");
}
