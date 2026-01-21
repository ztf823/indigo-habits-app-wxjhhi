
# RevenueCat Configuration Guide for Indigo Habits

## Overview

Indigo Habits uses RevenueCat for cross-platform subscription management. This guide will help you configure RevenueCat for both iOS and Android.

## Current Configuration

- **Google Play API Key**: `goog_eNogZNZZAtzunNmzzDNXxYafmpy` ✅ Already configured
- **Apple App Store API Key**: ⚠️ **NEEDS TO BE ADDED**
- **Product ID**: `premium_monthly`
- **Price**: $4.40/month
- **Entitlement**: `pro`

## Step-by-Step Setup

### 1. Get Your Apple API Key

1. Go to https://app.revenuecat.com/
2. Log in to your account
3. Select your project (or create a new one)
4. Navigate to **Project Settings** → **API Keys**
5. Find your **Apple App Store** API key
6. Copy the key (starts with `appl_`)

### 2. Add Apple API Key to Code

Open `utils/revenueCat.ts` and replace:

```typescript
const REVENUECAT_APPLE_API_KEY = 'appl_YOUR_APPLE_KEY_HERE';
```

With your actual key:

```typescript
const REVENUECAT_APPLE_API_KEY = 'appl_AbCdEfGhIjKlMnOpQrStUvWxYz';
```

### 3. Create Products in RevenueCat Dashboard

1. Go to https://app.revenuecat.com/
2. Navigate to **Products**
3. Click **+ New Product**
4. Configure:
   - **Product ID**: `premium_monthly`
   - **Type**: Subscription
   - **Duration**: 1 month
   - **Store Product IDs**:
     - iOS: `premium_monthly`
     - Android: `premium_monthly`

### 4. Create Entitlement

1. In RevenueCat dashboard, go to **Entitlements**
2. Click **+ New Entitlement**
3. Configure:
   - **Identifier**: `pro`
   - **Description**: Premium features access
4. Click **Save**

### 5. Link Product to Entitlement

1. Go to **Products** in RevenueCat
2. Select `premium_monthly`
3. Under **Entitlements**, add `pro`
4. Click **Save**

### 6. Configure iOS Product (App Store Connect)

1. Go to https://appstoreconnect.apple.com/
2. Select your app
3. Navigate to **Features** → **In-App Purchases**
4. Click **+** to create new subscription
5. Configure:
   - **Reference Name**: Premium Monthly Subscription
   - **Product ID**: `premium_monthly` (must match exactly!)
   - **Subscription Group**: Create new group "Premium"
   - **Subscription Duration**: 1 month
   - **Price**: $4.40 USD
6. Add localized descriptions:
   - **Display Name**: Premium Monthly
   - **Description**: Unlock all premium features including 10 daily habits, unlimited affirmations, and per-habit reminders.
7. Review Information:
   - Upload a screenshot showing premium features
   - Add review notes
8. Click **Save**

### 7. Configure Android Product (Google Play Console)

1. Go to https://play.google.com/console/
2. Select your app
3. Navigate to **Monetize** → **Subscriptions**
4. Click **Create subscription**
5. Configure:
   - **Product ID**: `premium_monthly` (must match exactly!)
   - **Name**: Premium Monthly
   - **Description**: Unlock all premium features including 10 daily habits, unlimited affirmations, and per-habit reminders.
   - **Billing period**: 1 month
   - **Price**: $4.40 USD
   - **Free trial**: Optional (e.g., 7 days)
   - **Grace period**: 3 days (recommended)
6. Click **Save**

### 8. Link Store Products in RevenueCat

1. Go back to RevenueCat dashboard
2. Navigate to **Products** → `premium_monthly`
3. Under **Store Configuration**:
   - **iOS Product ID**: `premium_monthly`
   - **Android Product ID**: `premium_monthly`
4. Click **Save**

### 9. Configure Offerings (Optional but Recommended)

1. In RevenueCat, go to **Offerings**
2. Create a new offering called `default`
3. Add package:
   - **Identifier**: `monthly`
   - **Product**: `premium_monthly`
   - **Type**: Monthly
4. Set as current offering

## Testing Configuration

### Test on iOS

1. **Create Sandbox Tester**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Create a test account

2. **Test Purchase**:
   - Sign out of Apple ID on test device
   - Run the app
   - Tap "Unlock Premium"
   - Sign in with sandbox tester account
   - Complete purchase (won't be charged)

3. **Verify in App**:
   - Check that premium features are unlocked
   - Check console logs for RevenueCat confirmation

### Test on Android

1. **Add License Tester**:
   - Google Play Console → Setup → License Testing
   - Add your test email

2. **Join Internal Testing**:
   - Upload a build to internal testing track
   - Join the testing program

3. **Test Purchase**:
   - Install app from Play Store
   - Tap "Unlock Premium"
   - Complete purchase (won't be charged for test accounts)

4. **Verify in App**:
   - Check that premium features are unlocked
   - Check console logs for RevenueCat confirmation

## Verification Checklist

- [ ] Apple API key added to `utils/revenueCat.ts`
- [ ] Google API key confirmed: `goog_eNogZNZZAtzunNmzzDNXxYafmpy`
- [ ] Product `premium_monthly` created in RevenueCat
- [ ] Entitlement `pro` created in RevenueCat
- [ ] Product linked to entitlement in RevenueCat
- [ ] iOS subscription created in App Store Connect with ID `premium_monthly`
- [ ] Android subscription created in Google Play Console with ID `premium_monthly`
- [ ] Store product IDs linked in RevenueCat
- [ ] Price set to $4.40/month on all platforms
- [ ] Tested purchase on iOS with sandbox account
- [ ] Tested purchase on Android with test account
- [ ] Premium features unlock correctly after purchase
- [ ] Restore purchases works correctly

## Troubleshooting

### "No offerings available"

**Problem**: App shows no subscription options

**Solution**:
1. Check that offerings are configured in RevenueCat
2. Verify products are linked to offerings
3. Ensure store products are approved (iOS) or active (Android)
4. Check console logs for RevenueCat errors

### "Purchase failed"

**Problem**: Purchase doesn't complete

**Solution**:
1. Verify product IDs match exactly across all platforms
2. Check that entitlements are properly linked
3. Ensure store products are approved/active
4. Test with sandbox/test accounts, not production accounts

### "Pro features not unlocking"

**Problem**: Purchase succeeds but features don't unlock

**Solution**:
1. Check that entitlement identifier is `pro` (lowercase)
2. Verify product is linked to `pro` entitlement in RevenueCat
3. Check `usePremium.ts` hook is checking for `pro` entitlement
4. Look for errors in console logs

### "Invalid product ID"

**Problem**: Store says product ID is invalid

**Solution**:
1. Ensure product ID is exactly `premium_monthly` (no spaces, correct case)
2. Wait 2-4 hours after creating product in store (propagation delay)
3. Verify product is in "Ready to Submit" or "Approved" state (iOS)
4. Verify product is "Active" (Android)

## Code Reference

### Checking Premium Status

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { isPro, loading } = usePremium();
  
  if (loading) return <ActivityIndicator />;
  
  return (
    <View>
      {isPro ? (
        <Text>Premium User</Text>
      ) : (
        <Text>Free User</Text>
      )}
    </View>
  );
}
```

### Initiating Purchase

```typescript
import { getOfferings, purchasePackage } from '@/utils/revenueCat';

async function handlePurchase() {
  const offering = await getOfferings();
  if (offering && offering.availablePackages.length > 0) {
    const pkg = offering.availablePackages[0];
    const result = await purchasePackage(pkg);
    
    if (result.success) {
      console.log('Purchase successful!');
      // Refresh premium status
    }
  }
}
```

### Restoring Purchases

```typescript
import { restorePurchases } from '@/utils/revenueCat';

async function handleRestore() {
  const result = await restorePurchases();
  
  if (result.success && result.isPro) {
    Alert.alert('Success', 'Purchases restored!');
  } else {
    Alert.alert('No Purchases', 'No previous purchases found.');
  }
}
```

## Important Notes

1. **Product IDs must match exactly** across:
   - RevenueCat dashboard
   - App Store Connect
   - Google Play Console
   - Code (`PREMIUM_MONTHLY_PRODUCT_ID`)

2. **Entitlement identifier** must be `pro` (lowercase) everywhere

3. **Price must be $4.40/month** on both platforms

4. **Test thoroughly** before releasing to production

5. **Store approval required**:
   - iOS: Products must be approved with app submission
   - Android: Products must be activated before testing

## Support Resources

- **RevenueCat Docs**: https://docs.revenuecat.com/
- **RevenueCat Dashboard**: https://app.revenuecat.com/
- **iOS Subscriptions Guide**: https://developer.apple.com/app-store/subscriptions/
- **Android Subscriptions Guide**: https://developer.android.com/google/play/billing/subscriptions

## Quick Reference

| Platform | API Key | Product ID | Price | Entitlement |
|----------|---------|------------|-------|-------------|
| iOS | `appl_...` (add yours) | `premium_monthly` | $4.40/mo | `pro` |
| Android | `goog_eNogZNZZAtzunNmzzDNXxYafmpy` ✅ | `premium_monthly` | $4.40/mo | `pro` |

---

**Next Steps:**
1. Add Apple API key to `utils/revenueCat.ts`
2. Create products in RevenueCat dashboard
3. Create subscriptions in App Store Connect and Google Play Console
4. Test purchases on both platforms
5. Build and submit apps

Good luck! 🚀
