
# Indigo Habits - Quick Start Guide

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 📦 Production Builds

### Prerequisites
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure
```

### Build Commands

```bash
# Build for iOS (App Store)
eas build --platform ios --profile production

# Build for Android (Play Store)
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android

# Submit to both stores
eas submit --platform all
```

## 🔧 Configuration

### Update Backend URL
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://your-backend-url.com"
    }
  }
}
```

**⚠️ Important**: Rebuild app after changing backend URL!

### Update Version
Edit `app.json`:
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

## 📱 Testing

### iOS TestFlight
1. Build with production profile
2. Submit to App Store
3. Add testers in App Store Connect
4. Testers receive TestFlight invitation

### Android Internal Testing
1. Build with production profile
2. Submit to Play Console
3. Create internal testing release
4. Add testers via email

## 🐛 Troubleshooting

### Build Failed
```bash
# View build logs
eas build:list
eas build:view [build-id]

# Clear cache and retry
eas build --platform ios --clear-cache
```

### Reset Credentials
```bash
eas credentials
# Select platform → Remove all credentials
```

### Backend Not Working
1. Check backend URL in `app.json`
2. Test backend with Postman
3. Verify CORS settings
4. Rebuild app

## 📚 Documentation

- **Full Build Guide**: See `BUILD_INSTRUCTIONS.md`
- **Backend Integration**: See `BACKEND_INTEGRATION_GUIDE.md`
- **Production Guide**: See `PRODUCTION_BUILD_GUIDE.md`

## 🆘 Need Help?

- **EAS Docs**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **GitHub Issues**: Create an issue in your repository

## 🎯 Common Tasks

### Update App
1. Make code changes
2. Increment version in `app.json`
3. Build: `eas build --platform all --profile production`
4. Submit: `eas submit --platform all`

### Change App Icon
1. Replace `assets/images/natively-dark.png`
2. Rebuild app

### Change App Name
1. Update `name` in `app.json`
2. Rebuild app

### Add New Feature
1. Develop and test locally
2. Update backend if needed
3. Increment version
4. Build and submit

## ✅ Pre-Launch Checklist

- [ ] Backend deployed and URL configured
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] App Store listing complete
- [ ] Play Store listing complete
- [ ] Privacy policy published
- [ ] Support email set up
- [ ] Screenshots prepared
- [ ] Production builds created
- [ ] Submitted for review

## 🎉 You're Ready!

Follow the steps above to build and deploy Indigo Habits to the App Store and Play Store.

For detailed instructions, see `BUILD_INSTRUCTIONS.md`.

Good luck! 🚀
