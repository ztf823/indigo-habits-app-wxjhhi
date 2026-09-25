
// RevenueCat is loaded lazily so a native module problem never prevents the
// rest of the app from launching. Subscription access is only granted when the
// current customer information has the active `pro` entitlement.
import type Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const REVENUECAT_GOOGLE_API_KEY: string = Constants.expoConfig?.extra?.revenueCatGoogle ?? '';
const REVENUECAT_APPLE_API_KEY: string = Constants.expoConfig?.extra?.revenueCatApple ?? '';

// Matches the only subscription configured in App Store Connect.
export const PREMIUM_MONTHLY_PRODUCT_ID = 'com.indigohabits.pro.monthly';
export type EntitlementStatus = 'active' | 'inactive' | 'unavailable';
export type CustomerInfoResult = {
  status: EntitlementStatus;
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
};

type PurchaseResult =
  | { success: true; isPro: true; customerInfo: CustomerInfo }
  | { success: false; isPro: false; cancelled: boolean; error: string };
type RestoreResult =
  | { success: true; isPro: boolean; customerInfo: CustomerInfo }
  | { success: false; isPro: false; error: string };

let rcReady = false;
let rcModule: typeof Purchases | null = null;
let initializationPromise: Promise<boolean> | null = null;

async function loadPurchases(): Promise<typeof Purchases | null> {
  if (rcModule) return rcModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    rcModule = (mod?.default ?? mod) as typeof Purchases;
    return rcModule;
  } catch (error) {
    console.warn('[RevenueCat] Native module unavailable:', error);
    return null;
  }
}

function entitlementIsActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active.pro !== undefined;
}

/** Initializes exactly once for concurrent callers. Failed attempts are retryable. */
export async function initializeRevenueCat(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (rcReady) return true;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const Purchases = await loadPurchases();
    if (!Purchases) return false;

    const apiKey = Platform.OS === 'android' ? REVENUECAT_GOOGLE_API_KEY : REVENUECAT_APPLE_API_KEY;
    if (!apiKey) {
      console.warn('[RevenueCat] Public SDK key is missing.');
      return false;
    }

    try {
      try {
        Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);
      } catch {
        // Logging must never block subscriptions.
      }

      // Guard this check so a future older native binary remains safe.
      const isConfigured = (Purchases as any).isConfigured;
      const alreadyConfigured = typeof isConfigured === 'function'
        ? await isConfigured.call(Purchases)
        : false;
      if (!alreadyConfigured) Purchases.configure({ apiKey });
      rcReady = true;
      return true;
    } catch (error) {
      console.warn('[RevenueCat] Initialization failed:', error);
      return false;
    }
  })();

  try {
    return await initializationPromise;
  } finally {
    if (!rcReady) initializationPromise = null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfoResult> {
  if (!(await initializeRevenueCat()) || !rcModule) {
    return { status: 'unavailable', isPro: false, customerInfo: null, error: 'RevenueCat unavailable' };
  }
  try {
    const customerInfo = await rcModule.getCustomerInfo();
    const isPro = entitlementIsActive(customerInfo);
    return { status: isPro ? 'active' : 'inactive', isPro, customerInfo };
  } catch (error) {
    console.warn('[RevenueCat] Could not refresh customer information:', error);
    return {
      status: 'unavailable', isPro: false, customerInfo: null,
      error: error instanceof Error ? error.message : 'Unable to refresh subscription status',
    };
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!(await initializeRevenueCat()) || !rcModule) return null;
  try {
    return (await rcModule.getOfferings()).current ?? null;
  } catch (error) {
    console.warn('[RevenueCat] Could not load offerings:', error);
    return null;
  }
}

export function selectMonthlyPackage(offering: PurchasesOffering): PurchasesPackage | null {
  return offering.availablePackages.find(
    (pkg) => pkg.product.identifier === PREMIUM_MONTHLY_PRODUCT_ID,
  ) ?? null;
}

/** A purchase is successful only when the `pro` entitlement is active. */
export async function purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
  if (!(await initializeRevenueCat()) || !rcModule) {
    return { success: false, isPro: false, cancelled: false, error: 'Subscriptions are unavailable right now. Please try again.' };
  }
  try {
    const { customerInfo } = await rcModule.purchasePackage(packageToPurchase);
    if (!entitlementIsActive(customerInfo)) {
      return {
        success: false, isPro: false, cancelled: false,
        error: 'The purchase completed but Premium has not activated yet. Please restore purchases or try again shortly.',
      };
    }
    return { success: true, isPro: true, customerInfo };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, isPro: false, cancelled: true, error: 'Purchase cancelled' };
    }
    return { success: false, isPro: false, cancelled: false, error: error?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<RestoreResult> {
  if (!(await initializeRevenueCat()) || !rcModule) {
    return { success: false, isPro: false, error: 'Subscriptions are unavailable right now. Please try again.' };
  }
  try {
    const customerInfo = await rcModule.restorePurchases();
    return { success: true, isPro: entitlementIsActive(customerInfo), customerInfo };
  } catch (error) {
    return { success: false, isPro: false, error: error instanceof Error ? error.message : 'Failed to restore purchases' };
  }
}

/** Kept for existing callers. `false` can mean inactive or temporarily unavailable. */
export async function checkProStatus(): Promise<boolean> {
  return (await getCustomerInfo()).isPro;
}

export async function getManagementURL(): Promise<string | null> {
  if (Platform.OS === 'ios') return 'https://apps.apple.com/account/subscriptions';
  if (Platform.OS === 'android') return 'https://play.google.com/store/account/subscriptions';
  return null;
}
