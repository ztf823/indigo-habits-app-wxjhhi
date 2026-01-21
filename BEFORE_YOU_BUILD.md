
# ⚠️ CRITICAL: Read This Before Building

## 🚨 Required Actions Before First Build

### 1. Add Apple API Key to RevenueCat (REQUIRED for iOS)

**File**: `utils/revenueCat.ts`

**Current code**:
```typescript
const REVENUECAT_APPLE_API_KEY = 'appl_YOUR_APPLE_KEY_HERE';
```

**What you need to do**:
1. Go to https://app.revenuecat.com/
2. Log in to your account
3. Navigate to Project Settings → API Keys
4. Copy your Apple App Store API key (starts with `appl_`)
5. Replace `'appl_YOUR_APPLE_KEY_HERE'` with your actual key

**Example**:
```typescript
const REVENUECAT_APPLE_API_KEY = 'appl_AbCdEfGhIjKlMnOpQrStUvWxYz';
```

⚠️ **Without this, iOS in-app purchases will NOT work!**

---

### 2. Initialize EAS Project (REQUIRED)

**Run these commands**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS project
eas init
```

**What happens**:
- Creates an EAS project
- Generates a project ID
- You'll see output like: `Project ID: abc123-def456-ghi789`

**Update app.json**:
Replace this line:
```json
"projectId": "your-eas-project-id"
```

With your actual project ID:
```json
"projectId": "abc123-def456-ghi789"
```

Also update:
```json
"owner": "your-expo-username"
```

With your actual Expo username.

---

### 3. Configure RevenueCat Products (REQUIRED)

**In RevenueCat Dashboard** (https://app.revenuecat.com/):

1. **Create Product**:
   - Product ID: `premium_monthly`
   - Type: Subscription
   - Duration: 1 month

2. **Create Entitlement**:
   - Identifier: `pro`
   - Description: Premium features

3. **Link Product to Entitlement**:
   - Go to Products → premium_monthly
   - Add entitlement: `pro`

---

### 4. Create Store Products (REQUIRED)

**iOS - App Store Connect** (https://appstoreconnect.apple.com/):

1. Create your app in App Store Connect
2. Go to Features → In-App Purchases
3. Create Auto-Renewable Subscription:
   - Product ID: `premium_monthly` (must match exactly!)
   - Price: $4.40/month
   - Subscription Group: Create "Premium"

**Android - Google Play Console** (https://play.google.com/console/):

1. Create your app in Google Play Console
2. Go to Monetize → Subscriptions
3. Create subscription:
   - Product ID: `premium_monthly` (must match exactly!)
   - Price: $4.40/month
   - Billing period: 1 month

---

### 5. Host Privacy Policy (REQUIRED)

**You MUST have a publicly accessible privacy policy before submitting to stores.**

1. Review `PRIVACY_POLICY.md`
2. Customize with your information
3. Host on a website (e.g., https://indigohabits.com/privacy)
4. Update store listings with the URL

**No website?** Use these free options:
- GitHub Pages
- Netlify
- Vercel
- Google Sites

---

### 6. Prepare Assets (REQUIRED)

**App Icons**:
- iOS: 1024x1024 PNG (no transparency)
- Android: 512x512 PNG

**Screenshots** (minimum):
- iOS: 3 screenshots (6.5" and 5.5" sizes)
- Android: 2 screenshots (1080x1920)

**Current icon**: `assets/images/6d55fc54-d63d-4404-853f-c341ea5517d1.png`
- Verify this is 1024x1024 for iOS
- Create 512x512 version for Android if needed

---

## ✅ Quick Verification Checklist

Before running `npm run build:ios` or `npm run build:android:production`:

- [ ] Apple API key added to `utils/revenueCat.ts`
- [ ] EAS project initialized (`eas init`)
- [ ] Project ID updated in `app.json`
- [ ] Owner username updated in `app.json`
- [ ] Product `premium_monthly` created in RevenueCat
- [ ] Entitlement `pro` created in RevenueCat
- [ ] Product linked to entitlement in RevenueCat
- [ ] iOS subscription created in App Store Connect
- [ ] Android subscription created in Google Play Console
- [ ] Privacy policy hosted online
- [ ] App icons ready (1024x1024 and 512x512)
- [ ] Screenshots prepared

---

## 🚀 Ready to Build?

Once you've completed all the above:

```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android:production

# Or build both
npm run build:all
```

---

## ❌ Common Mistakes to Avoid

### 1. Product ID Mismatch
**Problem**: Product IDs don't match across platforms

**Solution**: Ensure `premium_monthly` is used EXACTLY (case-sensitive) in:
- RevenueCat dashboard
- App Store Connect
- Google Play Console
- Code (`utils/revenueCat.ts`)

### 2. Missing Apple API Key
**Problem**: Forgot to add Apple API key

**Result**: iOS purchases won't work

**Solution**: Add key to `utils/revenueCat.ts` BEFORE building

### 3. Wrong Bundle Identifier
**Problem**: Bundle identifier doesn't match

**Solution**: Use `com.indigohabits.app` everywhere:
- `app.json` (iOS: bundleIdentifier)
- `app.json` (Android: package)
- App Store Connect
- Google Play Console

### 4. No Privacy Policy
**Problem**: Submitted without privacy policy

**Result**: Instant rejection

**Solution**: Host privacy policy BEFORE submitting

### 5. Products Not Approved
**Problem**: Tried to test purchases before products are approved

**Solution**: 
- iOS: Products must be submitted with app
- Android: Products must be activated before testing

---

## 📞 Need Help?

**RevenueCat Issues**:
- Docs: https://docs.revenuecat.com/
- Support: https://www.revenuecat.com/support

**EAS Build Issues**:
- Docs: https://docs.expo.dev/build/introduction/
- Support: https://expo.dev/support

**Store Submission Issues**:
- iOS: https://developer.apple.com/contact/
- Android: https://support.google.com/googleplay/android-developer

---

## 🎯 Next Steps

1. Complete all items in the checklist above
2. Read `QUICK_START.md` for build commands
3. Read `BUILD_GUIDE.md` for detailed instructions
4. Read `REVENUECAT_SETUP.md` for RevenueCat details
5. Run your first build!

---

## ⏱️ Time Estimate

- **Configuration**: 1-2 hours
- **Asset preparation**: 2-4 hours
- **Build time**: 30-60 minutes (both platforms)
- **Testing**: 2-4 hours
- **Store listing**: 1-2 hours
- **Total**: 6-12 hours

---

**🎉 You've got this! Follow the checklist and you'll be live in the stores soon!**

For questions or issues, refer to the detailed guides:
- `QUICK_START.md` - Fast track guide
- `BUILD_GUIDE.md` - Comprehensive build guide
- `REVENUECAT_SETUP.md` - RevenueCat configuration
- `RELEASE_CHECKLIST.md` - Complete checklist
- `STORE_LISTING.md` - Store listing content
- `PRIVACY_POLICY.md` - Privacy policy template
