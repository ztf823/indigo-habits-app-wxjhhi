
# Backend Setup Checklist for Indigo Habits

## 📋 Overview

The Indigo Habits app requires a backend API with SQLite database, BetterAuth authentication, and OpenAI integration. This checklist will guide you through setting up the backend.

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify (recommended) or Express
- **Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM (recommended)
- **Authentication**: BetterAuth
- **AI**: OpenAI GPT-5.2
- **File Storage**: Local filesystem or S3-compatible storage

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^8.x",
    "@fastify/multipart": "^7.x",
    "better-auth": "^1.4.10",
    "better-sqlite3": "^9.x",
    "drizzle-orm": "^0.29.x",
    "openai": "^4.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.x",
    "@types/better-sqlite3": "^7.x",
    "@types/node": "^20.x",
    "typescript": "^5.x"
  }
}
```

## 🗄️ Database Schema

### 1. Users Table (BetterAuth)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  emailVerified BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Affirmations Table
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

CREATE INDEX idx_affirmations_userId ON affirmations(userId);
CREATE INDEX idx_affirmations_isRepeating ON affirmations(isRepeating);
```

### 3. Habits Table
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

CREATE INDEX idx_habits_userId ON habits(userId);
CREATE INDEX idx_habits_isActive ON habits(isActive);
```

### 4. Habit Completions Table
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

CREATE INDEX idx_habitCompletions_userId ON habitCompletions(userId);
CREATE INDEX idx_habitCompletions_completedAt ON habitCompletions(completedAt);
```

### 5. Journal Entries Table
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

CREATE INDEX idx_journalEntries_userId ON journalEntries(userId);
CREATE INDEX idx_journalEntries_createdAt ON journalEntries(createdAt);
```

### 6. Profiles Table
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  profilePictureUrl TEXT,
  isPro BOOLEAN DEFAULT 0,
  affirmationCount INTEGER DEFAULT 0,
  lastAffirmationDate DATE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_userId ON profiles(userId);
```

## 🔐 BetterAuth Configuration

### Environment Variables
```env
# Database
DATABASE_URL=./data/indigo-habits.db

# BetterAuth
SESSION_SECRET=your-super-secret-session-key-change-this
BETTER_AUTH_URL=https://your-backend-url.com

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App
PORT=3000
NODE_ENV=production
```

### BetterAuth Setup
```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database(process.env.DATABASE_URL),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

## 🤖 OpenAI Integration

### Affirmation Generation
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAffirmation(): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates inspiring, positive affirmations for personal growth and motivation.",
      },
      {
        role: "user",
        content: "Generate a single inspiring, positive affirmation for personal growth and motivation. Keep it under 20 words. Return only the affirmation text, no quotes or extra formatting.",
      },
    ],
    max_tokens: 50,
    temperature: 0.9,
  });

  return completion.choices[0].message.content?.trim() || "You are capable of amazing things.";
}
```

## 📝 API Endpoints Checklist

### Authentication
- [ ] POST `/api/auth/sign-in/email` - Email/password sign in
- [ ] POST `/api/auth/sign-up/email` - Email/password sign up
- [ ] GET `/api/auth/session` - Get current session
- [ ] POST `/api/auth/sign-out` - Sign out
- [ ] GET `/api/auth/google` - Google OAuth
- [ ] GET `/api/auth/apple` - Apple OAuth
- [ ] GET `/api/auth/github` - GitHub OAuth

### Affirmations
- [ ] GET `/api/affirmations/daily` - Get daily affirmations
- [ ] POST `/api/affirmations/generate` - Generate AI affirmation
- [ ] POST `/api/affirmations/custom` - Create custom affirmation
- [ ] POST `/api/affirmations/:id/favorite` - Toggle favorite
- [ ] POST `/api/affirmations/:id/repeat` - Toggle repeating
- [ ] PATCH `/api/affirmations/:id/order` - Update order
- [ ] DELETE `/api/affirmations/:id` - Delete affirmation
- [ ] GET `/api/affirmations/history` - Get history
- [ ] GET `/api/affirmations/favorites` - Get favorites

### Habits
- [ ] GET `/api/habits` - Get user's habits
- [ ] POST `/api/habits` - Create habit
- [ ] PUT `/api/habits/:id` - Update habit
- [ ] DELETE `/api/habits/:id` - Delete habit (soft delete)
- [ ] POST `/api/habits/:id/complete` - Toggle completion
- [ ] GET `/api/habits/completions` - Get completions

### Journal Entries
- [ ] GET `/api/journal-entries` - Get all entries
- [ ] GET `/api/journal-entries/:id` - Get single entry
- [ ] POST `/api/journal-entries` - Create/update entry
- [ ] POST `/api/journal-entries/:id/favorite` - Toggle favorite
- [ ] DELETE `/api/journal-entries/:id` - Delete entry

### Profile
- [ ] GET `/api/profile` - Get user profile
- [ ] POST `/api/profile/picture` - Upload profile picture
- [ ] PATCH `/api/profile` - Update profile

### Progress
- [ ] GET `/api/progress` - Get progress data

### Upload
- [ ] POST `/api/upload/photo` - Upload photo

## 🔒 Security Checklist

- [ ] CORS configured for app domain and scheme
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] File upload size limits
- [ ] File type validation for uploads
- [ ] Authentication required on protected routes
- [ ] Session security (httpOnly cookies)
- [ ] Environment variables secured
- [ ] Database backups configured

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] OAuth providers configured
- [ ] OpenAI API key valid
- [ ] CORS configured for production domain
- [ ] Error logging configured
- [ ] Health check endpoint created

### Deployment Options
1. **Railway** (Recommended)
   - Easy deployment
   - Automatic HTTPS
   - Built-in database backups
   - Free tier available

2. **Render**
   - Free tier available
   - Automatic deployments
   - Built-in SSL

3. **Fly.io**
   - Global edge deployment
   - Free tier available
   - SQLite-friendly

4. **AWS**
   - Most scalable
   - Requires more setup
   - Use EC2 + RDS or Lambda + DynamoDB

### Post-Deployment
- [ ] Test all API endpoints
- [ ] Verify authentication works
- [ ] Test OAuth flows
- [ ] Verify AI generation works
- [ ] Test file uploads
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure backup schedule

## 📊 Business Logic

### User Limits
```typescript
const FREE_HABIT_LIMIT = 3;
const PRO_HABIT_LIMIT = 10;
const FREE_AFFIRMATION_LIMIT = 5; // per day
```

### Streak Calculation
A day counts toward streak if:
1. User has at least 1 active habit
2. User completed ALL active habits that day

### Badges
- **First Step**: Complete first habit
- **Week Warrior**: 7-day streak
- **Month Master**: 30-day streak
- **Perfect Week**: Complete all habits for 7 consecutive days
- **Perfect Month**: Complete all habits for 30 consecutive days
- **Century Club**: 100 total completions

## 🧪 Testing

### Test Endpoints
```bash
# Health check
curl https://your-backend.com/health

# Sign up
curl -X POST https://your-backend.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Generate affirmation
curl -X POST https://your-backend.com/api/affirmations/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 📝 Final Steps

1. **Deploy Backend**
   - Choose hosting provider
   - Set environment variables
   - Deploy code
   - Run migrations

2. **Get Backend URL**
   - Note the production URL (e.g., `https://your-app.railway.app`)

3. **Update Frontend**
   - Add backend URL to `app.json`:
     ```json
     {
       "expo": {
         "extra": {
           "backendUrl": "https://your-app.railway.app"
         }
       }
     }
     ```

4. **Rebuild App**
   - Run `eas build --platform all --profile production`

5. **Test Everything**
   - Sign up / sign in
   - Create habits
   - Generate affirmations
   - Add journal entries
   - Upload photos
   - Check progress

## ✅ Ready for Production

Once all items are checked:
- ✅ Database schema created
- ✅ BetterAuth configured
- ✅ OpenAI integrated
- ✅ All API endpoints implemented
- ✅ Security measures in place
- ✅ Backend deployed
- ✅ Frontend updated with backend URL
- ✅ App rebuilt and tested

You're ready to submit to the app stores! 🚀

## 📞 Need Help?

- **BetterAuth Docs**: https://www.better-auth.com/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Fastify Docs**: https://www.fastify.io/docs

Good luck with your backend setup! 🎉
