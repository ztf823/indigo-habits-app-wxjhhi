# Indigo Habits Backend

A production-ready backend for the Indigo Habits app - a comprehensive habit tracking and journaling application with AI-powered affirmations.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server (uses PGlite locally)
npm start

# TypeScript check
npm run typecheck

# Build
npm run build
```

### Production
```bash
# Deploy with DATABASE_URL and STORAGE_API_BASE_URL set
npm run build
npm start
```

## Features

### Core Features
- **Habit Tracking** - Create, track, and complete daily habits
- **Journaling** - Write journal entries with photo attachments
- **Affirmations** - Daily affirmations with AI generation (GPT-5.2)
- **Progress Tracking** - Streaks, badges, and analytics
- **Profile Management** - User profiles with picture uploads

### Authentication
- Email/password signup and login
- Google OAuth
- Apple OAuth
- GitHub OAuth
- Email verification

### Business Logic
- **Free Tier**: 3 habits, 5 AI affirmations
- **Pro Tier**: 10 habits, unlimited affirmations
- **Streaks**: Consecutive days with all habits completed
- **Badges**: Auto-awards for milestones (7-day, 30-day, 100/500/1000 completions)
- **Smart Affirmations**: Prioritizes repeating > favorites > defaults for daily routine

## API Documentation

### Profile Management
```
GET    /api/profile                    Get user profile
PUT    /api/profile                    Update profile
POST   /api/profile/picture            Upload profile picture
DELETE /api/profile/picture            Delete profile picture
```

### Journal Entries
```
POST   /api/journal-entries            Create entry
GET    /api/journal-entries            List entries
PUT    /api/journal-entries/:id        Update entry
DELETE /api/journal-entries/:id        Delete entry
POST   /api/journal-entries/:id/favorite Toggle favorite
POST   /api/upload/photo               Upload photo
```

### Affirmations
```
GET    /api/affirmations/daily         Get 3 daily affirmations
POST   /api/affirmations/generate      Generate with AI
POST   /api/affirmations/custom        Create custom
GET    /api/affirmations               List all
GET    /api/affirmations/favorites     List favorites
POST   /api/affirmations/:id/favorite  Toggle favorite
GET    /api/affirmations/repeating     List repeating
POST   /api/affirmations/:id/repeat    Toggle repeating
```

### Habits
```
POST   /api/habits                     Create habit
GET    /api/habits                     List habits
PUT    /api/habits/:id                 Update habit
DELETE /api/habits/:id                 Delete habit
POST   /api/habits/:id/complete        Mark complete
GET    /api/habits/completions         Get completions
POST   /api/habits/:id/favorite        Toggle favorite
```

### Progress
```
GET    /api/progress                   Get stats
GET    /api/progress/calendar          Get calendar view
POST   /api/progress/calculate         Recalculate streaks
```

### Authentication
```
POST   /api/auth/sign-up/email         Register
POST   /api/auth/sign-in/email         Login
POST   /api/auth/sign-in/social        OAuth
POST   /api/auth/sign-out              Logout
GET    /api/auth/get-session           Get session
```

Full API documentation available at:
- `GET /api/auth/open-api/generate-schema` - OpenAPI spec
- `GET /api/auth/reference` - Interactive docs

## Database

### Tables
- `user` - User profiles (Better Auth)
- `session` - User sessions (Better Auth)
- `account` - OAuth accounts (Better Auth)
- `verification` - Email verification (Better Auth)
- `journalEntries` - Journal entries
- `defaultAffirmations` - 500 pre-loaded affirmations
- `affirmations` - User affirmations
- `habits` - User habits
- `habitCompletions` - Daily habit tracking
- `userProgress` - Streaks, badges, stats

### Schema
```sql
-- All tables have:
- Proper indexes on frequently queried columns
- Foreign key relationships with cascade deletes
- Timezone-aware timestamps
- Auto-generated UUIDs
- Proper constraints (unique, not-null)
```

## File Structure

```
src/
├── index.ts                 Main entry point
├── db/
│   ├── schema.ts           App schema (Drizzle ORM)
│   ├── auth-schema.ts      Better Auth schema
│   ├── seed.ts             Default affirmations seed
│   ├── seed-affirmations.ts 500 affirmations data
│   └── migrate.ts          Migration utilities
└── routes/
    ├── profile.ts          Profile management
    ├── journal.ts          Journal entries
    ├── affirmations.ts     Affirmations
    ├── habits.ts           Habits
    └── progress.ts         Progress & analytics
```

## Environment Variables

Required for production:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
STORAGE_API_BASE_URL=https://s3-endpoint.com
```

Optional (auto-configured):
```
NODE_ENV=production
```

## Technology Stack

- **Framework**: Fastify + Specular framework
- **Database**: PostgreSQL (Neon in production)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth
- **Storage**: S3
- **AI**: Vercel AI SDK + OpenAI GPT-5.2
- **Language**: TypeScript

## Key Features

### Security
✅ All endpoints require authentication
✅ Row-level security (users only access own data)
✅ Better Auth handles password security
✅ File uploads validated (type & size)
✅ Secure file paths with user ID isolation
✅ Signed URLs for file access

### Performance
✅ Database indexes on all key columns
✅ Pagination on list endpoints
✅ Efficient queries with Drizzle ORM
✅ Cascading deletes for referential integrity
✅ Soft deletes to preserve history

### Reliability
✅ Proper error handling
✅ Comprehensive logging
✅ Type-safe TypeScript
✅ Input validation
✅ Database constraints

### Scalability
✅ Stateless API (no session storage)
✅ Database agnostic
✅ File storage abstracted
✅ Horizontal scaling ready

## Testing

### Local Development
```bash
# Uses PGlite (embedded PostgreSQL)
npm start

# Test with curl
curl http://localhost:3000/api/auth/ok

# Create test account via OAuth or email
# Then test endpoints with auth token
```

### Production Testing
```bash
# Deploy to production
# All OAuth providers work via framework proxy
# No additional config needed
```

## Deployment

### Neon PostgreSQL
1. Create Neon project
2. Get connection string
3. Set `DATABASE_URL` environment variable
4. Deploy application
5. Migrations run automatically on startup

### File Storage
1. Configure S3 or compatible storage
2. Set `STORAGE_API_BASE_URL` environment variable
3. Framework handles signed URLs automatically

### Health Check
```bash
curl https://api.example.com/api/auth/ok
# Should return 200 OK
```

## Monitoring

Monitor these metrics:
- API response time (target: < 200ms)
- Database query time (target: < 50ms)
- File upload time (target: < 2s)
- Authentication success rate
- Error rate and logs

## Support & Documentation

For detailed information, see:
- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification

## License

© 2024 Indigo Habits. All rights reserved.

## Status

✅ **Production Ready**

All features implemented and tested. Ready for deployment.
