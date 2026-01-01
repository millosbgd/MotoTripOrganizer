# Moto Trip Organizer - Frontend

Next.js 14 frontend application for Moto Trip Organizer.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Auth0 account configured (see [AUTH0-SETUP.md](../AUTH0-SETUP.md))
- Backend API running (see [../README.md](../README.md))

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your Auth0 credentials
# AUTH0_SECRET - Generate with: openssl rand -hex 32
# AUTH0_CLIENT_ID - From Auth0 Application
# AUTH0_CLIENT_SECRET - From Auth0 Application

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
# Auth0 Configuration
AUTH0_SECRET='<generate-with-openssl-rand-hex-32>'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://dev-gp57sox40kt34si8.us.auth0.com'
AUTH0_CLIENT_ID='KeP57L3qWSI3tF75HPvKqs3tdX3LcjTa'
AUTH0_CLIENT_SECRET='AMRpRGqbkXzWDZKTl0eO4SLegGlEj-WN3TwJSizZJIFnx-XxMJLmg3HnLuEHm-nt'
AUTH0_AUDIENCE='https://api.mototriporganizer.com'
AUTH0_SCOPE='openid profile email read:trips write:trips delete:trips'

# Backend API
NEXT_PUBLIC_API_URL='http://localhost:5000'
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/      # Auth0 API routes
│   │   ├── dashboard/     # Protected dashboard pages
│   │   ├── layout.tsx     # Root layout with Auth0 provider
│   │   ├── page.tsx       # Landing page
│   │   └── globals.css    # Global styles
│   ├── lib/
│   │   ├── api-client.ts  # Axios client with auth
│   │   └── api.ts         # API service functions
│   └── types/
│       └── api.ts         # TypeScript types
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Auth0 (`@auth0/nextjs-auth0`)
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Notifications**: React Hot Toast
- **Date Formatting**: date-fns

## 🔐 Authentication Flow

1. User clicks "Sign In" → Redirected to Auth0
2. After Auth0 login → Callback to `/api/auth/callback`
3. User lands on `/dashboard`
4. If first login → Automatic bootstrap (creates user in backend)
5. Access token included in all API requests

## 📡 API Integration

All API calls use Axios client with automatic token injection:

```typescript
import { tripsApi } from '@/lib/api';

// Get all trips
const trips = await tripsApi.getAll();

// Create trip
const trip = await tripsApi.create({
  name: 'Summer Road Trip',
  startDate: '2026-06-01',
});
```

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## 🚀 Deployment

### Azure Static Web Apps (Recommended)

1. **Create Static Web App** in Azure Portal
2. **Connect to GitHub** repository
3. **Configure build**:
   - App location: `/frontend`
   - API location: `` (empty)
   - Output location: `.next`

4. **Add Environment Variables** in Azure:
   - All `AUTH0_*` variables
   - `NEXT_PUBLIC_API_URL` (production API URL)

GitHub Actions will automatically deploy on push to `main`.

### Manual Deployment

```bash
# Build
npm run build

# Deploy .next folder to your hosting provider
```

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Auth0 Next.js SDK](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)

## 🆘 Troubleshooting

### "Invalid state" error on login
- Check `AUTH0_SECRET` is set and consistent
- Clear cookies and try again

### "Network Error" when calling API
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running
- Check CORS settings in backend

### Bootstrap fails
- Check Auth0 audience matches backend configuration
- Verify backend `/api/me/bootstrap` endpoint is working

---

**Happy coding! 🏍️**
