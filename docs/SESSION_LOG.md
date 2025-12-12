# JASPER Development Session Log

**Purpose:** Track accomplishments and fixes from each development session

---

## Session: December 11, 2025

### Issues Fixed

#### 1. Admin Portal Login "Flicker and Kick Out" Issue
**Problem:** After design updates, the login at portal.jasperfinance.org would accept credentials, briefly show success, then immediately kick the user back to the login page.

**Root Cause:** `jasper-portal-frontend/next.config.mjs` was configured to proxy ALL API requests to `http://127.0.0.1:8000` regardless of environment. In production on Vercel, this caused:
1. User logs in successfully, token stored in localStorage
2. Auth context tries to verify token via `/api/v1/admin/auth/me`
3. Request proxied to localhost:8000 which doesn't exist in production
4. Token verification fails, auth context logs user out
5. User sees "flicker" as they're briefly authenticated then kicked out

**Fix:** Updated `next.config.mjs` to use environment-based API URL:
```javascript
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://api.jasperfinance.org'
  : 'http://127.0.0.1:8000'
```

**File Modified:** `/jasper-portal-frontend/next.config.mjs`

#### 2. Vercel Body Parsing Issue (Previous Session)
**Problem:** Login endpoint receiving `Invalid JSON` errors due to Vercel edge proxy escaping `!` characters as `\!` in request bodies (e.g., `Admin123!` becoming `Admin123\!`).

**Fix:** Added fallback JSON parsing with escape character fix:
```javascript
try {
  body = JSON.parse(rawBody);
} catch (parseError) {
  const fixedBody = rawBody.replace(/\\!/g, '!');
  body = JSON.parse(fixedBody);
}
```

**File Modified:** `/jasper-api/api/admin/auth/login.js`

### Deployments
- **Frontend:** jasper-portal-frontend deployed to Vercel (production)
- **API:** jasper-api already deployed at api.jasperfinance.org

### Status After Session
- Admin login working at https://portal.jasperfinance.org/login
- Default credentials: admin@jasperfinance.org / Admin123!
- Google OAuth available (requires Google Cloud Console test user approval or app publication)

---

## Session Template

```markdown
## Session: [Date]

### Issues Fixed
#### [Issue Name]
**Problem:**
**Root Cause:**
**Fix:**
**File Modified:**

### New Features
-

### Deployments
-

### Status After Session
-
```
