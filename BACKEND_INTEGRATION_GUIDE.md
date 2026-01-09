
# Backend Integration Guide for Indigo Habits

## 🔧 Backend Setup

The Indigo Habits app requires a backend API with SQLite database. The backend should be built separately and deployed before creating production builds.

## 📊 Database Schema

### Required Tables

#### 1. users (managed by BetterAuth)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. affirmations
```sql
CREATE TABLE affirmations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  text TEXT NOT NULL,
  isCustom BOOLEAN DEFAULT 0,
  isFavorite BOOLEAN DEFAULT 0,
  isRepeating BOOLEAN DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. habits
```sql
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 4. habitCompletions
```sql
CREATE TABLE habitCompletions (
  id TEXT PRIMARY KEY,
  habitId TEXT NOT NULL,
  userId TEXT NOT NULL,
  completedAt DATE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(habitId, completedAt)
);
```

#### 5. journalEntries
```sql
CREATE TABLE journalEntries (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  content TEXT,
  photoUrl TEXT,
  affirmation TEXT,
  isFavorite BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 6. profiles
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  profilePictureUrl TEXT,
  isPro BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔌 Required API Endpoints

### Authentication (BetterAuth)
- POST `/api/auth/sign-in/email` - Email/password sign in
- POST `/api/auth/sign-up/email` - Email/password sign up
- GET `/api/auth/session` - Get current session
- POST `/api/auth/sign-out` - Sign out
- GET `/api/auth/google` - Google OAuth
- GET `/api/auth/apple` - Apple OAuth
- GET `/api/auth/github` - GitHub OAuth

### Affirmations
- GET `/api/affirmations/daily` - Get daily affirmations (max 3)
- POST `/api/affirmations/generate` - Generate AI affirmation
- POST `/api/affirmations/custom` - Create custom affirmation
- PATCH `/api/affirmations/:id/favorite` - Toggle favorite
- PATCH `/api/affirmations/:id/repeat` - Toggle repeating
- PATCH `/api/affirmations/:id/order` - Update order
- DELETE `/api/affirmations/:id` - Delete affirmation
- GET `/api/affirmations/history` - Get affirmation history
- GET `/api/affirmations/favorites` - Get favorite affirmations

### Habits
- GET `/api/habits` - Get user's habits
- POST `/api/habits` - Create habit
- PUT `/api/habits/:id` - Update habit
- DELETE `/api/habits/:id` - Delete habit
- POST `/api/habits/:id/complete` - Toggle completion
- GET `/api/habits/completions` - Get completions (query: startDate, endDate)

### Journal Entries
- GET `/api/journal-entries` - Get all entries
- GET `/api/journal-entries/:id` - Get single entry
- POST `/api/journal-entries` - Create/update entry
- PATCH `/api/journal-entries/:id/favorite` - Toggle favorite
- DELETE `/api/journal-entries/:id` - Delete entry

### Profile
- GET `/api/profile` - Get user profile
- POST `/api/profile/picture` - Upload profile picture
- PATCH `/api/profile` - Update profile

### Progress
- GET `/api/progress` - Get progress data (streaks, badges, calendar)

### Upload
- POST `/api/upload/photo` - Upload photo for journal entries

## 🤖 AI Integration

### OpenAI GPT-5.2
The backend should integrate with OpenAI for affirmation generation:

```javascript
// Example prompt for affirmation generation
const prompt = "Generate a single inspiring, positive affirmation for personal growth and motivation. Keep it under 20 words. Return only the affirmation text.";
```

**Requirements:**
- Use GPT-5.2 model
- Keep affirmations under 20 words
- Return only the affirmation text (no extra formatting)
- Track usage per user (free: 5/day, pro: unlimited)

## 🔐 Authentication Flow

### Web (Popup Flow)
1. User clicks social auth button
2. Opens popup window to OAuth provider
3. After auth, redirects to `/auth-callback`
4. Callback extracts token and closes popup
5. Main window receives token via postMessage
6. Token stored in localStorage

### Native (Deep Linking)
1. User clicks social auth button
2. Opens browser to OAuth provider
3. After auth, redirects to `natively://auth-callback`
4. App handles deep link
5. Token extracted and stored in SecureStore

## 📝 Business Logic

### User Limits
- **Free Users:**
  - Max 3 habits
  - Max 5 AI-generated affirmations per day
  - Max 3 affirmations displayed on home

- **Pro Users:**
  - Max 10 habits
  - Unlimited AI-generated affirmations
  - Max 3 affirmations displayed on home

### Streak Calculation
A day counts toward streak if:
- User has at least 1 active habit
- User completed ALL active habits that day

### Badges
- **First Step**: Complete first habit
- **Week Warrior**: 7-day streak
- **Month Master**: 30-day streak
- **Perfect Week**: Complete all habits for 7 days
- **Perfect Month**: Complete all habits for 30 days
- **Century Club**: 100 total completions

## 🔄 Data Synchronization

### Auto-save Journal Entries
- Frontend debounces saves (2 seconds)
- POST to `/api/journal-entries` with content and photoUrl
- Backend creates or updates entry for current day

### Habit Completion Toggle
- POST to `/api/habits/:id/complete`
- Backend checks if completion exists for today
- If exists: delete (mark incomplete)
- If not exists: create (mark complete)

### Affirmation Order
- Frontend allows reordering (0, 1, 2)
- PATCH to `/api/affirmations/:id/order` with new order
- Backend updates order field

## 🌐 CORS Configuration

Allow requests from:
- `natively://` (native app scheme)
- Your web domain (if deploying web version)

Enable credentials for authentication cookies.

## 📦 Deployment

### Backend URL Configuration
After deploying the backend, update `app.json`:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://your-backend-url.com"
    }
  }
}
```

Then rebuild the app with the new backend URL.

## 🧪 Testing

### Test Endpoints
Use these test cases to verify backend functionality:

1. **Authentication**
   - Sign up with email/password
   - Sign in with email/password
   - Sign in with Google/Apple/GitHub
   - Get session
   - Sign out

2. **Affirmations**
   - Generate AI affirmation
   - Create custom affirmation
   - Toggle favorite
   - Toggle repeating
   - Reorder affirmations
   - Delete affirmation

3. **Habits**
   - Create habit
   - Update habit
   - Toggle completion
   - Delete habit
   - Get completions for date range

4. **Journal**
   - Create entry
   - Upload photo
   - Update entry
   - Toggle favorite
   - Delete entry

5. **Progress**
   - Calculate streaks
   - Award badges
   - Generate calendar data

## 🔍 Error Handling

Return proper HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (not signed in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

Include error messages in response body:
```json
{
  "error": "User has reached free tier limit of 3 habits"
}
```

## 📊 Monitoring

Track these metrics:
- API response times
- Error rates
- Authentication success/failure rates
- AI affirmation generation usage
- User sign-ups and active users
- Habit completion rates

## 🚀 Next Steps

1. Build and deploy backend with SQLite database
2. Configure BetterAuth with OAuth providers
3. Integrate OpenAI GPT-5.2 for affirmations
4. Test all API endpoints
5. Update `app.json` with backend URL
6. Create production builds
7. Submit to App Store and Play Store

For frontend integration details, see the code in:
- `utils/api.ts` - API utilities
- `lib/auth.ts` - Authentication client
- `contexts/AuthContext.tsx` - Auth state management
- `app/(tabs)/(home)/index.tsx` - Home screen with API calls
- `app/(tabs)/habits.tsx` - Habits management
- `app/(tabs)/history.tsx` - History and favorites
- `app/(tabs)/profile.tsx` - Profile management
- `app/(tabs)/progress.tsx` - Progress tracking
