
# Indigo Habits - Release Checklist

Use this checklist to ensure everything is ready for App Store and Google Play Store submission.

## Pre-Build Configuration

### EAS Setup
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Initialize project: `eas init`
- [ ] Copy EAS project ID from output

### Update Configuration Files
- [ ] Update `app.json`:
  - [ ] Set `extra.eas.projectId` to your EAS project ID
  - [ ] Set `owner` to your Expo username
  - [ ] Verify `bundleIdentifier` (iOS): `com.indigohabits.app`
  - [ ] Verify `package` (Android): `com.indigohabits.app`
  - [ ] Verify `version`: `1.0.0`
  - [ ] Verify `buildNumber` (iOS): `1`
  - [ ] Verify `versionCode` (Android): `1`

- [ ] Update `eas.json`:
  - [ ] Add Apple ID (for iOS submission)
  - [ ] Add ASC App ID (for iOS submission)
  - [ ] Add Apple Team ID (for iOS submission)
  - [ ] Add service account JSON path (for Android submission)

### RevenueCat Configuration
- [ ] Get Apple API key from RevenueCat dashboard
- [ ] Add Apple API key to `utils/revenueCat.ts`
- [ ] Verify Google API key: `goog_eNogZNZZAtzunNmzzDNXxYafmpy`
- [ ] Create product in RevenueCat: `premium_monthly`
- [ ] Create entitlement in RevenueCat: `pro`
- [ ] Link product to entitlement
- [ ] Set price to $4.40/month

### App Store Connect (iOS)
- [ ] Create app in App Store Connect
- [ ] Set bundle identifier: `com.indigohabits.app`
- [ ] Create subscription product:
  - [ ] Product ID: `premium_monthly`
  - [ ] Price: $4.40/month
  - [ ] Subscription group: Premium
- [ ] Add product description and screenshot
- [ ] Link product in RevenueCat dashboard

### Google Play Console (Android)
- [ ] Create app in Google Play Console
- [ ] Set package name: `com.indigohabits.app`
- [ ] Create subscription product:
  - [ ] Product ID: `premium_monthly`
  - [ ] Price: $4.40/month
  - [ ] Billing period: 1 month
- [ ] Add product description
- [ ] Link product in RevenueCat dashboard

## Assets Preparation

### App Icons
- [ ] iOS icon: 1024x1024 PNG (no transparency, no rounded corners)
- [ ] Android icon: 512x512 PNG
- [ ] Android adaptive icon: foreground + background
- [ ] Verify icon looks good on both light and dark backgrounds

### Screenshots
- [ ] iOS screenshots (6.5" and 5.5" required):
  - [ ] Home screen with affirmations
  - [ ] Habit tracking
  - [ ] Journal entry
  - [ ] Progress/streaks
  - [ ] Premium features
  - [ ] Dark mode
- [ ] Android screenshots (minimum 2):
  - [ ] Home screen
  - [ ] Habit tracking
  - [ ] Journal entry
  - [ ] Progress view

### Marketing Assets
- [ ] Feature graphic (Android): 1024x500 PNG
- [ ] App preview video (optional): 30 seconds
- [ ] Promotional images for social media

## Legal & Compliance

### Privacy Policy
- [ ] Review `PRIVACY_POLICY.md` template
- [ ] Customize with your information
- [ ] Host on public website
- [ ] Get URL for store listings
- [ ] Add URL to `app.json`

### Terms of Service (Optional)
- [ ] Create terms of service
- [ ] Host on public website
- [ ] Add link in app settings

### Support
- [ ] Create support email: support@indigohabits.com
- [ ] Create support page on website
- [ ] Add support URL to store listings

## Building

### iOS Build
- [ ] Run: `npm run build:ios`
- [ ] Wait for build to complete (15-30 minutes)
- [ ] Download IPA: `eas build:download --platform ios --latest`
- [ ] Test IPA on real device (TestFlight or direct install)
- [ ] Verify all features work
- [ ] Test in-app purchase with sandbox account

### Android Build
- [ ] Run: `npm run build:android:production`
- [ ] Wait for build to complete (15-30 minutes)
- [ ] Download AAB: `eas build:download --platform android --latest`
- [ ] Test AAB on real device (internal testing track)
- [ ] Verify all features work
- [ ] Test in-app purchase with test account

## Testing

### Functional Testing
- [ ] App launches successfully
- [ ] Onboarding flow works
- [ ] Can create journal entries
- [ ] Can add photos to journal
- [ ] Can record audio notes
- [ ] Affirmations display correctly
- [ ] Can generate new affirmations
- [ ] Can create custom affirmations
- [ ] Habit tracking works
- [ ] Can mark habits complete/incomplete
- [ ] Streaks calculate correctly
- [ ] Progress calendar displays correctly
- [ ] Badges unlock correctly
- [ ] Notifications work (if enabled)
- [ ] Dark mode works
- [ ] Settings work
- [ ] Export to PDF works (premium)

### Purchase Testing
- [ ] Can view premium features
- [ ] Purchase flow works (sandbox/test)
- [ ] Premium features unlock after purchase
- [ ] Restore purchases works
- [ ] Subscription status persists after app restart
- [ ] Free tier limits work correctly (3 habits)
- [ ] Premium tier limits work correctly (10 habits)

### Platform-Specific Testing
- [ ] iOS: Test on iPhone (multiple sizes)
- [ ] iOS: Test on iPad
- [ ] iOS: Test on iOS 15, 16, 17
- [ ] Android: Test on phone (multiple sizes)
- [ ] Android: Test on tablet
- [ ] Android: Test on Android 11, 12, 13, 14

## Store Listings

### iOS (App Store Connect)
- [ ] App name: Indigo Habits
- [ ] Subtitle: Build better habits with daily affirmations
- [ ] Description: (See STORE_LISTING.md)
- [ ] Keywords: habits, journal, affirmations, mindfulness, productivity
- [ ] Category: Health & Fitness
- [ ] Age rating: 4+
- [ ] Screenshots uploaded (all required sizes)
- [ ] App icon uploaded
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Marketing URL added (optional)
- [ ] What's New text added
- [ ] App review information completed
- [ ] Contact information added

### Android (Google Play Console)
- [ ] App name: Indigo Habits
- [ ] Short description: Build better habits daily
- [ ] Full description: (See STORE_LISTING.md)
- [ ] Category: Health & Fitness
- [ ] Tags: habits, journal, productivity
- [ ] Screenshots uploaded (minimum 2)
- [ ] Feature graphic uploaded
- [ ] App icon uploaded
- [ ] Privacy policy URL added
- [ ] Support email added
- [ ] Website URL added (optional)
- [ ] Content rating completed
- [ ] Target audience: 13+
- [ ] Pricing: Free (with in-app purchases)
- [ ] Countries: All (or select specific)

## Submission

### iOS Submission
- [ ] Upload build via EAS: `npm run submit:ios`
- [ ] Or upload IPA via Transporter app
- [ ] Select build in App Store Connect
- [ ] Complete all required information
- [ ] Add app review notes (if needed)
- [ ] Submit for review
- [ ] Monitor review status

### Android Submission
- [ ] Upload AAB via EAS: `npm run submit:android`
- [ ] Or upload AAB in Play Console
- [ ] Complete all required information
- [ ] Add release notes
- [ ] Choose release track (internal → production)
- [ ] Submit for review
- [ ] Monitor review status

## Post-Submission

### Monitoring
- [ ] Check App Store Connect for review status
- [ ] Check Google Play Console for review status
- [ ] Respond to any review feedback promptly
- [ ] Monitor crash reports
- [ ] Monitor user reviews

### Marketing
- [ ] Announce launch on social media
- [ ] Submit to Product Hunt
- [ ] Share in relevant communities (Reddit, forums)
- [ ] Reach out to app review sites
- [ ] Create press kit
- [ ] Send to tech journalists

### Analytics (Optional)
- [ ] Set up analytics (if not already done)
- [ ] Monitor user acquisition
- [ ] Track conversion rates
- [ ] Monitor subscription metrics
- [ ] Track retention rates

## Common Issues & Solutions

### Build Fails
- **Issue**: iOS build fails with signing error
- **Solution**: Run `eas credentials` and configure signing

- **Issue**: Android build fails with keystore error
- **Solution**: Run `eas credentials` and configure keystore

### Submission Rejected
- **Issue**: Missing privacy policy
- **Solution**: Host privacy policy and add URL to listing

- **Issue**: In-app purchase not configured
- **Solution**: Ensure products are created and approved in stores

- **Issue**: Screenshots don't meet requirements
- **Solution**: Use exact required dimensions, no text overlays

### Purchase Not Working
- **Issue**: "No offerings available"
- **Solution**: Check RevenueCat configuration, ensure products are linked

- **Issue**: Purchase fails
- **Solution**: Verify product IDs match exactly across all platforms

## Timeline

| Task | Estimated Time |
|------|----------------|
| EAS setup | 10 minutes |
| Configuration updates | 15 minutes |
| RevenueCat setup | 30 minutes |
| Store product creation | 30 minutes |
| Asset preparation | 2-4 hours |
| iOS build | 15-30 minutes |
| Android build | 15-30 minutes |
| Testing | 2-4 hours |
| Store listing creation | 1-2 hours |
| Submission | 30 minutes |
| **Total prep time** | **8-12 hours** |
| Review process (iOS) | 1-3 days |
| Review process (Android) | 1-3 days |
| **Total time to launch** | **2-4 days** |

## Final Checks Before Submission

- [ ] All features tested and working
- [ ] In-app purchases tested on both platforms
- [ ] Privacy policy hosted and accessible
- [ ] All store listing information complete
- [ ] Screenshots look professional
- [ ] App icon looks good
- [ ] Version numbers correct
- [ ] Build numbers correct
- [ ] No test/debug code in production build
- [ ] All console.logs reviewed (remove sensitive data)
- [ ] Terms of service reviewed (if applicable)
- [ ] Support channels ready (email, website)

## Emergency Contacts

- **Expo Support**: https://expo.dev/support
- **RevenueCat Support**: https://www.revenuecat.com/support
- **Apple Developer Support**: https://developer.apple.com/contact/
- **Google Play Support**: https://support.google.com/googleplay/android-developer

---

## Quick Command Reference

```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android:production

# Build both
npm run build:all

# Submit iOS
npm run submit:ios

# Submit Android
npm run submit:android

# Check build status
eas build:list

# Download builds
eas build:download --platform ios --latest
eas build:download --platform android --latest

# View credentials
eas credentials

# View project info
eas project:info
```

---

**🎉 You're ready to launch Indigo Habits!**

Follow this checklist step by step, and you'll have your app in the stores in no time. Good luck! 🚀
