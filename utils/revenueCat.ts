
import Purchases, { LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_GOOGLE_API_KEY = 'goog_eNogZNZZAtzunNmzzDNXxYafmpy';
const REVENUECAT_APPLE_API_KEY = ''; // Add your Apple API key here when available

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export async function initializeRevenueCat() {
  try {
    console.log('[RevenueCat] Initializing SDK...');
    
    // Configure SDK
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    
    // Initialize with platform-specific API key
    if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
      console.log('[RevenueCat] Configured for Android with Google Play');
    } else if (Platform.OS === 'ios') {
      if (REVENUECAT_APPLE_API_KEY) {
        await Purchases.configure({ apiKey: REVENUECAT_APPLE_API_KEY });
        console.log('[RevenueCat] Configured for iOS with App Store');
      } else {
        console.warn('[RevenueCat] Apple API key not configured. Add it to utils/revenueCat.ts');
      }
    } else {
      console.log('[RevenueCat] Web platform detected - RevenueCat not available');
      return;
    }
    
    console.log('[RevenueCat] SDK initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Failed to initialize:', error);
  }
}

/**
 * Get current customer info including subscription status
 */
export async function getCustomerInfo() {
  try {
    console.log('[RevenueCat] Fetching customer info...');
    const customerInfo = await Purchases.getCustomerInfo();
    
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
    console.log('[RevenueCat] Fetching available offerings...');
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null) {
      console.log('[RevenueCat] Current offering:', offerings.current.identifier);
      console.log('[RevenueCat] Available packages:', offerings.current.availablePackages.length);
      return offerings.current;
    } else {
      console.warn('[RevenueCat] No current offering available');
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
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    console.log('[RevenueCat] Purchase completed. Pro status:', isPro);
    
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
    
    const customerInfo = await Purchases.restorePurchases();
    
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
    const url = await Purchases.getCustomerInfo();
    
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
