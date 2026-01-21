
# Indigo Habits - App Store & Google Play Store Build Guide

This guide will walk you through building and submitting Indigo Habits to the App Store and Google Play Store.

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev
2. **Apple Developer Account**: Required for iOS ($99/year) - https://developer.apple.com
3. **Google Play Developer Account**: Required for Android ($25 one-time) - https://play.google.com/console
4. **EAS CLI**: Install with `npm install -g eas-cli`

## Initial Setup

### 1. Configure EAS Project

```bash
# Login to Expo
eas login

# Initialize EAS in your project
eas init

# This will create a project ID and update app.json
```

### 2. Update Configuration Files

#### Update `app.json`:
- Replace `"your-eas-project-id"` with your actual EAS project ID
- Replace `"your-expo-username"` with your Expo username

#### Update `eas.json`:
For iOS submission:
- Replace `"your-apple-id@example.com"` with your Apple ID
- Replace `"your-asc-app-id"` with your App Store Connect app ID
- Replace `"your-team-id"` with your Apple Developer Team ID

For Android submission:
- Create a service account in Google Play Console
- Download the JSON key file
- Save it as `google-play-service-account.json` in the project root

### 3. Configure RevenueCat

#### Get Your Apple API Key:
1. Go to https://app.revenuecat.com/
2. Navigate to your project settings
3. Copy your Apple API key
4. Open `utils/revenueCat.ts`
5. Replace `'appl_YOUR_APPLE_KEY_HERE'` with your actual Apple API key

#### Configure Products in RevenueCat:
1. Create a product with identifier: `premium_monthly`
2. Set the price to $4.40/month
3. Create an entitlement called `pro`
4. Link the `premium_monthly` product to the `pro` entitlement

#### Configure Products in App Store Connect:
1. Go to App Store Connect
2. Navigate to your app → Features → In-App Purchases
3. Create a new Auto-Renewable Subscription
4. Product ID: `premium_monthly`
5. Price: $4.40/month
6. Link this product in RevenueCat dashboard

#### Configure Products in Google Play Console:
1. Go to Google Play Console
2. Navigate to your app → Monetize → Subscriptions
3. Create a new subscription
4. Product ID: `premium_monthly`
5. Price: $4.40/month
6. Link this product in RevenueCat dashboard

## Building for iOS (App Store)

### 1. Build the IPA

```bash
# Build for iOS production
npm run build:ios

# Or use EAS CLI directly
eas build --platform ios --profile production
```

This will:
- Create a production build
- Auto-increment the build number
- Generate an IPA file ready for App Store submission

### 2. Download the IPA

Once the build completes:
1. Go to https://expo.dev/accounts/[your-username]/projects/indigo-habits/builds
2. Download the IPA file
3. Or use: `eas build:download --platform ios --latest`

### 3. Submit to App Store

#### Option A: Automatic Submission (Recommended)
```bash
npm run submit:ios
```

#### Option B: Manual Submission
1. Download the IPA from EAS
2. Open Transporter app (Mac only)
3. Drag and drop the IPA file
4. Upload to App Store Connect

### 4. Complete App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Fill in required information:
   - App name: Indigo Habits
   - Subtitle: Build Better Habits Daily
   - Description: (See STORE_LISTING.md)
   - Keywords: habits, journal, affirmations, mindfulness, productivity
   - Category: Health & Fitness
   - Screenshots: Prepare 6.5" and 5.5" iPhone screenshots
   - App icon: Use the icon from assets/images/
   - Privacy Policy URL: https://your-website.com/privacy
   - Support URL: https://your-website.com/support

4. Configure In-App Purchases:
   - Add the `premium_monthly` subscription
   - Set up subscription groups
   - Configure pricing ($4.40/month)

5. Submit for Review

## Building for Android (Google Play Store)

### 1. Build the AAB

```bash
# Build for Android production
npm run build:android:production

# Or use EAS CLI directly
eas build --platform android --profile production
```

This will:
- Create a production build
- Generate an AAB (Android App Bundle) file
- Sign the app with your credentials

### 2. Download the AAB

Once the build completes:
1. Go to https://expo.dev/accounts/[your-username]/projects/indigo-habits/builds
2. Download the AAB file
3. Or use: `eas build:download --platform android --latest`

### 3. Submit to Google Play

#### Option A: Automatic Submission (Recommended)
```bash
npm run submit:android
```

#### Option B: Manual Submission
1. Go to https://play.google.com/console
2. Select your app (or create a new app)
3. Navigate to Production → Create new release
4. Upload the AAB file
5. Fill in release notes
6. Submit for review

### 4. Complete Google Play Console Setup

1. Store Listing:
   - App name: Indigo Habits
   - Short description: Build better habits with daily affirmations and mindful journaling
   - Full description: (See STORE_LISTING.md)
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: At least 2 phone screenshots
   - Category: Health & Fitness

2. Content Rating:
   - Complete the questionnaire
   - Should receive an "Everyone" rating

3. Pricing & Distribution:
   - Set price to Free
   - Configure in-app products ($4.40/month subscription)
   - Select countries for distribution

4. App Content:
   - Privacy policy: https://your-website.com/privacy
   - Ads: No (unless you add ads)
   - Target audience: 13+

5. Submit for Review

## RevenueCat Configuration Checklist

- [ ] Apple API key added to `utils/revenueCat.ts`
- [ ] Google API key already configured: `goog_eNogZNZZAtzunNmzzDNXxYafmpy`
- [ ] Product `premium_monthly` created in RevenueCat
- [ ] Entitlement `pro` created in RevenueCat
- [ ] Product linked to entitlement in RevenueCat
- [ ] iOS subscription created in App Store Connect
- [ ] Android subscription created in Google Play Console
- [ ] Product IDs match across all platforms: `premium_monthly`
- [ ] Price set to $4.40/month on all platforms

## Testing In-App Purchases

### iOS Testing:
1. Create a Sandbox Tester account in App Store Connect
2. Sign out of your Apple ID on your test device
3. Run the app and attempt a purchase
4. Sign in with the Sandbox Tester account when prompted

### Android Testing:
1. Add test accounts in Google Play Console
2. Join the internal testing track
3. Install the app from the Play Store
4. Test purchases (they won't be charged)

## Build Troubleshooting

### iOS Build Issues:

**Missing credentials:**
```bash
eas credentials
```
Follow prompts to configure signing certificates.

**Build fails:**
- Check that bundle identifier matches: `com.indigohabits.app`
- Verify Apple Developer account is active
- Ensure all required capabilities are enabled

### Android Build Issues:

**Signing errors:**
```bash
eas credentials
```
Configure Android keystore.

**Build fails:**
- Check that package name matches: `com.indigohabits.app`
- Verify Google Play Developer account is active

## Post-Submission

### App Store Review (iOS):
- Typically takes 1-3 days
- Be prepared to respond to review feedback
- Common issues: privacy policy, in-app purchase descriptions

### Google Play Review (Android):
- Typically takes 1-3 days
- Usually faster than iOS
- May require additional information about permissions

## Updating the App

### Version Updates:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1"
   ```

2. iOS: Build number auto-increments
3. Android: Increment `versionCode` manually

4. Build and submit:
   ```bash
   npm run build:all
   npm run submit:ios
   npm run submit:android
   ```

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **RevenueCat Docs**: https://docs.revenuecat.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

## Important Notes

1. **Privacy Policy**: You MUST host a privacy policy before submitting. See PRIVACY_POLICY.md for a template.

2. **App Icons**: Ensure your app icon meets requirements:
   - iOS: 1024x1024 PNG (no transparency)
   - Android: 512x512 PNG

3. **Screenshots**: Prepare high-quality screenshots showing:
   - Home screen with affirmations
   - Habit tracking
   - Journal entries
   - Progress/streaks
   - Premium features

4. **Testing**: Thoroughly test on both iOS and Android before submitting.

5. **RevenueCat**: Ensure all products are properly configured and linked before release.

## Quick Reference Commands

```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android:production

# Build both platforms
npm run build:all

# Submit iOS
npm run submit:ios

# Submit Android
npm run submit:android

# Check build status
eas build:list

# Download latest build
eas build:download --platform ios --latest
eas build:download --platform android --latest
```

## Next Steps

1. ✅ Configure EAS project (`eas init`)
2. ✅ Add Apple API key to RevenueCat
3. ✅ Configure products in RevenueCat dashboard
4. ✅ Create products in App Store Connect
5. ✅ Create products in Google Play Console
6. ✅ Build iOS: `npm run build:ios`
7. ✅ Build Android: `npm run build:android:production`
8. ✅ Submit to App Store
9. ✅ Submit to Google Play Store
10. ✅ Test in-app purchases on both platforms

Good luck with your launch! 🚀
