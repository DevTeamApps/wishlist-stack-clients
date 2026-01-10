# wjs-client

TypeScript SDK for the Wishlist JS API.

## Install (internal GitHub)

From another repo in the same GitHub org:

```bash
# pick a tag (recommended) or commit SHA
npm i github:YourOrg/wjs-client#v0.1.0
```

### Why this works

This repo includes a `"prepare"` script which runs `npm run build` during GitHub installs, so consumers don’t need `dist/` committed.

## Usage

```ts
import { createWjsClient } from "wjs-client";

const client = createWjsClient({
  baseUrl: "https://api.wjs.com",
  apiKey: process.env.WJS_API_KEY!,
  customerAccessToken: process.env.WJS_CUSTOMER_ACCESS_TOKEN, // required for authenticated endpoints
});

const groups = await client.groups.getAll();
```

## Local development

Run watch build:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Consumer artifact verification

This simulates a consumer installing the packed artifact and verifies ESM + CJS resolution:

```bash
npm run verify:pack
```

