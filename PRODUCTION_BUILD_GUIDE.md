
# Indigo Habits - Production Build Guide

## 📱 App Information

- **App Name**: Indigo Habits
- **Bundle ID (iOS)**: com.indigohabits.app
- **Package Name (Android)**: com.indigohabits.app
- **Version**: 1.0.0
- **Build Number (iOS)**: 1
- **Version Code (Android)**: 1

## 🚀 Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS Project
```bash
eas build:configure
```

This will:
- Create an EAS project
- Generate a project ID
- Update your `app.json` with the project ID

### 4. Update EAS Configuration

After running `eas build:configure`, update the following in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    }
  }
}
```

## 📦 Building for iOS

### Development Build (for testing)
```bash
eas build --platform ios --profile development
```

### Preview Build (for TestFlight)
```bash
eas build --platform ios --profile preview
```

### Production Build (for App Store)
```bash
eas build --platform ios --profile production
```

### iOS Submission Requirements

Before submitting to the App Store, update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

**How to find these values:**
- **appleId**: Your Apple ID email
- **ascAppId**: Found in App Store Connect → App Information
- **appleTeamId**: Found in Apple Developer Account → Membership

### Submit to App Store
```bash
eas submit --platform ios
```

## 🤖 Building for Android

### Development Build (APK for testing)
```bash
eas build --platform android --profile development
```

### Preview Build (APK for internal testing)
```bash
eas build --platform android --profile preview
```

### Production Build (AAB for Play Store)
```bash
eas build --platform android --profile production
```

### Android Submission Requirements

Before submitting to Google Play, you need a service account key:

1. Go to Google Play Console
2. Navigate to Setup → API access
3. Create a new service account
4. Download the JSON key file
5. Update `eas.json`:

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
- `internal` - Internal testing
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Production release

### Submit to Google Play
```bash
eas submit --platform android
```

## 🔧 Build Both Platforms Simultaneously
```bash
eas build --platform all --profile production
```

## 📊 Check Build Status
```bash
eas build:list
```

## 🔍 View Build Details
```bash
eas build:view [build-id]
```

## 🎯 Testing Builds

### iOS TestFlight
After building with `--profile production`, submit to TestFlight:
```bash
eas submit --platform ios
```

Then invite testers through App Store Connect.

### Android Internal Testing
After building with `--profile production`, submit to Play Console:
```bash
eas submit --platform android
```

Then create an internal testing release in Play Console.

## 🔐 Code Signing

### iOS
EAS handles iOS code signing automatically. You can:
- Let EAS manage certificates (recommended)
- Use your own certificates

### Android
EAS generates and manages Android keystores automatically.

## 📝 Pre-Submission Checklist

### iOS App Store
- [ ] App icon (1024x1024px)
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating
- [ ] App Store Connect account set up
- [ ] Apple Developer Program membership ($99/year)

### Google Play Store
- [ ] App icon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots for phone and tablet
- [ ] App description (short and full)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Google Play Console account set up ($25 one-time fee)

## 🐛 Troubleshooting

### Build Fails
```bash
# View detailed logs
eas build:view [build-id]

# Clear cache and retry
eas build --platform ios --profile production --clear-cache
```

### Certificate Issues (iOS)
```bash
# Reset credentials
eas credentials
```

### Keystore Issues (Android)
```bash
# Reset credentials
eas credentials
```

## 📱 App Store Optimization

### App Name
"Indigo Habits - Daily Tracker"

### Subtitle (iOS)
"Build Better Habits Daily"

### Short Description (Android)
"Track habits, journal entries, and daily affirmations with a beautiful, minimal interface."

### Keywords (iOS)
habit tracker, daily habits, journal, affirmations, productivity, self-improvement, mindfulness, routine, goals, motivation

### Category
- **iOS**: Health & Fitness / Productivity
- **Android**: Health & Fitness / Productivity

## 🔄 Updating Your App

### Increment Version Numbers

**iOS** (in `app.json`):
```json
{
  "ios": {
    "buildNumber": "2"
  }
}
```

**Android** (in `app.json`):
```json
{
  "android": {
    "versionCode": 2
  }
}
```

**Both** (in `app.json`):
```json
{
  "version": "1.0.1"
}
```

### Build and Submit Update
```bash
# Build
eas build --platform all --profile production

# Submit
eas submit --platform ios
eas submit --platform android
```

## 📞 Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Google Play Console**: https://play.google.com/console/

## 🎉 Launch Checklist

- [ ] Backend deployed and configured
- [ ] Backend URL added to `app.json` (`expo.extra.backendUrl`)
- [ ] Production builds created for iOS and Android
- [ ] TestFlight testing completed (iOS)
- [ ] Internal testing completed (Android)
- [ ] App Store listing complete
- [ ] Play Store listing complete
- [ ] Privacy policy published
- [ ] Support email/website set up
- [ ] Marketing materials prepared
- [ ] Social media accounts created
- [ ] Press kit prepared
- [ ] Launch date scheduled

Good luck with your launch! 🚀
