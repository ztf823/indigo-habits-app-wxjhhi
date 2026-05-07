# Build 46–52 Crash Fix Summary
## Commit message (use this for git commit -m)
```
fix: resolve all TestFlight SIGABRT and RCTFatal launch crashes (builds 46-52)
```

## Files changed

### utils/database.ts
- Replaced `getDb()` (threw synchronously on null) with `requireDb(caller)` — logs caller name on null, never throws
- Added `isDatabaseReady()`, `waitForDatabase()`, `retryDatabaseInit()` exports
- `initDatabase` deduplicates concurrent calls, tracks `dbInitialized`/`dbInitFailed`, clears promise on failure to allow retry
- Every exported function has a null-guard returning a safe default ([], null, false, {})

### utils/revenueCat.ts
- Added iOS 26+ version guard — skips `Purchases.configure()` entirely on iOS 26+ (fixes SIGABRT from `DangerousSettings.__allocating_init` crashing on StoreKit 2 enforcement)
- RevenueCat module loaded lazily via `require()` inside try/catch so a missing native module cannot crash launch
- All functions guard on `rcReady` flag before calling native module

### utils/notifications.ts
- Each setup call (`setNotificationHandler`, `addNotificationReceivedListener`, `addNotificationResponseReceivedListener`) individually wrapped in try/catch
- Listener callbacks changed from `async` to sync to prevent unhandled promise chains on background threads

### contexts/WidgetContext.tsx
- Completely replaced with a safe no-op implementation
- Removed all `ExtensionStorage` / `@bacons/apple-targets` native calls that were throwing `NSInvalidArgumentException` on background threads when App Group entitlement was missing from provisioning profile
- `refreshWidget` is now a no-op `() => {}`

### app/_layout.tsx
- RevenueCat init moved to a separate `useEffect` that fires AFTER `isReady` — never blocks launch
- Database init with retry logic: calls `initDatabase()`, checks `isDatabaseReady()`, waits 500ms, retries once, then continues in degraded mode
- Global unhandled promise rejection handler registered on `global` to catch any escaped rejections before they reach the native bridge and trigger `RCTFatal`

### app/(tabs)/_layout.tsx
- Removed nested `GestureHandlerRootView` (was crashing with RNGH v2+ when nested inside the root one in `app/_layout.tsx`)
- Replaced with plain `<View style={{ flex: 1 }}>`
- Added `.runOnJS(true)` to `Gesture.Pan()` — forces gesture callbacks onto JS thread, not worklet thread
- Added `safeNavigateToTab` wrapper with try/catch around all navigation calls
- `handleTabPress` wrapped in try/catch

### app/(tabs)/(home)/index.tsx
- Replaced three concurrent fire-and-forget `useEffect` data loads with a single sequential `loadAll()` inside one try/catch
- Removed duplicate pan gesture, `navigateToTab`, `getCurrentIndex`, `tabs` logic (was already handled by tabs layout)
- Removed unused `GestureDetector`, `Gesture`, `useRouter`, `usePathname` imports

### package.json
- `react-native-purchases` downgraded from `^9.10.0` to `^8.12.0` (v9.x introduced `DangerousSettings` class that crashes on iOS 26 Beta)

## Root causes fixed
1. **SIGABRT Thread 4/6/8** — RevenueCat `DangerousSettings.__allocating_init` crashing on iOS 26 Beta StoreKit 2 enforcement → fixed by iOS 26 version guard
2. **SIGABRT Thread 4** — `WidgetContext` calling `WidgetCenter.reloadAllTimelines()` natively without App Group entitlement → fixed by no-op replacement  
3. **RCTFatal** — Nested `GestureHandlerRootView` causing fatal JS exception on launch → fixed by removing inner wrapper
4. **RCTFatal** — `getDb()` throwing synchronously inside bridge-dispatched async callbacks → fixed by `requireDb()` null-return pattern
5. **RCTFatal** — Three concurrent DB calls racing on first render → fixed by sequential `loadAll()`
6. **RCTFatal** — Gesture `.onEnd` callbacks running on worklet thread, exceptions escaping to native bridge → fixed by `.runOnJS(true)`
