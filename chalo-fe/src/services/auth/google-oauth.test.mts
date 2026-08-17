import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGoogleStartUrl,
  resolveGoogleDestination,
  toSafeReturnPath,
} from "./google-oauth.ts";

test("only permits internal return paths for Google sign-in", () => {
  assert.equal(toSafeReturnPath("https://evil.example"), "/account");
  assert.equal(toSafeReturnPath("//evil.example/account"), "/account");
  assert.equal(toSafeReturnPath("/\\evil.example"), "/account");
  assert.equal(
    toSafeReturnPath("/menu/fixed-qr?from=login"),
    "/menu/fixed-qr?from=login",
  );
  assert.equal(toSafeReturnPath("/menu/../admin"), "/admin");
});

test("builds the backend start URL with only a normalized internal path", () => {
  assert.equal(
    buildGoogleStartUrl(
      "http://localhost:8080/api/",
      "https://evil.example/steal",
    ),
    "http://localhost:8080/api/auth/google/start?returnTo=%2Faccount",
  );
});

test("routes promoted Google accounts to their role area", () => {
  assert.equal(resolveGoogleDestination("/account", "ADMIN"), "/admin/dashboard");
  assert.equal(
    resolveGoogleDestination("/admin/orders?status=NEW", "ADMIN"),
    "/admin/orders?status=NEW",
  );
  assert.equal(resolveGoogleDestination("/account", "MODERATOR"), "/staff/pos");
  assert.equal(resolveGoogleDestination("/admin/orders", "CUSTOMER"), "/account");
  assert.equal(resolveGoogleDestination("/menu/fixed-qr", "CUSTOMER"), "/menu/fixed-qr");
});
