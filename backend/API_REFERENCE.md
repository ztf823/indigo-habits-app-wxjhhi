# Indigo Habits API Reference

Complete API documentation for the Indigo Habits backend.

## Base URL
```
https://api.example.com
```

## Authentication

All endpoints (except OAuth signup/login) require authentication via Better Auth session tokens.

### Login
```
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response: 200 OK
{
  "user": { "id", "email", "name", "image" },
  "session": { "token" }
}
```

### OAuth
```
POST /api/auth/sign-in/social
Content-Type: application/json

{
  "provider": "google|apple|github",
  "callbackURL": "https://app.example.com/callback"
}

Response: 200 OK (or redirect to OAuth provider)
```

### Get Current Session
```
GET /api/auth/get-session

Response: 200 OK
{
  "user": { "id", "email", "name", "image" },
  "session": { "expiresAt" }
}
```

### Logout
```
POST /api/auth/sign-out

Response: 200 OK
```

---

## Profile Endpoints

### Get User Profile
```
GET /api/profile

Response: 200 OK
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "profilePictureUrl": "https://signed-url.com/picture.jpg",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update Profile
```
PUT /api/profile
Content-Type: application/json

{
  "name": "Jane Doe",
  "profilePictureUrl": "https://signed-url.com/new-picture.jpg"
}

Response: 200 OK
{
  "id": "user123",
  "name": "Jane Doe",
  "email": "john@example.com",
  "profilePictureUrl": "https://signed-url.com/new-picture.jpg"
}
```

### Upload Profile Picture
```
POST /api/profile/picture
Content-Type: multipart/form-data

File: image.jpg (jpg, png, webp, max 5MB)

Response: 200 OK
{
  "url": "https://signed-url.com/profiles/user123/picture-1234567890.jpg",
  "key": "profiles/user123/picture-1234567890.jpg"
}
```

### Delete Profile Picture
```
DELETE /api/profile/picture

Response: 204 No Content
```

---

## Journal Entry Endpoints

### Create Journal Entry
```
POST /api/journal-entries
Content-Type: application/json

{
  "content": "Today was a great day...",
  "photoUrl": "https://signed-url.com/photo.jpg"
}

Response: 201 Created
{
  "id": "entry123",
  "userId": "user123",
  "content": "Today was a great day...",
  "photoUrl": "https://signed-url.com/photo.jpg",
  "isFavorite": false,
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### List Journal Entries
```
GET /api/journal-entries?limit=10&offset=0

Response: 200 OK
{
  "entries": [
    {
      "id": "entry123",
      "content": "...",
      "photoUrl": "...",
      "isFavorite": false,
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 42
}
```

### Get Single Entry
```
GET /api/journal-entries/:id

Response: 200 OK
{
  "id": "entry123",
  "content": "...",
  ...
}
```

### Update Entry
```
PUT /api/journal-entries/:id
Content-Type: application/json

{
  "content": "Updated content",
  "photoUrl": "https://signed-url.com/new-photo.jpg"
}

Response: 200 OK
{ updated entry }
```

### Delete Entry
```
DELETE /api/journal-entries/:id

Response: 204 No Content
```

### Toggle Favorite
```
POST /api/journal-entries/:id/favorite

Response: 200 OK
{
  "id": "entry123",
  "isFavorite": true
}
```

### Upload Photo
```
POST /api/upload/photo
Content-Type: multipart/form-data

File: photo.jpg (any image format, max 10MB)

Response: 200 OK
{
  "url": "https://signed-url.com/journal/user123/1234567890-photo.jpg",
  "key": "journal/user123/1234567890-photo.jpg"
}
```

---

## Affirmation Endpoints

### Get Daily Affirmations
```
GET /api/affirmations/daily

Response: 200 OK
[
  {
    "id": "aff123",
    "text": "You are capable of amazing things",
    "isCustom": false,
    "isRepeating": false
  },
  {
    "id": "aff456",
    "text": "Today is full of possibilities",
    "isCustom": true,
    "isRepeating": true
  },
  {
    "id": "aff789",
    "text": "I choose to be grateful",
    "isCustom": true,
    "isRepeating": false
  }
]
```

### Generate Affirmation (AI)
```
POST /api/affirmations/generate
Content-Type: application/json

{
  "prompt": "Create an affirmation about confidence"
}

Response: 201 Created
{
  "id": "aff123",
  "text": "I am confident in my abilities",
  "isCustom": true
}

Error (429):
{
  "error": "Free users limited to 5 generated affirmations. Upgrade to Pro for unlimited."
}
```

### Create Custom Affirmation
```
POST /api/affirmations/custom
Content-Type: application/json

{
  "text": "I am strong and resilient"
}

Response: 201 Created
{
  "id": "aff123",
  "text": "I am strong and resilient",
  "isCustom": true,
  "isRepeating": false
}
```

### List All Affirmations
```
GET /api/affirmations?limit=20&offset=0

Response: 200 OK
{
  "affirmations": [
    { "id", "text", "isCustom", "isFavorite" }
  ],
  "total": 523
}
```

### List Favorite Affirmations
```
GET /api/affirmations/favorites?limit=20&offset=0

Response: 200 OK
{
  "affirmations": [
    { "id", "text", "isCustom" }
  ],
  "total": 12
}
```

### Toggle Favorite
```
POST /api/affirmations/:id/favorite

Response: 200 OK
{
  "id": "aff123",
  "isFavorite": true
}
```

### List Repeating Affirmations
```
GET /api/affirmations/repeating?limit=20&offset=0

Response: 200 OK
{
  "affirmations": [
    { "id", "text", "isRepeating" }
  ],
  "total": 3
}
```

### Toggle Repeating
```
POST /api/affirmations/:id/repeat

Response: 200 OK
{
  "id": "aff123",
  "isRepeating": true
}
```

---

## Habit Endpoints

### Create Habit
```
POST /api/habits
Content-Type: application/json

{
  "title": "Morning Meditation",
  "color": "#FF5733"
}

Response: 201 Created
{
  "id": "habit123",
  "userId": "user123",
  "title": "Morning Meditation",
  "color": "#FF5733",
  "isActive": true,
  "isFavorite": false,
  "sortOrder": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}

Error (429):
{
  "error": "Habit limit reached. Free users: 3, Pro users: 10"
}
```

### List Active Habits
```
GET /api/habits

Response: 200 OK
[
  {
    "id": "habit123",
    "title": "Morning Meditation",
    "color": "#FF5733",
    "isActive": true,
    "isFavorite": false,
    "sortOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Update Habit
```
PUT /api/habits/:id
Content-Type: application/json

{
  "title": "Meditation & Yoga",
  "color": "#33FF57",
  "isActive": true
}

Response: 200 OK
{ updated habit }
```

### Delete Habit (Soft Delete)
```
DELETE /api/habits/:id

Response: 204 No Content

Note: Sets isActive to false, preserves completion history
```

### Mark Habit Complete
```
POST /api/habits/:id/complete
Content-Type: application/json

{
  "completed": true,
  "date": "2024-01-01"
}

Response: 200 OK
{
  "id": "completion123",
  "habitId": "habit123",
  "completionDate": "2024-01-01",
  "completed": true,
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### Get Completions
```
GET /api/habits/completions?startDate=2024-01-01&endDate=2024-01-31&habitId=habit123

Response: 200 OK
{
  "completions": [
    {
      "id": "completion123",
      "habitId": "habit123",
      "completionDate": "2024-01-01",
      "completed": true,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Toggle Favorite
```
POST /api/habits/:id/favorite

Response: 200 OK
{
  "id": "habit123",
  "isFavorite": true
}
```

---

## Progress Endpoints

### Get User Progress
```
GET /api/progress

Response: 200 OK
{
  "currentStreak": 7,
  "longestStreak": 30,
  "totalCompletions": 145,
  "isPro": false,
  "badges": [
    {
      "id": "7day",
      "name": "7-Day Streak",
      "description": "Completed all habits for 7 consecutive days",
      "earned": true
    },
    {
      "id": "30day",
      "name": "Monthly Master",
      "description": "Completed all habits for 30 consecutive days",
      "earned": true
    },
    {
      "id": "100completions",
      "name": "100 Completions",
      "description": "Achieved 100 total habit completions",
      "earned": true
    }
  ]
}
```

### Get Calendar View
```
GET /api/progress/calendar?month=1&year=2024

Response: 200 OK
{
  "month": 1,
  "year": 2024,
  "calendar": [
    {
      "date": "2024-01-01",
      "completed": 2,
      "total": 3,
      "percentage": 67
    },
    {
      "date": "2024-01-02",
      "completed": 3,
      "total": 3,
      "percentage": 100
    }
  ]
}
```

### Recalculate Progress
```
POST /api/progress/calculate

Response: 200 OK
{
  "currentStreak": 7,
  "longestStreak": 30,
  "totalCompletions": 145,
  "badgesAwarded": ["7day", "30day"]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid file type. Allowed types: jpg, png, webp"
}
```

### 404 Not Found
```json
{
  "error": "Habit not found"
}
```

### 413 Payload Too Large
```json
{
  "error": "File too large (max 5MB)"
}
```

### 429 Too Many Requests
```json
{
  "error": "Free users limited to 5 generated affirmations. Upgrade to Pro for unlimited."
}
```

### 500 Server Error
```json
{
  "error": "Upload failed"
}
```

---

## Pagination

List endpoints support pagination:

```
GET /api/journal-entries?limit=10&offset=0

Query Parameters:
- limit: Number of results (default: varies, max: 100)
- offset: Starting position (default: 0)

Response includes:
{
  "items": [...],
  "total": 42
}
```

---

## Rate Limiting

**Free Users**:
- 5 AI-generated affirmations total
- 3 habits maximum
- No explicit rate limits on API calls

**Pro Users**:
- Unlimited AI-generated affirmations
- 10 habits maximum
- No explicit rate limits on API calls

---

## Data Types

### Timestamps
All timestamps are ISO 8601 with timezone:
```
2024-01-01T12:00:00Z
2024-01-01T12:00:00+00:00
```

### IDs
- User ID: Text (from Better Auth)
- Resource IDs: UUID v4 (auto-generated)

### Colors
Hex color codes: `#FF5733`

### Dates
Date strings: `2024-01-01` (YYYY-MM-DD)

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Successful delete |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File too big |
| 429 | Too Many Requests - Limit exceeded |
| 500 | Server Error - Internal error |

---

## Examples

### Complete Workflow

1. **Sign up with email**
```bash
curl -X POST https://api.example.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'
```

2. **Create habit**
```bash
curl -X POST https://api.example.com/api/habits \
  -H "Content-Type: application/json" \
  -H "Cookie: session=token..." \
  -d '{"title":"Morning Run","color":"#FF5733"}'
```

3. **Mark habit complete**
```bash
curl -X POST https://api.example.com/api/habits/habit123/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: session=token..." \
  -d '{"completed":true,"date":"2024-01-01"}'
```

4. **Get daily affirmations**
```bash
curl -X GET https://api.example.com/api/affirmations/daily \
  -H "Cookie: session=token..."
```

5. **Check progress**
```bash
curl -X GET https://api.example.com/api/progress \
  -H "Cookie: session=token..."
```

---

## Support

For issues or questions:
1. Check API documentation
2. Review error messages
3. Check server logs
4. Contact support

---

**Last Updated**: 2024
**API Version**: 1.0.0
**Status**: Production Ready
