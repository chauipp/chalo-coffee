import assert from "node:assert/strict";
import test from "node:test";
import {
  getPwaPromptKind,
  isIOSDevice,
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

test("iPadOS desktop user agent is treated as iOS when it has touch input", () => {
  const iPadOsDesktopUserAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/13.1 Mobile/15E148 Safari/604.1";

  assert.equal(isIOSDevice(iPadOsDesktopUserAgent, 5), true);
  assert.equal(isIOSDevice(iPadOsDesktopUserAgent, 0), false);
});
