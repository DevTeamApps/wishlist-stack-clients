# Getting a customer access token (Shopify Liquid storefront)

Authenticated SDK endpoints require a `customerAccessToken`. In a Liquid theme, you typically run client-side JavaScript (theme asset or inline script) to perform the OAuth 2.0 + PKCE flow and pass the resulting `access_token` into `createWishlistStackClient({ customerAccessToken })`.

**Official Shopify documentation:**

- [Getting started with the Customer Account API](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started) — setup, credentials, OAuth overview
- [Customer Account API reference (OAuth)](https://shopify.dev/docs/api/customer/latest) — authorize/token endpoints, PKCE, `prompt=none` silent auth

> **Example only.** This snippet is adapted from Shopify's documentation for illustration. It is not maintained or supported by this SDK. Your theme, Customer Account API settings, and Shopify session behavior may differ — mileage may vary. For Hydrogen storefronts, use [`@sdg.la/wishlist-stack-hydrogen`](../hydrogen/README.md) instead.

## Flow

1. Handle OAuth callback — exchange `code` for tokens
2. Refresh existing tokens when possible
3. Otherwise redirect with `prompt=none` for silent auth (requires an existing Shopify login session)

## Prerequisites

- Store ID and client ID from Customer Account API settings in Shopify admin
- Redirect URI registered in admin (must match `redirectUri` in the script)
- Customer logged in via the account link for silent auth to succeed

## Example

```js
(async function () {
  const storeId = "YOUR_STORE_ID";
  const clientId = ""; // Client id from headless environment
  const redirectUri = window.location.origin;

  function generateRandomCode() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return String.fromCharCode.apply(null, Array.from(array));
  }

  function base64UrlEncode(str) {
    const base64 = btoa(str);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function convertBufferToString(hash) {
    const uintArray = new Uint8Array(hash);
    const numberArray = Array.from(uintArray);
    return String.fromCharCode(...numberArray);
  }

  async function generateCodeVerifier() {
    const rando = generateRandomCode();
    return base64UrlEncode(rando);
  }

  async function generateCodeChallenge(codeVerifier) {
    const digestOp = await crypto.subtle.digest(
      { name: "SHA-256" },
      new TextEncoder().encode(codeVerifier),
    );
    const hash = convertBufferToString(digestOp);
    return base64UrlEncode(hash);
  }

  async function generateState() {
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2);
    return timestamp + randomString;
  }

  async function generateNonce(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      nonce += characters.charAt(randomIndex);
    }
    return nonce;
  }

  // ── Step 1: Check for authorization code in URL (callback handler) ──

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    console.log("Authorization code found, exchanging for tokens...");

    const codeVerifier = localStorage.getItem("code-verifier");
    if (!codeVerifier) {
      console.error("No code-verifier found in localStorage. Cannot exchange code.");
      return;
    }

    // Clean up URL
    urlParams.delete("code");
    urlParams.delete("state");
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", newUrl);
    localStorage.removeItem("code-verifier");

    // Exchange code for tokens
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("client_id", clientId);
    body.append("redirect_uri", redirectUri);
    body.append("code", code);
    body.append("code_verifier", codeVerifier);

    try {
      const response = await fetch(
        `https://shopify.com/authentication/${storeId}/oauth/token`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        },
      );
      const data = await response.json();

      if (!data.access_token) {
        console.error("Token exchange failed:", data);
        return;
      }

      const { access_token, expires_in, id_token, refresh_token } = data;
      localStorage.setItem(
        "customer-access-data",
        JSON.stringify({ access_token, expires_in, id_token, refresh_token }),
      );
      console.log("Access token obtained successfully!");
      console.log("Access Token:", access_token);

      return;
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      return;
    }
  }

  // ── Step 2: Check for existing tokens and try refresh ──

  const existingData = localStorage.getItem("customer-access-data");
  if (existingData) {
    const parsed = JSON.parse(existingData);
    if (parsed.refresh_token) {
      console.log("Found existing refresh token, attempting refresh...");

      const body = new URLSearchParams();
      body.append("grant_type", "refresh_token");
      body.append("client_id", clientId);
      body.append("refresh_token", parsed.refresh_token);

      try {
        const response = await fetch(
          `https://shopify.com/authentication/${storeId}/oauth/token`,
          {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body,
          },
        );
        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem(
            "customer-access-data",
            JSON.stringify({
              access_token: data.access_token,
              expires_in: data.expires_in,
              id_token: data.id_token || parsed.id_token,
              refresh_token: data.refresh_token,
            }),
          );
          console.log("Token refreshed successfully!");
          console.log("Access Token:", data.access_token);
          return;
        }
      } catch (error) {
        console.warn("Refresh failed, will attempt silent auth:", error);
      }
    }
  }

  const state = await generateState();
  const nonce = await generateNonce(16);
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("code-verifier", verifier);

  const authUrl = new URL(
    `https://shopify.com/authentication/${storeId}/oauth/authorize`,
  );
  authUrl.searchParams.append("scope", "openid email customer-account-api:full");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("nonce", nonce);
  authUrl.searchParams.append("code_challenge", challenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  authUrl.searchParams.append("prompt", "none"); // Silent auth - no login UI

  console.log("Redirecting for silent auth...");
  console.log("If you see a login_required error in the URL after redirect,");
  console.log("it means no Shopify session exists - log in via the account link first.");

  window.location.href = authUrl.toString();
})();
```
