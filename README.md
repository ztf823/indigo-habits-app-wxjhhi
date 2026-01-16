
# Indigo Habits

A beautiful habit tracking and journaling app with daily affirmations.

## Features

- **Daily Journal**: Reflect on your day with a clean, beautiful journal
- **Daily Affirmations**: Start each day with positive, uplifting affirmations
- **Habit Tracking**: Build lasting habits with simple, visual tracking
- **Progress & Streaks**: Watch your growth with streaks and achievements
- **Local Storage**: All data stored locally using SQLite - no backend required

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Production Builds

### Prerequisites

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

### Build for iOS

```bash
# Development build (for testing on device)
eas build --platform ios --profile development

# Production build (for App Store)
eas build --platform ios --profile production
```

### Build for Android

```bash
# Development build (APK for testing)
eas build --platform android --profile development

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### Submit to App Stores

After building, submit to the app stores:

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## Configuration

- **App Name**: Indigo Habits
- **Bundle ID (iOS)**: com.indigohabits.app
- **Package Name (Android)**: com.indigohabits.app
- **Version**: 1.0.0

## Database

The app uses local SQLite database for all data storage. No backend server is required.

All data is stored on the device and persists between app launches.

## License

Private - All rights reserved
