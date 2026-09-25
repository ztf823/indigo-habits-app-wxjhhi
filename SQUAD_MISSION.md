# Indigo Habits repair mission

Updated 2026-09-25. Target version: 1.0.58.

## Objective and authorization
Repair the existing Indigo Habits app, preserve subscriptions and OS voice-to-text, use the blue-flame identity throughout, and verify before App Store review. User authorized Squad to proceed. No paid AI services and no duplicate apps/products.

## Completed source repairs
- Prof integrated configuration, build checks, local-date Home tracking, focus refresh, removal of unused broken template files, and repository persistence.
- Rio unified shared indigo/electric-blue/cyan branding across the icon/splash, screens, navigation, controls, and PDF output.
- Rio repaired serialized journal autosave, speech completion on Done, visible save failures, and durable picked-photo storage.
- Rio repaired SQLite initialization failure handling, retry UI, first-install-only seeding, and consecutive local-date streaks. Browser builds use actual SQLite rather than fake successful storage.
- Pal repaired subscription initialization races, failed/cancelled purchase handling, active-entitlement checks, exact existing-product selection, dynamic store pricing, and restore failure handling.
- Pal repaired reminder opt-in permission requests, schedule/cancel errors, saved-setting ordering, and concurrent toggle handling.
- Store/privacy source drafts now match implemented behavior and identify hosted metadata still awaiting verification.

## Verified account facts
- Expo project: ztf823/indigo-habits; project ID c9f381e8-423f-4420-b5c5-d3e6b08dd99d.
- App Store Connect app 6759208557; bundle com.indigohabits.journal2026.
- Existing subscription com.indigohabits.pro.monthly, one month, group 21957741; status Prepare for Submission. No product was created.
- Support/marketing metadata currently points to https://indigohabits.carrd.co/.
- Expo and App Store Connect browser sessions authenticated. EAS CLI authentication is separate; browser GitHub build is available.

## Validation evidence
- Frozen pnpm dependency installation passes; unknown unrs-resolver install script explicitly disabled.
- TypeScript and ESLint pass.
- Retained database/streak and journal-save regression tests pass (node --test scripts/tests/*.cjs).
- iOS JavaScript/Hermes export passes.
- iOS native project generation passes; generated App Store icon is opaque RGB 1024x1024. Speech/microphone/photo permissions present; unused camera permission absent.
- A native project generation/export is not a signed native compilation or device test.

## Release gates still open
- Signed native cloud build and TestFlight processing.
- Real-device launch, relaunch persistence, dictation permission/finish/error, photo/history/PDF, notification delivery, and visual review.
- StoreKit sandbox purchase, cancellation, active/inactive restore, offline entitlement, actual storefront price.
- RevenueCat offering and `pro` entitlement linkage to the existing Apple product.
- Hosted privacy/support content and App Store screenshots/review notes must reflect the repaired version; current store draft still refers to 1.0.19.
- Web SQLite requires browser storage support and hosting isolation headers; unsupported storage displays an explicit retry/error screen.

Do not claim the app is fully repaired or release-ready until these gates are verified. No App Store review submission or public release has been performed in this repair pass.

## Handoff blocker — 2026-09-25
- Repair commit b77dcafead0c816f694fbb05c906a9e71c41e1f1 is local; no remote branch was created.
- Git push failed because terminal GitHub credentials are unavailable.
- Connected GitHub app read access succeeds, but create_blob is rejected with HTTP403 `Resource not accessible by integration`. Repository user permission reports push/admin, but the integration does not have effective contents-write access.
- Expo production build form prepared for codex/indigo-repair-1.0.58, but never confirmed because the repaired branch cannot be uploaded. No build of stale main was started.
- Final combined iOS and web exports pass; final TypeScript, lint, and retained regression tests pass.
- Next action: restore GitHub integration Contents write access for this existing repository (or authenticate an authorized git transport), push the repaired branch, compare remote tree to local tree b351ea6d9b869d70c2e0d7f8449a71fb3f0097bd, and start iOS build from its exact commit.
