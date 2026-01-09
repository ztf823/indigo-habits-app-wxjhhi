
# Indigo Habits - Complete Build & Deployment Guide

## 📋 Overview

This guide will walk you through building and deploying Indigo Habits to the iOS App Store and Google Play Store.

## 🎯 Prerequisites

### Required Accounts
- [ ] **Expo Account** (free) - https://expo.dev/signup
- [ ] **Apple Developer Account** ($99/year) - https://developer.apple.com
- [ ] **Google Play Console** ($25 one-time) - https://play.google.com/console

### Required Tools
```bash
# Install Node.js (v18 or later)
# Download from: https://nodejs.org/

# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

## 🔐 Step 1: Set Up EAS Project

### 1.1 Login to Expo
```bash
eas login
```

### 1.2 Initialize EAS in Your Project
```bash
cd /path/to/indigo-habits
eas build:configure
```

This will:
- Create an EAS project
- Generate a unique project ID
- Update `app.json` with the project ID

### 1.3 Update app.json
After running `eas build:configure`, your `app.json` should have a project ID:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "abc123-your-actual-project-id"
      }
    }
  }
}
```

## 🔧 Step 2: Configure Backend (IMPORTANT!)

### 2.1 Backend Requirements
The app requires a backend API with:
- SQLite database
- BetterAuth authentication
- OpenAI GPT-5.2 integration
- All API endpoints listed in `BACKEND_INTEGRATION_GUIDE.md`

### 2.2 Deploy Backend
Deploy your backend to a hosting service:
- **Recommended**: Railway, Render, Fly.io, or AWS
- Ensure it's accessible via HTTPS
- Note the backend URL (e.g., `https://your-backend.railway.app`)

### 2.3 Update app.json with Backend URL
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://your-backend.railway.app",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**⚠️ CRITICAL**: You MUST rebuild the app after changing the backend URL!

## 📱 Step 3: Build for iOS

### 3.1 Development Build (for testing)
```bash
eas build --platform ios --profile development
```

This creates a development build you can install on your device for testing.

### 3.2 Production Build (for App Store)
```bash
eas build --platform ios --profile production
```

This creates a production build ready for the App Store.

**Build time**: 10-20 minutes

### 3.3 Download and Test
After the build completes:
1. Download the `.ipa` file from the EAS dashboard
2. Install on a test device using TestFlight or Xcode
3. Test all features thoroughly

## 🤖 Step 4: Build for Android

### 4.1 Development Build (APK for testing)
```bash
eas build --platform android --profile development
```

This creates an APK you can install directly on Android devices.

### 4.2 Production Build (AAB for Play Store)
```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (AAB) for the Play Store.

**Build time**: 10-20 minutes

### 4.3 Download and Test
After the build completes:
1. Download the `.apk` (development) or `.aab` (production)
2. Install APK on test devices
3. Test all features thoroughly

## 🚀 Step 5: Submit to App Store (iOS)

### 5.1 Prepare App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Platform**: iOS
   - **Name**: Indigo Habits
   - **Primary Language**: English
   - **Bundle ID**: com.indigohabits.app
   - **SKU**: indigo-habits-001

### 5.2 Update eas.json
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

**How to find these values:**
- **appleId**: Your Apple ID email
- **ascAppId**: In App Store Connect → App Information → Apple ID
- **appleTeamId**: In Apple Developer → Membership → Team ID

### 5.3 Submit to App Store
```bash
eas submit --platform ios
```

This will:
1. Upload your build to App Store Connect
2. Create a new version
3. Attach the build to the version

### 5.4 Complete App Store Listing
In App Store Connect, add:
- [ ] App icon (1024x1024px)
- [ ] Screenshots (all device sizes)
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating
- [ ] App category

### 5.5 Submit for Review
1. Click "Submit for Review"
2. Answer review questions
3. Submit

**Review time**: 1-3 days typically

## 🎮 Step 6: Submit to Play Store (Android)

### 6.1 Prepare Google Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app information:
   - **App name**: Indigo Habits
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### 6.2 Create Service Account
1. In Play Console → Setup → API access
2. Click "Create new service account"
3. Follow the link to Google Cloud Console
4. Create service account with "Service Account User" role
5. Create and download JSON key
6. Save as `google-play-service-account.json` in project root

### 6.3 Update eas.json
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Track options:**
- `internal` - Internal testing (recommended first)
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Production release

### 6.4 Submit to Play Store
```bash
eas submit --platform android
```

This will:
1. Upload your AAB to Play Console
2. Create a new release in the specified track

### 6.5 Complete Play Store Listing
In Play Console, add:
- [ ] App icon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots (phone and tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] App category
- [ ] Content rating (complete questionnaire)
- [ ] Target audience
- [ ] Store listing contact details

### 6.6 Promote to Production
1. Test in internal track
2. Promote to production when ready
3. Submit for review

**Review time**: 1-7 days typically

## 🔄 Step 7: Updates and Maintenance

### 7.1 Increment Version Numbers
Before each update, increment versions in `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

**Version naming:**
- Major update: 1.0.0 → 2.0.0
- Minor update: 1.0.0 → 1.1.0
- Patch: 1.0.0 → 1.0.1

### 7.2 Build and Submit Updates
```bash
# Build both platforms
eas build --platform all --profile production

# Submit to both stores
eas submit --platform ios
eas submit --platform android
```

## 📊 Step 8: Analytics and Monitoring

### 8.1 Set Up Analytics
Consider adding:
- **Expo Analytics** (built-in)
- **Google Analytics for Firebase**
- **Mixpanel**
- **Amplitude**

### 8.2 Monitor Crashes
- **Sentry** - Error tracking
- **Crashlytics** - Crash reporting

### 8.3 Track Key Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Retention rate (Day 1, Day 7, Day 30)
- Habit completion rate
- Affirmation generation usage
- Journal entry frequency

## 🐛 Troubleshooting

### Build Fails
```bash
# View build logs
eas build:list
eas build:view [build-id]

# Clear cache and retry
eas build --platform ios --profile production --clear-cache
```

### Certificate Issues (iOS)
```bash
# Reset credentials
eas credentials

# Select "iOS" → "Remove all credentials"
# Then rebuild - EAS will generate new ones
```

### Keystore Issues (Android)
```bash
# Reset credentials
eas credentials

# Select "Android" → "Remove all credentials"
# Then rebuild - EAS will generate new ones
```

### Backend Connection Issues
1. Verify backend URL in `app.json`
2. Test backend endpoints with Postman
3. Check CORS configuration
4. Verify authentication is working
5. Rebuild app after backend URL changes

## 📝 Pre-Launch Checklist

### Technical
- [ ] Backend deployed and tested
- [ ] Backend URL configured in app.json
- [ ] All API endpoints working
- [ ] Authentication tested (email, Google, Apple)
- [ ] Database migrations complete
- [ ] Production builds created
- [ ] Tested on real devices (iOS and Android)
- [ ] No console errors or warnings
- [ ] App icons and splash screens correct
- [ ] Deep linking working (OAuth redirects)

### App Store
- [ ] App Store Connect account set up
- [ ] App created in App Store Connect
- [ ] Screenshots prepared (all sizes)
- [ ] App description written
- [ ] Keywords researched
- [ ] Privacy policy published
- [ ] Support URL set up
- [ ] Age rating completed
- [ ] Build uploaded and attached
- [ ] Submitted for review

### Play Store
- [ ] Play Console account set up
- [ ] App created in Play Console
- [ ] Screenshots prepared (phone and tablet)
- [ ] Descriptions written (short and full)
- [ ] Privacy policy published
- [ ] Content rating completed
- [ ] Service account created
- [ ] Build uploaded
- [ ] Tested in internal track
- [ ] Promoted to production

### Marketing
- [ ] Landing page created
- [ ] Social media accounts set up
- [ ] Press kit prepared
- [ ] Launch announcement written
- [ ] Email list ready
- [ ] App Store Optimization (ASO) complete

## 🎉 Launch Day

1. **Monitor**: Watch for crashes and errors
2. **Respond**: Reply to user reviews quickly
3. **Support**: Be ready to help users
4. **Promote**: Share on social media
5. **Iterate**: Gather feedback and plan updates

## 📞 Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/
- **Play Console Help**: https://support.google.com/googleplay/android-developer/

## 🚀 Next Steps After Launch

1. **Week 1**: Monitor closely, fix critical bugs
2. **Week 2**: Respond to reviews, gather feedback
3. **Month 1**: Plan first major update
4. **Month 3**: Analyze metrics, optimize features
5. **Month 6**: Consider premium features, monetization

Good luck with your launch! 🎊
