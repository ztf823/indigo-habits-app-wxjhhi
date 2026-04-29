
// NOTE: react-native-purchases is imported LAZILY (inside try/catch) so a native
// module failure cannot crash the app on launch (which caused App Store rejection).
import type Purchases from 'react-native-purchases';
import type { PurchasesOffering } from 'react-native-purchases';
import { Platform, InteractionManager } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_GOOGLE_API_KEY = 'goog_eNogZNZZAtzunNmzzDNXxYafmpy';
const REVENUECAT_APPLE_API_KEY = 'appl_KVaWqlpxQpKqoMgILPRLHowDNxe';

// Product identifiers
export const PREMIUM_MONTHLY_PRODUCT_ID = 'premium_monthly'; // $4.99/month

// Module-level guard: track whether RevenueCat ever initialized successfully.
let rcReady = false;
let rcModule: typeof Purchases | null = null;

async function loadPurchases(): Promise<typeof Purchases | null> {
  if (rcModule) return rcModule;
  try {
    // Lazy require so a missing/broken native module cannot crash launch.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    rcModule = (mod?.default ?? mod) as typeof Purchases;
    return rcModule;
  } catch (err) {
    console.warn('[RevenueCat] Failed to load native module:', err);
    return null;
  }
}

// Wrap a promise in a timeout so a hanging native call cannot block app start.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Initialize RevenueCat SDK.
 * Call this once when the app starts. Hardened against any failure mode:
 * lazy import, try/catch, timeout. Never throws.
 */
export async function initializeRevenueCat(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Web platform detected - skipping');
      return;
    }

    const Purchases = await loadPurchases();
    if (!Purchases) {
      console.warn('[RevenueCat] Module unavailable, app will run without RevenueCat');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const LOG_LEVEL = (require('react-native-purchases') as any).LOG_LEVEL;
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    } catch {}

    const apiKey = Platform.OS === 'android' ? REVENUECAT_GOOGLE_API_KEY : REVENUECAT_APPLE_API_KEY;

    // Wait for interactions to complete so the JS thread is idle
    // before handing off to the native StoreKit layer.
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    await withTimeout(
      new Promise<void>((resolve, reject) => {
        // setTimeout(0) yields to the main run loop, ensuring configure()
        // is called from the main thread context on iOS 26+.
        setTimeout(() => {
          try {
            Purchases.configure({ apiKey });
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 0);
      }),
      5000,
      '[RevenueCat] configure',
    );
    rcReady = true;
    console.log('[RevenueCat] SDK initialized successfully');
  } catch (error) {
    // Swallow ALL errors. Launch must never fail because of RevenueCat.
    console.warn('[RevenueCat] init skipped due to error:', error);
  }
}

/**
 * Get current customer info including subscription status
 */
export async function getCustomerInfo() {
  try {
    if (!rcReady || !rcModule) return { isPro: false, customerInfo: null };
    console.log('[RevenueCat] Fetching customer info...');
    const customerInfo = await rcModule.getCustomerInfo();
    
    // Check for 'pro' entitlement
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    console.log('[RevenueCat] Customer info retrieved. Pro status:', isPro);
    
    return {
      isPro,
      customerInfo,
    };
  } catch (error) {
    console.error('[RevenueCat] Error fetching customer info:', error);
    return {
      isPro: false,
      customerInfo: null,
    };
  }
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    if (!rcReady || !rcModule) return null;
    console.log('[RevenueCat] Fetching available offerings...');
    const offerings = await rcModule.getOfferings();
    
    if (offerings.current !== null) {
      console.log('[RevenueCat] Current offering:', offerings.current.identifier);
      console.log('[RevenueCat] Available packages:', offerings.current.availablePackages.length);
      
      // Log package details for debugging
      offerings.current.availablePackages.forEach((pkg) => {
        console.log(`[RevenueCat] Package: ${pkg.identifier}`);
        console.log(`[RevenueCat] - Product: ${pkg.product.identifier}`);
        console.log(`[RevenueCat] - Price: ${pkg.product.priceString}`);
        console.log(`[RevenueCat] - Period: ${pkg.product.subscriptionPeriod}`);
      });
      
      return offerings.current;
    } else {
      console.warn('[RevenueCat] No current offering available');
      console.warn('[RevenueCat] Make sure you have configured offerings in RevenueCat dashboard');
      return null;
    }
  } catch (error) {
    console.error('[RevenueCat] Error fetching offerings:', error);
    return null;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(packageToPurchase: any) {
  try {
    console.log('[RevenueCat] Initiating purchase for package:', packageToPurchase.identifier);
    console.log('[RevenueCat] Product ID:', packageToPurchase.product.identifier);
    console.log('[RevenueCat] Price:', packageToPurchase.product.priceString);
    
    if (!rcReady || !rcModule) {
      return { success: false, cancelled: false, error: 'RevenueCat unavailable' };
    }
    const { customerInfo } = await rcModule.purchasePackage(packageToPurchase);
    
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    console.log('[RevenueCat] Purchase completed successfully! Pro status:', isPro);
    
    return {
      success: true,
      isPro,
      customerInfo,
    };
  } catch (error: any) {
    console.error('[RevenueCat] Purchase error:', error);
    
    // Check if user cancelled
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled the purchase');
      return {
        success: false,
        cancelled: true,
        error: 'Purchase cancelled',
      };
    }
    
    return {
      success: false,
      cancelled: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases() {
  try {
    console.log('[RevenueCat] Restoring purchases...');
    
    if (!rcReady || !rcModule) {
      return { success: false, isPro: false, error: 'RevenueCat unavailable' };
    }
    const customerInfo = await rcModule.restorePurchases();
    
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    console.log('[RevenueCat] Purchases restored. Pro status:', isPro);
    
    return {
      success: true,
      isPro,
      customerInfo,
    };
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    return {
      success: false,
      isPro: false,
      error: error instanceof Error ? error.message : 'Failed to restore purchases',
    };
  }
}

/**
 * Check if user has active pro subscription
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const { isPro } = await getCustomerInfo();
    return isPro;
  } catch (error) {
    console.error('[RevenueCat] Error checking pro status:', error);
    return false;
  }
}

/**
 * Get subscription management URL
 */
export async function getManagementURL(): Promise<string | null> {
  try {
    console.log('[RevenueCat] Getting management URL...');
    
    if (Platform.OS === 'ios') {
      return 'https://apps.apple.com/account/subscriptions';
    } else if (Platform.OS === 'android') {
      return 'https://play.google.com/store/account/subscriptions';
    }
    
    return null;
  } catch (error) {
    console.error('[RevenueCat] Error getting management URL:', error);
    return null;
  }
}
