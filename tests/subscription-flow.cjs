// Run with: node tests/subscription-flow.cjs
// Exercise the real RevenueCat adapter with native/store boundary mocks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('utils/revenueCat.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const empty = () => ({ entitlements: { active: {} } });
const valid = () => ({ entitlements: { active: { 'Indigo Habits Pro': {
  isActive: true, productIdentifier: 'com.indigohabits.pro.monthly', store: 'APP_STORE',
  expirationDate: new Date(Date.now() + 3600000).toISOString()
} } } });
function adapter({ info = empty(), purchaseError, initError, fetchError } = {}) {
  let listener;
  let invalidated = false;
  let fetched = 0;
  const native = {
    configure() { if (initError) throw initError; }, setLogLevel() {},
    async invalidateCustomerInfoCache() { invalidated = true; },
    async getCustomerInfo() { assert.equal(invalidated, true); fetched++; if (fetchError) throw fetchError; return info; },
    async purchasePackage() { if (purchaseError) throw purchaseError; return { customerInfo: info }; },
    async restorePurchases() { return info; },
    addCustomerInfoUpdateListener(fn) { listener = fn; }, removeCustomerInfoUpdateListener() {},
  };
  const exports = {};
  vm.runInNewContext(code, { exports, __DEV__: false, console: { log() {}, warn() {}, error() {} }, require(name) {
    if (name === 'react-native') return { Platform: { OS: 'ios' } };
    if (name === 'expo-constants') return { default: { expoConfig: { extra: { revenueCatApple: 'mock-key' } } } };
    if (name === 'react-native-purchases') return { default: native, LOG_LEVEL: { INFO: 1 } };
    throw Error(name);
  } });
  return { api: exports, emit(value) { listener(value); }, fetched: () => fetched };
}
(async () => {
  const pkg = { product: { identifier: 'com.indigohabits.pro.monthly', priceString: '€5,49' }, packageType: 'MONTHLY', identifier: '$rc_monthly' };
  const free = adapter();
  assert.equal((await free.api.getCustomerInfo()).isPro, false, 'fresh non-subscriber starts Free');
  assert.equal((await free.api.restorePurchases()).isPro, false, 'empty restore stays Free');
  assert.equal((await free.api.purchasePackage(pkg)).isPro, false, 'transaction without entitlement cannot unlock');
  assert.equal(free.api.getPackageTitle(pkg), 'Indigo Premium Monthly');
  assert.equal(free.api.getPackagePriceLabel(pkg), '€5,49 / month', 'localized store price preserved');
  for (const failure of [{ userCancelled: true }, { message: 'Store failed' }]) {
    const instance = adapter({ purchaseError: failure });
    const result = await instance.api.purchasePackage(pkg);
    assert.equal(result.success, false);
    assert.equal((await instance.api.getCustomerInfo()).isPro, false);
  }
  for (const options of [{ initError: Error('missing module') }, { fetchError: Error('offline') }]) {
    assert.notEqual((await adapter(options).api.getCustomerInfo()).isPro, true, 'failure cannot grant Premium');
  }
  const subscriber = adapter({ info: valid() });
  assert.equal((await subscriber.api.purchasePackage(pkg)).isPro, true);
  assert.equal((await subscriber.api.getCustomerInfo()).isPro, true, 'verified entitlement persists');
  assert.equal((await adapter({ info: valid() }).api.getCustomerInfo()).isPro, true, 'subscriber survives restart');
  assert.equal((await subscriber.api.restorePurchases()).isPro, true);
  let observed;
  await subscriber.api.addCustomerInfoUpdateListener(status => { observed = status; });
  subscriber.emit(valid()); assert.equal(observed, true);
  subscriber.emit(empty()); assert.equal(observed, false);
  for (const mutation of [
    { isActive: false }, { expirationDate: new Date(Date.now() - 1000).toISOString() },
    { expirationDate: null }, { expirationDate: 'invalid' },
    { productIdentifier: 'other.product' }, { store: 'PROMOTIONAL' },
  ]) {
    const info = valid(); Object.assign(info.entitlements.active['Indigo Habits Pro'], mutation);
    assert.equal(subscriber.api.hasPremiumEntitlement(info), false);
    subscriber.emit(info); assert.equal(observed, false);
  }
  console.log('PASS: Free, initialization failure, cancellation, failure, purchase, restart, restore, expiry, listener, title and localized price.');
})().catch(error => { console.error(error); process.exitCode = 1; });
