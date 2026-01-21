
# Indigo Habits - Quick Start Build Guide

## 🚀 Fast Track to App Store & Google Play

### Prerequisites (5 minutes)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Step 1: Initialize EAS (2 minutes)
```bash
# Initialize EAS project
eas init

# This creates a project ID - copy it!
```

### Step 2: Update Configuration (3 minutes)

1. **app.json** - Update these fields:
   - `extra.eas.projectId` → Your EAS project ID
   - `owner` → Your Expo username

2. **utils/revenueCat.ts** - Add your Apple API key:
   - Replace `'appl_YOUR_APPLE_KEY_HERE'` with your actual key
   - Get it from: https://app.revenuecat.com/

3. **eas.json** - Update for submission (optional for first build):
   - iOS: Apple ID, ASC App ID, Team ID
   - Android: Service account JSON path

### Step 3: Build iOS (15-30 minutes)
```bash
# Start iOS build
npm run build:ios

# Or manually:
eas build --platform ios --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Creates an IPA file
- Auto-increments build number
- Takes 15-30 minutes

**Download IPA:**
```bash
eas build:download --platform ios --latest
```

### Step 4: Build Android (15-30 minutes)
```bash
# Start Android build
npm run build:android:production

# Or manually:
eas build --platform android --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Creates an AAB file
- Signs with your keystore
- Takes 15-30 minutes

**Download AAB:**
```bash
eas build:download --platform android --latest
```

### Step 5: Submit to Stores

#### iOS (App Store Connect)
```bash
# Automatic submission
npm run submit:ios

# Or manual: Upload IPA via Transporter app
```

#### Android (Google Play Console)
```bash
# Automatic submission
npm run submit:android

# Or manual: Upload AAB in Play Console
```

## ⚡ One-Command Build (Both Platforms)
```bash
# Build iOS and Android simultaneously
npm run build:all
```

## 🔧 RevenueCat Setup (IMPORTANT!)

### 1. Get API Keys
- Google: Already configured ✅ `goog_eNogZNZZAtzunNmzzDNXxYafmpy`
- Apple: Add to `utils/revenueCat.ts` ⚠️

### 2. Create Product in RevenueCat
1. Go to https://app.revenuecat.com/
2. Create product: `premium_monthly`
3. Create entitlement: `pro`
4. Link product to entitlement
5. Set price: $4.40/month

### 3. Create Products in Stores

**App Store Connect:**
1. In-App Purchases → Create Subscription
2. Product ID: `premium_monthly`
3. Price: $4.40/month
4. Link in RevenueCat

**Google Play Console:**
1. Monetize → Subscriptions → Create
2. Product ID: `premium_monthly`
3. Price: $4.40/month
4. Link in RevenueCat

## 📋 Pre-Submission Checklist

- [ ] EAS project initialized
- [ ] Apple API key added to RevenueCat
- [ ] Products configured in RevenueCat
- [ ] iOS subscription created in App Store Connect
- [ ] Android subscription created in Google Play Console
- [ ] Privacy policy hosted online
- [ ] App icons ready (1024x1024 iOS, 512x512 Android)
- [ ] Screenshots prepared (at least 3 for iOS, 2 for Android)
- [ ] Tested on real devices

## 🐛 Common Issues

### "Missing credentials"
```bash
eas credentials
```
Follow prompts to configure signing.

### "Build failed"
- Check bundle identifier: `com.indigohabits.app`
- Check package name: `com.indigohabits.app`
- Verify developer accounts are active

### "RevenueCat not working"
- Ensure Apple API key is added
- Verify products are created in both stores
- Check product IDs match exactly: `premium_monthly`

## 📱 Testing Purchases

### iOS Sandbox Testing
1. App Store Connect → Users and Access → Sandbox Testers
2. Create test account
3. Sign out of Apple ID on device
4. Test purchase (sign in with sandbox account)

### Android Testing
1. Google Play Console → Setup → License Testing
2. Add test email
3. Join internal testing track
4. Test purchase (won't be charged)

## 🎯 Next Steps After Build

1. **Download builds** from EAS dashboard
2. **Test on real devices** before submitting
3. **Complete store listings** (descriptions, screenshots)
4. **Submit for review**
5. **Monitor review status**

## 📞 Support

- **EAS Builds**: https://expo.dev/accounts/[username]/projects/indigo-habits/builds
- **RevenueCat**: https://app.revenuecat.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Google Play Console**: https://play.google.com/console/

## ⏱️ Timeline

- **EAS Setup**: 10 minutes
- **iOS Build**: 15-30 minutes
- **Android Build**: 15-30 minutes
- **Store Submission**: 30 minutes
- **Review Process**: 1-3 days (both stores)

**Total Time to Launch**: ~2-4 days

---

## 🚨 CRITICAL: Before First Build

1. ✅ Add Apple API key to `utils/revenueCat.ts`
2. ✅ Run `eas init` to get project ID
3. ✅ Update `app.json` with project ID
4. ✅ Host privacy policy online
5. ✅ Create products in RevenueCat dashboard

## 🎉 Ready to Build!

```bash
# Build everything
npm run build:all

# Check status
eas build:list

# Download when ready
eas build:download --platform ios --latest
eas build:download --platform android --latest
```

Good luck with your launch! 🚀
