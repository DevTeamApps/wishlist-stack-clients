// Local smoke runner (manual): builds then imports from dist.
//
// Usage:
//   WJS_BASE_URL="https://api.wjs.com" WJS_API_KEY="..." node examples/smoke.mjs
//   WJS_BASE_URL="..." WJS_API_KEY="..." WJS_CUSTOMER_ACCESS_TOKEN="..." node examples/smoke.mjs

import { createWjsClient } from "../dist/index.js";

const baseUrl = process.env.WJS_BASE_URL;
const apiKey = process.env.WJS_API_KEY;
const customerAccessToken = process.env.WJS_CUSTOMER_ACCESS_TOKEN;

if (!baseUrl || !apiKey) {
  throw new Error("Set WJS_BASE_URL and WJS_API_KEY to run this smoke script.");
}

const client = createWjsClient({ baseUrl, apiKey, customerAccessToken });

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
  console.log("Skipping authenticated call; set WJS_CUSTOMER_ACCESS_TOKEN to test it.");
}

