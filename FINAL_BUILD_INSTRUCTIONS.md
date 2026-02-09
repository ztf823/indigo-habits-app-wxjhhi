
# 🚀 Final IPA Build Instructions for App Store Connect

## ✅ Pre-Build Checklist

Before running the build command, ensure you have completed:

### 1. EAS Project Setup
```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to your Expo account
eas login

# Initialize EAS project (if not already done)
eas init
```

After running `eas init`, you'll get a project ID. Update `app.json`:
- Replace `"projectId": "your-eas-project-id"` with your actual project ID
- Replace `"owner": "your-expo-username"` with your Expo username

### 2. RevenueCat Configuration

**CRITICAL**: Update the Apple API key in `utils/revenueCat.ts`:

Current line:
```typescript
const REVENUECAT_APPLE_API_KEY = 'appl_KVaWqlpxQpKqoMgILPRLHowDNxe';
```

✅ **This is already configured with your Apple key!**

Verify in RevenueCat Dashboard:
1. Go to https://app.revenuecat.com/
2. Navigate to Project Settings → API Keys
3. Confirm the Apple key matches: `appl_KVaWqlpxQpKqoMgILPRLHowDNxe`

### 3. App Store Connect Setup

Before building, ensure you have:

1. **Created your app in App Store Connect**:
   - Bundle ID: `com.indigohabits.app`
   - App Name: "Indigo Habits"
   - SKU: `indigo-habits-001`

2. **Created In-App Purchase**:
   - Product ID: `premium_monthly`
   - Type: Auto-Renewable Subscription
   - Price: $4.40/month
   - Subscription Group: "Premium"

3. **Configured RevenueCat**:
   - Product: `premium_monthly` created
   - Entitlement: `pro` created
   - Product linked to entitlement

### 4. Required Assets

Verify these files exist:
- ✅ App Icon: `assets/images/6d55fc54-d63d-4404-853f-c341ea5517d1.png` (1024x1024)
- ✅ Splash Screen: Same file
- ✅ Notification Icon: Same file

### 5. Privacy Policy

You MUST have a hosted privacy policy before submission:
- Review `PRIVACY_POLICY.md`
- Host it online (GitHub Pages, Netlify, Vercel, etc.)
- Have the URL ready for App Store Connect

---

## 🏗️ Build Commands

### Option 1: Build iOS Only (Recommended for App Store)

```bash
npm run build:ios
```

Or directly with EAS:
```bash
eas build --platform ios --profile production
```

### Option 2: Build Both Platforms

```bash
npm run build:all
```

Or directly with EAS:
```bash
eas build --platform all --profile production
```

---

## ⏱️ Build Process

1. **Command Execution**: Run the build command above
2. **EAS Upload**: Your code will be uploaded to EAS servers
3. **Build Queue**: Your build will be queued (usually 5-15 minutes wait)
4. **Build Time**: iOS build takes approximately 20-30 minutes
5. **Download**: Once complete, you'll get a download link for the IPA file

**Monitor your build**:
```bash
eas build:list
```

Or visit: https://expo.dev/accounts/[your-username]/projects/indigohabits/builds

---

## 📦 After Build Completes

### Download the IPA

1. **From Terminal**: EAS will provide a download link
2. **From Dashboard**: Go to https://expo.dev → Your Project → Builds
3. **Download**: Click the build and download the `.ipa` file

### Submit to App Store Connect

#### Method 1: Using EAS Submit (Easiest)

```bash
npm run submit:ios
```

Or:
```bash
eas submit --platform ios --latest
```

You'll be prompted for:
- Apple ID
- App-specific password (create at appleid.apple.com)
- App Store Connect app ID

#### Method 2: Using Transporter App (Manual)

1. Download Apple's **Transporter** app from Mac App Store
2. Open Transporter
3. Sign in with your Apple ID
4. Drag and drop the `.ipa` file
5. Click "Deliver"

#### Method 3: Using Xcode (Alternative)

1. Open Xcode
2. Go to Window → Organizer
3. Click "Distribute App"
4. Select "App Store Connect"
5. Upload the IPA

---

## 🎯 App Store Connect Submission

After uploading the IPA:

### 1. Processing Time
- Apple processes the build (10-60 minutes)
- You'll receive an email when processing is complete

### 2. Complete App Information

In App Store Connect, fill out:

**App Information**:
- Name: Indigo Habits
- Subtitle: Build Better Habits Daily
- Privacy Policy URL: [Your hosted URL]
- Category: Health & Fitness (Primary), Productivity (Secondary)

**Pricing**:
- Free app with in-app purchases
- In-App Purchase: Premium Monthly ($4.40/month)

**App Privacy**:
- Data Collection: Yes (for user accounts, journal entries)
- Data Usage: See `PRIVACY_POLICY.md` for details

**Version Information**:
- Version: 1.0.0
- Build: 1 (auto-incremented by EAS)
- What's New: "Initial release of Indigo Habits"

**Screenshots** (Required):
- 6.5" Display: 3-10 screenshots (1284 x 2778 pixels)
- 5.5" Display: 3-10 screenshots (1242 x 2208 pixels)

**App Preview** (Optional but recommended):
- 30-second video showcasing the app

**Description**:
```
Indigo Habits is your mindful companion for building positive habits and reflecting on your daily journey.

✨ FEATURES:
• Daily Affirmations - Start each day with inspiration
• Habit Tracking - Build up to 10 daily habits with streaks
• Journal Entries - Capture thoughts with photos and audio
• Progress Insights - Visualize your growth with streaks and badges
• Smart Reminders - Never miss a habit or journal entry
• Beautiful Design - Clean, minimal interface with indigo-to-sky gradient

🎯 FREE FEATURES:
• 3 daily habits
• 5 affirmations
• Unlimited journal entries
• Basic progress tracking

💎 PREMIUM ($4.40/month):
• 10 daily habits
• Unlimited affirmations
• Individual habit reminders
• Journal reminders
• Advanced progress insights
• Priority support

Build better habits, one day at a time with Indigo Habits.
```

**Keywords**:
```
habits, journal, affirmations, mindfulness, productivity, self-improvement, daily habits, streak tracker, gratitude, wellness
```

**Support URL**: Your website or support email
**Marketing URL**: Your website (optional)

### 3. In-App Purchase Information

For `premium_monthly`:
- Reference Name: Premium Monthly Subscription
- Product ID: premium_monthly
- Cleared for Sale: Yes
- Price: $4.40/month
- Subscription Group: Premium
- Description: "Unlock all premium features including 10 daily habits, unlimited affirmations, and advanced reminders."

### 4. Submit for Review

1. Select the build you uploaded
2. Add App Store screenshots
3. Complete all required fields
4. Click "Submit for Review"

**Review Time**: Typically 24-48 hours

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Project ID not found"**
- Solution: Run `eas init` and update `app.json` with the project ID

**Error: "Bundle identifier mismatch"**
- Solution: Ensure `com.indigohabits.app` is used in both `app.json` and App Store Connect

**Error: "Missing credentials"**
- Solution: Run `eas credentials` to configure iOS certificates

### Upload Fails

**Error: "Invalid IPA"**
- Solution: Ensure you downloaded the correct `.ipa` file (not `.aab`)

**Error: "Missing compliance"**
- Solution: Already configured in `app.json` with `ITSAppUsesNonExemptEncryption: false`

### Submission Rejected

**Common reasons**:
1. Missing privacy policy → Host your privacy policy online
2. Incomplete metadata → Fill all required fields in App Store Connect
3. Missing screenshots → Add required screenshot sizes
4. In-app purchase not configured → Set up `premium_monthly` in App Store Connect

---

## 📋 Final Checklist

Before submitting to App Store:

- [ ] EAS project initialized (`eas init`)
- [ ] Project ID updated in `app.json`
- [ ] Owner username updated in `app.json`
- [ ] RevenueCat Apple key verified in `utils/revenueCat.ts`
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.indigohabits.app`
- [ ] In-app purchase `premium_monthly` created in App Store Connect
- [ ] RevenueCat product and entitlement configured
- [ ] Privacy policy hosted online
- [ ] Screenshots prepared (6.5" and 5.5" sizes)
- [ ] App description written
- [ ] Keywords selected
- [ ] Support URL ready
- [ ] Build completed successfully
- [ ] IPA uploaded to App Store Connect
- [ ] All metadata filled in App Store Connect
- [ ] Submitted for review

---

## 🎉 Success!

Once approved, your app will be live on the App Store!

**Post-Launch**:
1. Monitor reviews and ratings
2. Respond to user feedback
3. Track analytics in App Store Connect
4. Monitor RevenueCat dashboard for subscription metrics
5. Plan updates and improvements

---

## 📞 Support Resources

**EAS Build Issues**:
- Docs: https://docs.expo.dev/build/introduction/
- Support: https://expo.dev/support

**App Store Connect**:
- Docs: https://developer.apple.com/app-store-connect/
- Support: https://developer.apple.com/contact/

**RevenueCat**:
- Docs: https://docs.revenuecat.com/
- Support: https://www.revenuecat.com/support

---

## 🚀 Quick Start Command

If everything is configured, simply run:

```bash
npm run build:ios
```

Then wait for the build to complete and follow the submission steps above!

**Good luck with your App Store submission! 🎊**
