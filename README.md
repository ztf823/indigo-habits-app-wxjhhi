
# Indigo Habits

A beautiful, minimal habit tracking and journaling app inspired by Day One Journal.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)
![License](https://img.shields.io/badge/license-Proprietary-red)

## ✨ Features

- **Daily Affirmations**: AI-powered affirmations or create your own
- **Habit Tracking**: Track up to 3 habits (free) or 10 habits (pro)
- **Journal Entries**: Clean, minimal journaling with photo support
- **Progress Tracking**: View streaks, badges, and calendar history
- **Beautiful UI**: Indigo-to-sky-blue gradients with smooth animations
- **Cross-Platform**: iOS, Android, and Web support

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Production Builds

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started quickly
- **[Build Instructions](BUILD_INSTRUCTIONS.md)** - Complete build and deployment guide
- **[Backend Integration](BACKEND_INTEGRATION_GUIDE.md)** - Backend API specifications
- **[Backend Setup](BACKEND_SETUP_CHECKLIST.md)** - Backend setup checklist
- **[Configuration Summary](CONFIGURATION_SUMMARY.md)** - All configuration values
- **[Launch Checklist](LAUNCH_CHECKLIST.md)** - Complete launch checklist
- **[Finalization Summary](FINALIZATION_SUMMARY.md)** - What's done and what's next

## 🏗️ Tech Stack

### Frontend
- **Framework**: React Native + Expo 54
- **Navigation**: Expo Router (file-based routing)
- **UI**: React Native components with custom styling
- **Animations**: React Native Reanimated
- **State**: React Context API
- **Storage**: Expo SecureStore (native) / localStorage (web)

### Backend (Required)
- **Runtime**: Node.js 18+
- **Framework**: Fastify (recommended)
- **Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM
- **Authentication**: BetterAuth
- **AI**: OpenAI GPT-5.2

## 📱 App Information

- **Name**: Indigo Habits
- **Bundle ID (iOS)**: com.indigohabits.app
- **Package Name (Android)**: com.indigohabits.app
- **Version**: 1.0.0
- **Scheme**: natively://

## 🔧 Configuration

### Backend URL

After deploying your backend, update `app.json`:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://your-backend-url.com"
    }
  }
}
```

**⚠️ Important**: Rebuild the app after changing the backend URL!

### Environment Variables

See `.env.example` for required environment variables.

## 🗄️ Database Schema

The app requires a SQLite database with the following tables:

- **users** - User accounts (managed by BetterAuth)
- **affirmations** - Daily affirmations
- **habits** - User habits
- **habitCompletions** - Habit completion records
- **journalEntries** - Journal entries with photos
- **profiles** - User profile data

See `BACKEND_INTEGRATION_GUIDE.md` for complete schema.

## 🔐 Authentication

BetterAuth is configured with:
- Email/password authentication
- Google OAuth
- Apple OAuth (iOS only)
- GitHub OAuth

Tokens are stored securely:
- **Web**: localStorage
- **Native**: expo-secure-store

## 📊 Features by User Type

### Free Users
- 3 habits maximum
- 5 AI-generated affirmations per day
- 3 affirmations displayed on home
- Full journal functionality
- Progress tracking

### Pro Users
- 10 habits maximum
- Unlimited AI-generated affirmations
- 3 affirmations displayed on home
- Full journal functionality
- Progress tracking
- Priority support

## 🎨 Design

- **Color Scheme**: Indigo (#4F46E5) to Sky Blue (#87CEEB) gradient
- **Typography**: System fonts (San Francisco on iOS, Roboto on Android)
- **Icons**: SF Symbols (iOS) / Material Icons (Android)
- **Animations**: Smooth transitions with haptic feedback

## 📦 Project Structure

```
indigo-habits/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── (home)/        # Home screen
│   │   ├── habits.tsx     # Habits management
│   │   ├── history.tsx    # History and favorites
│   │   ├── profile.tsx    # User profile
│   │   └── progress.tsx   # Progress tracking
│   ├── auth.tsx           # Authentication screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/                   # Libraries (auth, etc.)
├── utils/                 # Utility functions
├── assets/                # Images, fonts, etc.
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json           # Dependencies
```

## 🧪 Testing

### Local Testing
```bash
npm run dev
```

### Device Testing
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

### Production Testing
```bash
# Build
eas build --platform all --profile production

# Test on real devices before submitting
```

## 🚀 Deployment

### Prerequisites
1. Backend deployed with all API endpoints
2. Backend URL added to `app.json`
3. EAS project configured
4. Apple Developer account ($99/year)
5. Google Play Console account ($25 one-time)

### Build and Submit
```bash
# Build for both platforms
eas build --platform all --profile production

# Submit to both stores
eas submit --platform all
```

See `BUILD_INSTRUCTIONS.md` for detailed steps.

## 📈 Roadmap

### Version 1.1
- [ ] Push notifications for habit reminders
- [ ] Widget support (iOS and Android)
- [ ] Export journal entries to PDF
- [ ] Dark mode improvements

### Version 1.2
- [ ] Social features (share progress)
- [ ] Habit templates
- [ ] Custom themes
- [ ] Apple Watch app

### Version 2.0
- [ ] Premium subscription with Superwall
- [ ] Advanced analytics
- [ ] Habit categories
- [ ] Team habits

## 🐛 Known Issues

None currently. Report issues via support email.

## 📞 Support

- **Email**: support@indigohabits.com
- **Website**: https://indigohabits.com
- **Documentation**: See docs folder

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- **Expo Team** - For the amazing framework
- **BetterAuth** - For authentication
- **OpenAI** - For AI-powered affirmations
- **Day One** - For design inspiration

## 🎉 Status

- ✅ **Frontend**: Complete and production-ready
- ⚠️ **Backend**: Needs to be deployed
- ⚠️ **App Store**: Ready for submission after backend setup
- ⚠️ **Play Store**: Ready for submission after backend setup

## 🚀 Next Steps

1. **Deploy Backend** - Follow `BACKEND_SETUP_CHECKLIST.md`
2. **Update app.json** - Add backend URL
3. **Build App** - Run `eas build --platform all --profile production`
4. **Submit to Stores** - Follow `BUILD_INSTRUCTIONS.md`

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [EAS Build Documentation](https://docs.expo.dev/eas/)

---

**Made with ❤️ for building better habits**
