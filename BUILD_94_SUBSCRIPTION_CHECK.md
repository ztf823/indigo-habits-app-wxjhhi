# Build 94 — Subscription-only audit

Build 93 binary source: 3338b6ff6490d3dacc06e6f0352044155f572906.
Release branch: build-83-revenuecat-subscriptions. Current marketing version remains 1.0.69; iOS build number is 94.

## Finding

The shipped hook and both Profile variants initialize Free, do not trust the local profile Premium flag, and only unlock after RevenueCat reports the configured entitlement. No default Premium/test bypass exists in this source.

RevenueCat inspection on October 3, 2026 showed one active sandbox App Store subscription for com.indigohabits.pro.monthly, purchased September 30, renewed October 1 and October 2, next renewal/expiry October 3 at 21:25 UTC. Multiple reinstall anonymous IDs are aliased to this subscriber. This is direct evidence that prior sandbox purchases can legitimately restore Premium across installs. It is not evidence that a fresh non-subscriber receives Premium. The anonymous ID on the user's phone was not independently read, so that phone's exact account association remains unconfirmed.

The adapter previously trusted presence in the SDK's active map and did not force a fresh fetch. Build 94 explicitly checks isActive, expected iOS store/product, and future subscription expiry, and invalidates SDK CustomerInfo cache before status fetch. Purchase, restore and listener share the same validator. Empty restore clears Profile's Premium state. No forced Free override for genuine subscribers was added.

## Presentation

Customer-facing Indigo Premium Monthly replaces raw/internal titles; localized StoreKit price remains sourced from RevenueCat's product.priceString. Current benefits and Free 5/5/3 limits are shown in the existing paywall. Layout and unrelated features are unchanged.

## Validation

- TypeScript --noEmit passed.
- node tests/subscription-flow.cjs passed (real adapter, mocked native/store boundary): non-subscriber, init/network failure, cancelled/failed purchase, empty/valid restore, valid purchase, restart persistence, expiry, promotional/wrong-product rejection, listeners, title, localized price.
- git diff --check passed.
- Physical-device fresh install, Apple purchase-sheet presentation and a new TestFlight sandbox transaction are not performed by these tests. Require a sandbox account without an active purchase for the Free-to-Premium check. Do not delete RevenueCat customer history or manufacture Free status while a valid subscription exists.

## Release

Use TESTFLIGHT_RELEASE_FLOW.md and the existing Build iOS production and submit to TestFlight workflow against the exact release commit. No separate workflow or Transporter path.
