
# Indigo Habits - Your Serene Habit & Journaling Companion

A beautiful, minimal habit tracking and journaling app inspired by Day One Journal, built with React Native and Expo 54.

## 🎨 Design Philosophy

**Clean. Minimal. Breathable.**

- **Colors**: Indigo to sky blue gradient background (#4F46E5 → #7DD3FC)
- **Cards**: Pure white (#FFFFFF) with subtle shadows
- **Typography**: Clean, spacious, SF Pro-inspired
- **Icons**: Silver (#9CA3AF) with indigo accents
- **Feedback**: Soft haptic chimes on completion

## ✨ Features

### 📝 Journal Entry
- Clean white entry box with top-right date stamp
- Camera button to attach photos to entries
- Smooth, minimal interface like Day One

### 💭 Daily Affirmations
- Slide-up affirmation card
- "Add custom" or "Generate one" options
- 5 free AI-generated affirmations
- Unlimited custom affirmations
- 100+ affirmations stored offline
- Save favorites (coming soon)

### ✅ Habits Tracking
- Horizontal habits strip
- Free: 3 daily habits
- Pro: 10 daily habits
- Red X (❌) for missed habits
- Green checkmark (✓) with soft glow for completed
- Soft haptic feedback on completion

### 📊 Progress Tab
- Calendar view with completion tracking
- Current streak counter
- Longest streak display
- Total days tracked
- Achievement badges system
- Visual progress indicators

### 💎 Premium Features (Superwall)
- Upgrade from 3 to 10 habits
- Unlimited AI affirmations
- Advanced progress analytics (coming soon)

## 🏗️ Technical Stack

- **Framework**: React Native + Expo 54
- **Navigation**: Expo Router (file-based)
- **Payments**: Superwall (expo-superwall)
- **Storage**: AsyncStorage (offline-first)
- **Animations**: React Native Reanimated
- **Haptics**: Expo Haptics
- **Images**: Expo Image Picker
- **Gradients**: Expo Linear Gradient

## 📱 Screens

1. **Journal Tab** (`app/(tabs)/(home)/index.tsx`)
   - Affirmation card (slide-up animation)
   - Journal entry box
   - Habits strip
   - Photo attachment

2. **Progress Tab** (`app/(tabs)/profile.tsx`)
   - Stats cards (streak, longest, total)
   - Monthly calendar view
   - Achievement badges grid

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Superwall
1. Sign up at [superwall.com](https://superwall.com)
2. Get your API key from the dashboard
3. Update `app/_layout.tsx`:
   ```typescript
   <SuperwallProvider
     apiKeys={{ ios: "YOUR_ACTUAL_API_KEY" }}
   >
   ```
4. Create a paywall with placement ID: `"pro_upgrade"`

### 3. Run the App
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## 🔌 Backend Integration Points

The app is fully functional with local storage. To enable cloud sync and AI features, integrate these backend endpoints:

### Required Endpoints:

1. **AI Affirmation Generation**
   - Endpoint: `POST /api/affirmations/generate`
   - Uses: OpenAI GPT-5.2
   - Location: `app/(tabs)/(home)/index.tsx` - `generateAffirmation()`

2. **Photo Upload**
   - Endpoint: `POST /api/photos/upload`
   - Uses: Multipart file upload
   - Location: `app/(tabs)/(home)/index.tsx` - `pickImage()`

3. **Habits Sync**
   - Endpoints:
     - `GET /api/habits` - Fetch user habits
     - `POST /api/habits` - Create habit
     - `PUT /api/habits/:id` - Update habit
     - `DELETE /api/habits/:id` - Delete habit
   - Location: `app/(tabs)/(home)/index.tsx` - `loadData()`, `toggleHabit()`

4. **Progress Data**
   - Endpoints:
     - `GET /api/progress` - Fetch streaks, badges, calendar
     - `POST /api/progress/day` - Mark day complete
   - Location: `app/(tabs)/profile.tsx` - `loadProgressData()`

5. **Affirmations Database**
   - Endpoint: `GET /api/affirmations/top500`
   - Returns: Top 500 affirmations for offline storage
   - Location: `utils/affirmations.ts` - `loadAffirmationsOffline()`

All backend integration points are marked with `// TODO: Backend Integration` comments.

## 📂 Project Structure

```
app/
├── (tabs)/
│   ├── (home)/
│   │   └── index.tsx          # Journal & Habits screen
│   ├── _layout.tsx            # Tab navigation
│   └── profile.tsx            # Progress screen
├── _layout.tsx                # Root layout with Superwall
components/
├── FloatingTabBar.tsx         # Custom tab bar
├── IconSymbol.tsx             # Cross-platform icons
└── ...
hooks/
└── usePremium.ts              # Superwall premium hook
types/
└── index.ts                   # TypeScript types
utils/
├── affirmations.ts            # Affirmations data
└── sounds.ts                  # Haptic feedback
styles/
└── commonStyles.ts            # App colors & styles
```

## 🎨 Color Palette

```typescript
colors = {
  primary: '#4F46E5',        // Indigo
  secondary: '#7DD3FC',      // Sky blue
  accent: '#10B981',         // Green (completed)
  accentGlow: '#10B98140',   // Soft green glow
  error: '#EF4444',          // Red (missed)
  background: '#FFFFFF',     // Pure white
  card: '#FFFFFF',           // White cards
  text: '#1F2937',           // Dark gray
  textSecondary: '#6B7280',  // Secondary gray
  iconSilver: '#9CA3AF',     // Silver icons
  border: '#E5E7EB',         // Light border
}
```

## 🚀 Features Roadmap

- [x] Journal entry with photos
- [x] Daily affirmations (custom + AI)
- [x] Habit tracking (3 free, 10 pro)
- [x] Progress calendar
- [x] Streak tracking
- [x] Achievement badges
- [x] Superwall integration
- [ ] Backend API integration
- [ ] Cloud sync
- [ ] Favorite affirmations
- [ ] Habit categories
- [ ] Export journal entries
- [ ] Dark mode optimization
- [ ] Widget support

## 📝 Notes

- **Offline-first**: App works fully offline with AsyncStorage
- **Haptic feedback**: Soft chimes simulated with haptics
- **Responsive**: Works on iOS, Android, and Web
- **Accessible**: Proper contrast ratios and touch targets
- **Performant**: Optimized animations and list rendering

## 🎯 User Experience

1. **First Launch**:
   - See default 3 habits
   - Generate first affirmation
   - Start journaling immediately

2. **Daily Flow**:
   - Open app → See today's affirmation
   - Write journal entry
   - Check off habits (hear/feel chime)
   - View progress

3. **Upgrade Flow**:
   - Hit 5 affirmation limit → Paywall
   - Want more habits → Paywall
   - Smooth Superwall experience

## 🔐 Privacy

- All data stored locally by default
- Photos stored on device
- Optional cloud sync (when backend connected)
- No tracking or analytics (add if needed)

## 📄 License

Built with Natively - Your AI-powered React Native development platform.

---

**Ready to build better habits? Start journaling today! ✨**
