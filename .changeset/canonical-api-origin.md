---
"@sdg.la/wishlist-stack-sdk": minor
"@sdg.la/wishlist-stack-hydrogen": minor
---

Use `https://app.wishliststack.com` as the default direct API origin. Explicit `baseUrl` values, request authentication, API payloads and pagination sizes up to 25 are unchanged. When upgrading a browser integration that uses the default, allow the new origin in CSP `connect-src`, or retain its existing explicit `baseUrl`. Shopify Online Store themes should use their installed same-origin app proxy; headless integrations can use the canonical direct origin.
