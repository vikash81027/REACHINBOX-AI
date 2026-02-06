<<<<<<< HEAD
# REACHINBOX-AI
=======
# ReachInbox Email Scheduler

A production-grade full-stack email job scheduler built for the ReachInbox hiring assignment. This system handles reliable scheduling and sending of emails at scale using **BullMQ + Redis** for job queuing, **PostgreSQL** for persistence, and **Ethereal Email** for SMTP testing.

![Tech Stack](https://img.shields.io/badge/Backend-Express.js-green?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Queue-BullMQ-red?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Rate Limiting & Concurrency](#-rate-limiting--concurrency)
- [Restart Persistence](#-restart-persistence)
- [Configuration](#-configuration)
- [Demo](#-demo)

## ✅ Features

### Backend
- ✅ **BullMQ Job Scheduling** - No cron jobs, pure delayed job scheduling
- ✅ **Server Restart Persistence** - Jobs survive server restarts without duplicates
- ✅ **Per-Sender Rate Limiting** - Redis-backed hourly limits with automatic rescheduling
- ✅ **Configurable Concurrency** - Multiple workers processing jobs in parallel
- ✅ **Configurable Delay** - Minimum delay between email sends (default: 2 seconds)
- ✅ **Multiple Senders** - Support for multiple email senders with individual Ethereal accounts
- ✅ **Ethereal Email Integration** - Fake SMTP for testing with preview URLs
- ✅ **Idempotency** - Unique job IDs prevent duplicate processing

### Frontend
- ✅ **Google OAuth Login** - Real Google authentication
- ✅ **Dashboard** - Stats, tabs for Scheduled/Sent emails
- ✅ **Compose Modal** - Schedule emails with CSV upload
- ✅ **Email Tables** - View scheduled and sent emails with pagination
- ✅ **Loading & Empty States** - Polished UX with proper feedback
- ✅ **Auto-Refresh** - Real-time updates every 10 seconds

## 🛠 Tech Stack

### Backend
- **Language:** TypeScript
- **Framework:** Express.js
- **Queue:** BullMQ (Redis-backed)
- **Database:** PostgreSQL with Prisma ORM
- **SMTP:** Nodemailer + Ethereal Email
- **Auth:** Passport.js with Google OAuth

### Frontend
- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **State:** TanStack Query (React Query)
- **Auth:** NextAuth.js
- **UI:** Custom components, Lucide icons

### Infrastructure
- **Redis:** Job queue storage
- **PostgreSQL:** Persistent data store
- **Docker:** Optional containerized setup

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Next.js      │────▶│   Express.js    │────▶│   PostgreSQL    │
│    Frontend     │     │   Backend API   │     │   Database      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │  (BullMQ Queue) │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  BullMQ Worker  │────▶│  Ethereal SMTP  │
                        │  (background)   │     │  (fake email)   │
                        └─────────────────┘     └─────────────────┘
```

### Scheduling Flow

1. User schedules email(s) via frontend
2. Backend creates email record in PostgreSQL with status `SCHEDULED`
3. Backend creates delayed BullMQ job with calculated delay
4. Worker picks up job when delay expires
5. Worker checks rate limit (Redis counter)
   - If under limit: send email, update status to `SENT`
   - If over limit: reschedule job to next hour, update status to `RATE_LIMITED`
6. Database status is always updated to reflect actual state

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (recommended)
- Google Cloud Console account (for OAuth)

### 1. Clone & Install

```bash
# Clone the repository
cd REACHINBOX-AI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Infrastructure (Redis & PostgreSQL)

```bash
# From project root
docker-compose up -d
```

This starts:
- Redis on port 6379
- PostgreSQL on port 5432

### 3. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://reachinbox:reachinbox_secret@localhost:5432/reachinbox_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-session-key"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Rate Limiting
MAX_EMAILS_PER_HOUR_PER_SENDER=100
MIN_DELAY_BETWEEN_SENDS_MS=2000
WORKER_CONCURRENCY=5

# URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
```

#### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

NEXT_PUBLIC_API_URL="http://localhost:3001/api"
BACKEND_URL="http://localhost:3001"
```

### 4. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/google/callback`
7. Copy Client ID and Client Secret to both `.env` files

### 5. Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push
```

### 6. Start the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/api/health

## 📡 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Initiate Google OAuth |
| `/api/auth/google/callback` | GET | OAuth callback |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout |

### Emails

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/emails/schedule` | POST | Schedule single email |
| `/api/emails/schedule/bulk` | POST | Schedule multiple emails |
| `/api/emails/scheduled` | GET | Get scheduled emails |
| `/api/emails/sent` | GET | Get sent emails |
| `/api/emails/:id` | GET | Get email by ID |
| `/api/emails/:id` | DELETE | Cancel scheduled email |

### Senders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/senders` | GET | Get all senders |
| `/api/senders` | POST | Create sender (auto-creates Ethereal account) |
| `/api/senders/:id` | GET | Get sender by ID |
| `/api/senders/:id` | PATCH | Update sender |
| `/api/senders/:id` | DELETE | Delete sender |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with service status |
| `/api/stats` | GET | Queue and database statistics |

## 📊 Rate Limiting & Concurrency

### Rate Limiting Implementation

- **Type:** Per-sender, per-hour
- **Storage:** Redis counters with auto-expiry
- **Key Format:** `rate_limit:{senderId}:{YYYY-MM-DD-HH}`
- **TTL:** 3600 seconds (1 hour)
- **Configurable via:** `MAX_EMAILS_PER_HOUR_PER_SENDER`

When rate limit is exceeded:
1. Job is NOT dropped or failed
2. Job is rescheduled to the next available hour window
3. Email status updated to `RATE_LIMITED` → `SCHEDULED`
4. Order is preserved via FIFO queue processing

### Concurrency

- **Worker Concurrency:** Configurable via `WORKER_CONCURRENCY` (default: 5)
- **Thread Safety:** Redis atomic operations for counters
- **Safe Parallel Execution:** 
  - Unique `bullJobId` constraint prevents duplicates
  - Atomic increment/decrement for rate limit counters

### Delay Between Sends

- **Configurable via:** `MIN_DELAY_BETWEEN_SENDS_MS` (default: 2000ms)
- **Implementation:** BullMQ limiter + worker delay
- **Purpose:** Prevents overwhelming SMTP servers, mimics real-world throttling

### Behavior Under Load (1000+ emails)

1. Jobs are created with staggered delays based on `delayBetweenEmails`
2. Worker processes up to `WORKER_CONCURRENCY` jobs in parallel
3. Each job checks rate limit before sending
4. Jobs exceeding hourly limit are automatically rescheduled
5. No emails are lost; all are eventually delivered

## 🔄 Restart Persistence

### How It Works

1. **On Startup:** `syncPendingEmailsOnStartup()` is called
2. **Query:** Find all emails with status `SCHEDULED` or `RATE_LIMITED` where `scheduledAt > now()`
3. **Check:** For each email, verify if BullMQ job exists using `bullJobId`
4. **Recreate:** If job is missing, create new delayed job with correct timing
5. **Cleanup:** Mark any `PROCESSING` emails as `FAILED` (server crashed mid-send)

### Guarantees

- ✅ Scheduled emails are sent at the correct time after restart
- ✅ No duplicate emails (unique `bullJobId` constraint)
- ✅ No lost emails (database is source of truth)
- ✅ Status accurately reflects current state

### Testing Restart Persistence

```bash
# 1. Schedule 10 emails for 5 minutes in future
# 2. Stop the backend server (Ctrl+C)
# 3. Wait 1-2 minutes
# 4. Restart the backend server
# 5. Watch logs - you should see "Sync complete: X jobs recreated"
# 6. Emails will still send at the correct time
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend server port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `SESSION_SECRET` | - | Express session secret |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | 100 | Rate limit per sender per hour |
| `MIN_DELAY_BETWEEN_SENDS_MS` | 2000 | Delay between email sends (ms) |
| `WORKER_CONCURRENCY` | 5 | Parallel job processing |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `BACKEND_URL` | http://localhost:3001 | Backend URL for OAuth callbacks |

## 🎬 Demo

### Features Demonstrated

1. **Google Login** - Authenticate with Google account
2. **Create Sender** - Generate Ethereal email account
3. **Schedule Emails** - Upload CSV, set timing, schedule
4. **View Dashboard** - Stats, scheduled/sent tabs
5. **Watch Emails Send** - Real-time status updates
6. **Restart Persistence** - Stop server, restart, verify continuation

### Recording the Demo

To record the demo video:
1. Schedule several emails for different times
2. Show the dashboard with stats
3. Stop the server mid-schedule
4. Restart and show logs of job recreation
5. Wait for emails to send and verify in Ethereal

## 📝 Notes & Trade-offs

### Assumptions

1. **Single Database Instance** - No support for multi-region databases
2. **Ethereal for Testing** - Real SMTP would require additional configuration
3. **Session-Based Auth** - JWT would be more scalable for production
4. **No WebSocket** - Polling used for real-time updates

### Trade-offs

1. **Rate Limit Precision** - Using hourly windows means some wasted quota at window boundaries
2. **No Priority Queue** - All emails are FIFO; no priority scheduling
3. **Single Worker Process** - For true horizontal scaling, would need distributed worker setup

### Future Improvements

- WebSocket for real-time updates
- Email templates with variables
- Scheduled recurring campaigns
- Analytics and reporting
- Multi-tenant support

## 📄 License

This project was created for the ReachInbox hiring assignment.

---

Built with ❤️ for ReachInbox
>>>>>>> df58b87 (Initial commit)
