
# Indigo Habits - Complete Launch Checklist

## 📋 Pre-Launch Checklist

Use this checklist to track your progress from development to app store launch.

---

## Phase 1: Backend Setup ⚠️ REQUIRED

### Database Setup
- [ ] SQLite database created
- [ ] Users table created (BetterAuth)
- [ ] Affirmations table created
- [ ] Habits table created
- [ ] HabitCompletions table created
- [ ] JournalEntries table created
- [ ] Profiles table created
- [ ] All indexes created
- [ ] Database migrations tested

### Authentication Setup
- [ ] BetterAuth installed and configured
- [ ] Email/password authentication working
- [ ] Google OAuth configured
- [ ] Apple OAuth configured
- [ ] GitHub OAuth configured
- [ ] Session management working
- [ ] OAuth redirect URLs configured

### API Endpoints
- [ ] POST /api/auth/sign-in/email
- [ ] POST /api/auth/sign-up/email
- [ ] GET /api/auth/session
- [ ] POST /api/auth/sign-out
- [ ] GET /api/auth/google
- [ ] GET /api/auth/apple
- [ ] GET /api/auth/github
- [ ] GET /api/affirmations/daily
- [ ] POST /api/affirmations/generate
- [ ] POST /api/affirmations/custom
- [ ] POST /api/affirmations/:id/favorite
- [ ] POST /api/affirmations/:id/repeat
- [ ] GET /api/habits
- [ ] POST /api/habits
- [ ] PUT /api/habits/:id
- [ ] DELETE /api/habits/:id
- [ ] POST /api/habits/:id/complete
- [ ] GET /api/habits/completions
- [ ] GET /api/journal-entries
- [ ] POST /api/journal-entries
- [ ] POST /api/journal-entries/:id/favorite
- [ ] GET /api/profile
- [ ] POST /api/profile/picture
- [ ] GET /api/progress
- [ ] POST /api/upload/photo

### OpenAI Integration
- [ ] OpenAI API key obtained
- [ ] GPT-5.2 model configured
- [ ] Affirmation generation tested
- [ ] Rate limiting implemented
- [ ] Error handling implemented

### Backend Deployment
- [ ] Hosting provider selected (Railway/Render/Fly.io/AWS)
- [ ] Environment variables configured
- [ ] Backend deployed to production
- [ ] HTTPS enabled
- [ ] CORS configured for app domain
- [ ] Health check endpoint working
- [ ] Error logging configured
- [ ] Backend URL noted: ___________________________

---

## Phase 2: Frontend Configuration ✅ READY

### App Configuration
- [x] App name set: Indigo Habits
- [x] Bundle ID set: com.indigohabits.app
- [x] Package name set: com.indigohabits.app
- [x] App scheme set: natively
- [x] Version set: 1.0.0
- [x] Icons configured
- [x] Splash screen configured

### Backend Integration
- [ ] Backend URL added to app.json
  ```json
  {
    "expo": {
      "extra": {
        "backendUrl": "https://your-backend-url.com"
      }
    }
  }
  ```
- [ ] App rebuilt after adding backend URL

### EAS Setup
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] EAS configured: `eas build:configure`
- [ ] Project ID generated and added to app.json

---

## Phase 3: Testing 🧪

### Local Testing
- [ ] npm install completed successfully
- [ ] npm run dev works
- [ ] App runs on iOS simulator
- [ ] App runs on Android emulator
- [ ] App runs on web browser

### Backend Connection Testing
- [ ] Sign up with email works
- [ ] Sign in with email works
- [ ] Google OAuth works
- [ ] Apple OAuth works (iOS only)
- [ ] GitHub OAuth works
- [ ] Session persists after app restart

### Feature Testing
- [ ] Generate affirmation works
- [ ] Create custom affirmation works
- [ ] Toggle affirmation favorite works
- [ ] Toggle affirmation repeating works
- [ ] Create habit works
- [ ] Edit habit works
- [ ] Delete habit works
- [ ] Toggle habit completion works
- [ ] Journal auto-save works
- [ ] Photo upload works (journal)
- [ ] Profile picture upload works
- [ ] Progress tracking shows correct data
- [ ] Streaks calculate correctly
- [ ] Badges award correctly

### Device Testing
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] Tested on different screen sizes
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Tested with slow internet
- [ ] Tested offline behavior

---

## Phase 4: Production Builds 📦

### iOS Build
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Build completed successfully
- [ ] Build ID: ___________________________
- [ ] Downloaded .ipa file
- [ ] Installed on test device
- [ ] All features tested on build

### Android Build
- [ ] Run: `eas build --platform android --profile production`
- [ ] Build completed successfully
- [ ] Build ID: ___________________________
- [ ] Downloaded .aab file
- [ ] Tested on real device
- [ ] All features tested on build

---

## Phase 5: App Store Preparation 🍎

### Apple Developer Account
- [ ] Apple Developer account active ($99/year)
- [ ] Team ID noted: ___________________________
- [ ] Certificates configured

### App Store Connect
- [ ] App created in App Store Connect
- [ ] App name: Indigo Habits
- [ ] Bundle ID: com.indigohabits.app
- [ ] ASC App ID noted: ___________________________
- [ ] Primary language: English
- [ ] Category: Health & Fitness

### App Store Assets
- [ ] App icon (1024x1024px)
- [ ] iPhone 6.7" screenshots (3-10 images)
- [ ] iPhone 6.5" screenshots (3-10 images)
- [ ] iPhone 5.5" screenshots (3-10 images)
- [ ] iPad Pro 12.9" screenshots (3-10 images)
- [ ] App preview video (optional)

### App Store Listing
- [ ] App name (30 chars max)
- [ ] Subtitle (30 chars max)
- [ ] Description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy policy URL
- [ ] Age rating completed

### eas.json Configuration
- [ ] Apple ID added
- [ ] ASC App ID added
- [ ] Apple Team ID added

### iOS Submission
- [ ] Run: `eas submit --platform ios`
- [ ] Build uploaded to App Store Connect
- [ ] Build attached to version
- [ ] App information complete
- [ ] Pricing set (Free)
- [ ] Availability set
- [ ] Submitted for review
- [ ] Submission date: ___________________________

---

## Phase 6: Play Store Preparation 🤖

### Google Play Console
- [ ] Play Console account active ($25 one-time)
- [ ] App created in Play Console
- [ ] App name: Indigo Habits
- [ ] Package name: com.indigohabits.app
- [ ] Default language: English (United States)

### Play Store Assets
- [ ] App icon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Phone screenshots (2-8 images)
- [ ] 7" tablet screenshots (optional)
- [ ] 10" tablet screenshots (optional)
- [ ] Promo video (optional)

### Play Store Listing
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App category: Health & Fitness
- [ ] Tags (up to 5)
- [ ] Contact email
- [ ] Privacy policy URL
- [ ] Content rating completed

### Service Account
- [ ] Service account created in Google Cloud
- [ ] JSON key downloaded
- [ ] Saved as: google-play-service-account.json
- [ ] Path added to eas.json

### Android Submission
- [ ] Run: `eas submit --platform android`
- [ ] Build uploaded to Play Console
- [ ] Release created in internal track
- [ ] Tested in internal track
- [ ] Promoted to production
- [ ] Submitted for review
- [ ] Submission date: ___________________________

---

## Phase 7: Post-Submission 📊

### Monitoring
- [ ] App Store Connect access configured
- [ ] Play Console access configured
- [ ] Analytics configured
- [ ] Crash reporting configured
- [ ] Error logging configured

### Marketing
- [ ] Landing page live
- [ ] Social media accounts created
- [ ] Press kit prepared
- [ ] Launch announcement ready
- [ ] Email list ready

### Support
- [ ] Support email set up
- [ ] FAQ page created
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Phase 8: Launch Day 🚀

### Pre-Launch (1 day before)
- [ ] Final testing on production builds
- [ ] Support team briefed
- [ ] Marketing materials ready
- [ ] Social media posts scheduled

### Launch Day
- [ ] Monitor App Store Connect for approval
- [ ] Monitor Play Console for approval
- [ ] Respond to any review questions
- [ ] Post launch announcement
- [ ] Monitor for crashes/errors
- [ ] Respond to user reviews

### Post-Launch (First Week)
- [ ] Monitor daily active users
- [ ] Track crash-free rate
- [ ] Respond to all reviews
- [ ] Fix critical bugs immediately
- [ ] Gather user feedback
- [ ] Plan first update

---

## Success Metrics 📈

### Week 1 Goals
- [ ] 100+ downloads
- [ ] 95%+ crash-free rate
- [ ] 4+ star average rating
- [ ] <1% uninstall rate

### Month 1 Goals
- [ ] 1,000+ downloads
- [ ] 500+ daily active users
- [ ] 4.5+ star average rating
- [ ] 50%+ Day 7 retention

### Month 3 Goals
- [ ] 10,000+ downloads
- [ ] 2,000+ daily active users
- [ ] 4.5+ star average rating
- [ ] 40%+ Day 30 retention

---

## Emergency Contacts 🆘

### Technical Support
- **Expo Support**: https://expo.dev/support
- **Apple Developer Support**: https://developer.apple.com/support/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/

### Documentation
- **EAS Build**: https://docs.expo.dev/eas/
- **App Store Connect**: https://developer.apple.com/app-store-connect/
- **Play Console**: https://support.google.com/googleplay/android-developer/

---

## Notes

Use this space to track important information:

**Backend URL**: ___________________________

**EAS Project ID**: ___________________________

**Apple Team ID**: ___________________________

**ASC App ID**: ___________________________

**iOS Build ID**: ___________________________

**Android Build ID**: ___________________________

**iOS Submission Date**: ___________________________

**Android Submission Date**: ___________________________

**iOS Approval Date**: ___________________________

**Android Approval Date**: ___________________________

**Launch Date**: ___________________________

---

## 🎉 Congratulations!

Once all items are checked, you've successfully launched Indigo Habits!

**Next Steps**:
1. Monitor user feedback
2. Fix bugs quickly
3. Plan feature updates
4. Grow your user base
5. Consider monetization

Good luck! 🚀
