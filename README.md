# Astronacci Membership App

A fullstack membership-based web application with tiered content access, OAuth authentication, and quota management.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edit the .env files with your credentials

# 3. Start development servers
npm run dev
```

The API will be running at `http://localhost:3001` and the web app at `http://localhost:3000`.

## Project Structure

```
astronacci/
├── apps/
│   ├── api/          # Express.js backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types and constants
├── .env.example      # Environment variables template
└── package.json      # Root workspace config
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Express.js, TypeScript |
| Database | Firebase Firestore |
| Auth | Google OAuth, Facebook OAuth, Email/Password |
| Session | HttpOnly cookies, server-side tokens |

## Features

### Membership Tiers

| Type | Articles | Videos |
|------|----------|--------|
| A (default) | 3 | 3 |
| B | 10 | 10 |
| C | Unlimited | Unlimited |

### Authentication
- Google OAuth 2.0
- Facebook OAuth
- Email/password registration
- Secure session management with HttpOnly cookies

### Content Access
- Quota-enforced article and video access
- Re-access previously viewed content without consuming quota
- Usage tracking per user

## Prerequisites

- Node.js 18+ and npm 9+
- Firebase project with Firestore enabled
- Google OAuth credentials (for Google sign-in)
- Facebook App credentials (for Facebook sign-in)

## Detailed Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd astronacci
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing one
   - Enable Firestore Database (start in **production mode**)

2. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely (never commit to git)

3. **Deploy Firestore Security Rules**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Login and deploy rules
   firebase login
   firebase deploy --only firestore:rules
   ```

   Or manually set rules in Firebase Console → Firestore → Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Navigate to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 4. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or use existing one
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:3001/api/auth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

### 5. Environment Variables

**Backend (`apps/api/.env`):**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Session
SESSION_SECRET=your-secure-random-string-minimum-32-characters
SESSION_MAX_AGE=604800000
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 6. Seed Sample Data

```bash
# Seed articles and videos
npm run seed -w @astronacci/api

# Clear seeded content
npm run seed:clear -w @astronacci/api
```

## Development

### Available Scripts

```bash
# Start all apps in development mode
npm run dev

# Run API only
npm run dev -w @astronacci/api

# Run Web only
npm run dev -w @astronacci/web

# Run tests
npm test -w @astronacci/api
npm test -w @astronacci/web

# Type checking
npm run typecheck -w @astronacci/api
npm run typecheck -w @astronacci/web

# Build for production
npm run build
```

### Project Scripts by Package

**Root:**
- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run typecheck` - Type check all packages

**API (`apps/api`):**
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm run test` - Run Jest tests
- `npm run seed` - Seed Firestore with sample data

**Web (`apps/web`):**
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run test` - Run Jest tests

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/facebook` | Initiate Facebook OAuth |
| GET | `/auth/facebook/callback` | Facebook OAuth callback |
| POST | `/auth/register` | Email registration |
| POST | `/auth/login` | Email login |
| POST | `/auth/logout` | Logout (clears session) |
| GET | `/auth/me` | Get current user |

### Content Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | List all articles (preview only) |
| GET | `/articles/:id` | Get full article (quota enforced) |
| GET | `/videos` | List all videos (preview only) |
| GET | `/videos/:id` | Get full video (quota enforced) |

### User Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | Get user profile |
| GET | `/user/usage` | Get quota usage stats |

### Response Format

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `QUOTA_EXCEEDED` | 403 | Content access limit reached |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Testing

### Run All Tests

```bash
# All packages
npm test

# API tests only
npm test -w @astronacci/api

# Web tests only
npm test -w @astronacci/web

# With coverage
npm run test:coverage -w @astronacci/api
```

### Test Structure

```
apps/api/src/__tests__/
├── app.test.ts                    # Express app tests
├── config/                        # Configuration tests
├── middleware/                    # Middleware tests
├── repositories/                  # Data layer tests
├── routes/                        # API endpoint tests
├── services/                      # Business logic tests
├── scripts/                       # Seed script tests
└── integration/
    └── e2e.test.ts               # End-to-end flows
```

## Security

### Implemented Measures

- **HttpOnly Cookies**: Session tokens not accessible via JavaScript
- **CORS**: Restricted to configured frontend origin
- **Rate Limiting**: 5 requests/minute on auth endpoints
- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Tokens**: 256-bit cryptographically secure
- **Firestore Rules**: Deny all client access (Admin SDK only)
- **Input Validation**: All endpoints validate input

### Best Practices

1. Never commit `.env` files with real credentials
2. Rotate Firebase service account keys regularly
3. Use strong, unique `SESSION_SECRET`
4. Keep dependencies updated
5. Review Firestore security rules before production

## Firestore Data Structure

```
firestore/
├── users/{userId}
│   ├── email: string
│   ├── displayName: string
│   ├── authProvider: "google" | "facebook" | "email"
│   ├── passwordHash?: string
│   ├── membershipType: "A" | "B" | "C"
│   ├── googleId?: string
│   ├── facebookId?: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── sessions/{sessionToken}
│   ├── userId: string
│   ├── expiresAt: timestamp
│   └── createdAt: timestamp
│
├── usage/{userId}
│   ├── articlesAccessed: string[]
│   ├── videosAccessed: string[]
│   └── lastUpdated: timestamp
│
├── articles/{articleId}
│   ├── title: string
│   ├── slug: string
│   ├── preview: string
│   ├── content: string
│   ├── author: string
│   ├── coverImage?: string
│   ├── publishedAt: timestamp
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
└── videos/{videoId}
    ├── title: string
    ├── slug: string
    ├── description: string
    ├── thumbnail: string
    ├── videoUrl: string
    ├── duration: number
    ├── author: string
    ├── publishedAt: timestamp
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

## Deployment

### Production Environment Variables

For production, update these values:

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
FACEBOOK_CALLBACK_URL=https://your-api-domain.com/api/auth/facebook/callback
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all URLs
- [ ] Update OAuth callback URLs in Google/Facebook consoles
- [ ] Generate new `SESSION_SECRET`
- [ ] Review and tighten Firestore security rules
- [ ] Set up proper logging and monitoring
- [ ] Configure rate limiting for production load

## Troubleshooting

### Common Issues

**Firebase connection errors:**
- Verify `FIREBASE_PRIVATE_KEY` has proper newlines (`\n` not literal)
- Check `FIREBASE_CLIENT_EMAIL` matches service account

**OAuth redirect issues:**
- Ensure callback URLs match exactly in provider console
- Check CORS configuration allows frontend origin

**Session not persisting:**
- Verify cookies are being set (check browser dev tools)
- Ensure `credentials: 'include'` in frontend fetch calls
- Check `SameSite` cookie attribute for cross-origin setup

**Tests failing:**
- Run `npm install` to ensure all dependencies
- Check `@astronacci/shared` is built before running tests

## License

Private - All rights reserved
