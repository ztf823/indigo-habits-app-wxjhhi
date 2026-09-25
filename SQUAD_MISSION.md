# Indigo Habits repair mission

Updated 2026-09-25. Target version: 1.0.58 (iOS build 61).

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
- iOS native project generation passes with the repaired opaque 1024x1024 blue-flame icon. Speech/microphone/photo permissions present; unused camera permission absent.
- A native project generation/export is not a signed native compilation or device test.

## Release gates still open
- Signed native cloud build and TestFlight processing.
- Real-device launch, relaunch persistence, dictation permission/finish/error, photo/history/PDF, notification delivery, and visual review.
- StoreKit sandbox purchase, cancellation, active/inactive restore, offline entitlement, actual storefront price.
- RevenueCat offering and `pro` entitlement linkage to the existing Apple product.
- Hosted privacy/support content and App Store screenshots/review notes must reflect the repaired version; current store draft still refers to 1.0.19.
- Web SQLite requires browser storage support and hosting isolation headers; unsupported storage displays an explicit retry/error screen.

Do not claim the app is fully repaired or release-ready until these gates are verified. No App Store review submission or public release has been performed in this repair pass.

## Build and release status — 2026-09-25
- GitHub write access is working. The repair is on `codex/indigo-repair-1.0.58`; latest asset/build-number correction commit: `af1c3074d51ea5c2eb07a6117dc6ed2d71d4e20d`.
- Build fixes: production EAS now pins Node 22.23.1 and pnpm 11.19.0. This avoids the pnpm 12 binary bootstrap failure and the Node 20 `node:sqlite` failure; pnpm 10 was rejected because it cannot read the existing multi-document lockfile.
- Source iOS build number is 61. EAS remote auto-increment is enabled. A failed prebuild did consume build 60; the next cloud build must report 1.0.58 (61).
- EAS build `c56b1f5a-df2f-449d-a8fc-d98bc98e80a8` reached native prebuild as 1.0.58 (60), then failed because the GitHub copy of the icon PNG had a CRC error. The source asset is now an opaque 1024x1024 PNG with validated CRC; local iOS prebuild passes.
- Latest source checks pass: frozen offline install, TypeScript, ESLint, two regression tests, and local iOS prebuild. iOS/web JavaScript exports passed before the final icon re-encoding and must be rerun.
- Next action: rerun iOS/web exports, start a cloud build from the exact latest branch commit, confirm 1.0.58 (61), and verify signed build completion. Keep App Store submission off.
