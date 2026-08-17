---
"@sdg.la/wishlist-stack-sdk": minor
"@sdg.la/wishlist-stack-hydrogen": minor
---

Complete the wishlist remediation client contract for sc-490614.

- Add `lists.containsVariants` for indexed membership checks and lightweight
  matching item records without product hydration.
- Require list names, add-item arrays, and add-item variant IDs in TypeScript.
- Restrict opt-in HTTP 429 retries to safe reads, including membership checks.
- Expose membership checks through the Hydrogen lazy client.
- Model list-detail pagination separately, reject empty batched adds locally,
  and support the backend's additive compatibility response.
