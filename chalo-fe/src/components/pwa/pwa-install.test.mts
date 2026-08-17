import assert from "node:assert/strict";
import test from "node:test";
import {
  getPwaPromptKind,
  isStandaloneDisplay,
  shouldRegisterServiceWorker,
} from "./pwa-install.ts";

test("installed display mode never shows a prompt", () => {
  assert.equal(isStandaloneDisplay(true, false), true);
  assert.equal(getPwaPromptKind({ standalone: true, mobile: true, ios: false, installAvailable: true }), "none");
});
test("mobile Chromium installs and iOS receives instructions", () => {
  assert.equal(getPwaPromptKind({ standalone: false, mobile: true, ios: false, installAvailable: true }), "install");
  assert.equal(getPwaPromptKind({ standalone: false, mobile: true, ios: true, installAvailable: false }), "ios-guide");
});

test("navigator standalone also marks an installed display", () => {
  assert.equal(isStandaloneDisplay(false, true), true);
  assert.equal(isStandaloneDisplay(false, false), false);
});

test("desktop and unavailable Chromium installs do not show a prompt", () => {
  assert.equal(getPwaPromptKind({ standalone: false, mobile: false, ios: false, installAvailable: true }), "none");
  assert.equal(getPwaPromptKind({ standalone: false, mobile: true, ios: false, installAvailable: false }), "none");
});

test("service worker registration stays out of development MSW scope", () => {
  assert.equal(shouldRegisterServiceWorker(true, "development"), false);
  assert.equal(shouldRegisterServiceWorker(true, "production"), true);
  assert.equal(shouldRegisterServiceWorker(false, "production"), false);
});
