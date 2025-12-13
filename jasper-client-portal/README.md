# JASPER Client Portal

Client-facing portal for JASPER Financial Architecture. Allows clients to track projects, view documents, communicate with the team, and access their financial models.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Auth**: Email/password + Google OAuth + LinkedIn OAuth
- **API**: Connects to JASPER API (`api.jasperfinance.org`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `https://api.jasperfinance.org`)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (authenticated home)
│   ├── login/             # Login with OAuth + email
│   ├── register/          # User registration
│   ├── verify-email/      # Email verification flow
│   ├── forgot-password/   # Password reset request
│   ├── reset-password/    # Password reset completion
│   └── pending-approval/  # Account pending approval page
├── components/            # Reusable components
│   └── ErrorBoundary.tsx  # Global error handling
└── lib/                   # Utilities and core logic
    ├── api.ts             # API client and types
    ├── auth-context.tsx   # Authentication state management
    └── sanitize.ts        # XSS protection utilities
```

## Features

### Authentication
- Email/password login with email verification
- Google OAuth integration
- LinkedIn OAuth integration
- Session timeout (30 minutes of inactivity)
- CSRF-protected OAuth state

### Security
- Content Security Policy (CSP) headers
- X-Frame-Options: DENY (clickjacking protection)
- XSS protection with DOMPurify
- Request timeout (30 seconds)
- Rate limit handling with retry
- Secure session storage for sensitive data

### User Experience
- Loading states for all OAuth buttons
- Global error boundary with retry
- Responsive design (mobile-first)
- Accessible form controls

## API Integration

The portal connects to the JASPER API using these endpoints:

| API Module | Purpose |
|------------|---------|
| `clientAuthApi` | Login, register, OAuth, password reset |
| `clientProjectsApi` | View projects, milestones, timeline |
| `clientDocumentsApi` | View and upload documents |
| `clientMessagesApi` | Send/receive messages with admin |
| `clientNotificationsApi` | Real-time notifications |
| `clientDashboardApi` | Dashboard stats, activity feed |
| `clientProfileApi` | Profile management, onboarding |

## Deployment

### Vercel

1. Connect to Git repository
2. Set environment variables
3. Deploy

### VPS (PM2)

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "jasper-client-portal" -- start

# Or use ecosystem file
pm2 start ecosystem.config.js
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Create a feature branch from `main`
2. Make changes
3. Run `npm run build` to verify
4. Submit a pull request

## License

Proprietary - JASPER Financial Architecture
