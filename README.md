# PolicyPulse

A non-partisan policy tracking application that delivers neutral, AP-style daily reports on U.S. administration policy changes. Includes a searchable repository of changes, AI-powered demographic impact ratings, a public REST API, and an upcoming events tracker.

All generated content follows Associated Press style guidelines: factual, third-person, no editorializing. A loaded-word blocklist and strict system prompts enforce neutrality across every AI-generated summary and impact rating.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Full-stack React framework with server components and API routes |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type safety across the entire codebase |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Primary data store for policy changes, ratings, events |
| **ORM** | [Prisma 6](https://www.prisma.io/) | Database schema, migrations, and type-safe queries |
| **AI (Option 1)** | [Anthropic Claude API](https://docs.anthropic.com/) | Summary generation, impact analysis, digest creation |
| **AI (Option 2)** | [OpenAI GPT API](https://platform.openai.com/) | Alternative AI provider (configurable via env var) |
| **Data Source** | [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) | Official government actions: executive orders, rules, notices |
| **Data Source** | [AP News RSS](https://apnews.com/) | Policy-related news articles via RSS feed |
| **Validation** | [Zod 4](https://zod.dev/) | Runtime request validation for API endpoints |
| **Icons** | [Lucide React](https://lucide.dev/) | Icon library |
| **Date Utilities** | [date-fns 4](https://date-fns.org/) | Date formatting and manipulation |
| **RSS Parsing** | [rss-parser](https://github.com/rbren/rss-parser) | Parsing AP News RSS feeds |
| **Deployment** | [Vercel](https://vercel.com/) | Serverless hosting with cron job support |

---

## Features

### Daily Digest Dashboard
AI-generated daily overview of policy activity with a headline, summary paragraph, and individual policy cards. Each card shows the change type, a brief summary, and an aggregate impact indicator.

### Policy Change Repository
Searchable, filterable database of all tracked policy changes. Filter by type (executive order, agency rule, legislation, etc.), status (in effect, challenged, blocked, etc.), and full-text search. Paginated results with direct links to source documents.

### Demographic Impact Rating System
Each policy change is AI-analyzed for impact across 8 demographic categories:

| Category | Example Subcategories |
|---|---|
| Sex | Men, Women, Non-binary individuals |
| Marital Status | Single, Married, Divorced/Separated, Widowed |
| Sexual Orientation | Heterosexual, LGBTQ+ |
| Religion | Christian, Muslim, Jewish, Hindu, Buddhist, Non-religious |
| Ethnicity | White, Black/African American, Hispanic/Latino, Asian American, Native American/Indigenous, Pacific Islander, Multiracial |
| Salary Bracket | Under $25k, $25k-$50k, $50k-$75k, $75k-$100k, $100k-$150k, $150k-$250k, Over $250k |
| U.S. State | All 50 states + DC |
| Political Affiliation | Democrat, Republican, Independent, Non-affiliated |

Ratings use a -2 to +2 scale with confidence scores. A triage step first identifies which categories are relevant to reduce unnecessary API calls.

### Personalized Impact Calculator
Users select their demographics via a profile form (stored in localStorage, never persisted server-side). The app aggregates pre-computed impact ratings using confidence-weighted averaging to produce a personalized overall score and per-category breakdown.

### Upcoming Events Timeline
Tracks scheduled hearings, compliance deadlines, implementation dates, court dates, and comment period endings. Events link back to their related policy changes.

### Public REST API
All data is accessible via JSON API endpoints with rate limiting, Zod validation, and CORS support. See the `/api-docs` page or the [API Endpoints](#api-endpoints) section below.

### Automated Data Ingestion
A Vercel cron job runs daily at 10:00 AM UTC to:
1. Fetch new documents from the Federal Register API
2. Fetch policy-relevant articles from AP News RSS
3. Deduplicate against existing records
4. Generate AI summaries for new entries
5. Produce demographic impact ratings
6. Create the daily digest
7. Extract upcoming events from effective dates

---

## Prerequisites

- **Node.js** 18.18 or later
- **PostgreSQL** 14 or later (local install or Docker)
- At least one AI API key: **Anthropic** or **OpenAI**

---

## Quick Start (One Command)

If you already have PostgreSQL running on `localhost:5432`:

```bash
# 1. Clone and enter the project
cd policypulse

# 2. Copy and edit your environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and API keys

# 3. Run the full setup: install deps, generate Prisma client, push schema, seed data
npm run setup

# 4. Start the dev server
npm run dev
```

The `setup` script runs these steps in sequence:
1. `npm install` -- installs all dependencies
2. Copies `.env.example` to `.env.local` (won't overwrite if it already exists)
3. `prisma generate` -- generates the Prisma client
4. `prisma db push` -- creates all database tables
5. `tsx prisma/seed.ts` -- loads sample data (3 policy changes, impact ratings, events, daily digest)

Open [http://localhost:3000](http://localhost:3000) to see the dashboard with seeded sample data.

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL

**Option A: Docker (recommended)**
```bash
docker run --name policypulse-db \
  -e POSTGRES_DB=policypulse \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  -d postgres:16
```

**Option B: Local PostgreSQL**
```bash
createdb policypulse
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# Database -- match your PostgreSQL setup
DATABASE_URL="postgresql://postgres:dev@localhost:5432/policypulse"

# AI Provider -- at least one key required
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
AI_PROVIDER="anthropic"  # or "openai"

# Cron secret -- any random string, used to protect the ingestion endpoint
CRON_SECRET="your-random-secret-here"
```

### 4. Set Up the Database

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your database (creates all tables)
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (port 3000) |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run setup` | **One-command setup**: install, generate, push schema, seed |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate the Prisma client after schema changes |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:reset` | **Reset the database** and re-seed (destroys all data) |
| `npm run db:studio` | Open Prisma Studio (visual database browser at localhost:5555) |
| `npm run ingest` | Manually trigger the ingestion pipeline via the local API |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | One of these | -- | Anthropic API key for Claude |
| `OPENAI_API_KEY` | One of these | -- | OpenAI API key for GPT |
| `AI_PROVIDER` | No | `anthropic` | Which AI provider to use: `anthropic` or `openai` |
| `AI_MODEL` | No | Provider default | Override the AI model (e.g., `gpt-4o`, `claude-sonnet-4-20250514`) |
| `FEDERAL_REGISTER_BASE_URL` | No | `https://www.federalregister.gov/api/v1` | Federal Register API base URL |
| `AP_NEWS_RSS_URL` | No | `https://rsshub.app/apnews/topics/apf-politics` | AP News politics RSS feed URL |
| `CRON_SECRET` | For production | -- | Bearer token to protect the `/api/ingest` endpoint |
| `API_RATE_LIMIT_PER_MINUTE` | No | `60` | Max API requests per minute per IP |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public app URL |

---

## Project Structure

```
policypulse/
├── prisma/
│   ├── schema.prisma          # Database schema (6 models, 7 enums)
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard (daily digest, recent changes, upcoming)
│   │   ├── layout.tsx         # Root layout with header/footer
│   │   ├── loading.tsx        # Dashboard loading skeleton
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── globals.css        # Tailwind imports
│   │   ├── changes/
│   │   │   ├── page.tsx       # Policy change repository with filters
│   │   │   ├── loading.tsx    # Changes loading skeleton
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Change detail with impact heatmap
│   │   │       └── loading.tsx
│   │   ├── impact/
│   │   │   └── page.tsx       # Personalized impact calculator
│   │   ├── upcoming/
│   │   │   └── page.tsx       # Events timeline
│   │   ├── api-docs/
│   │   │   └── page.tsx       # API documentation
│   │   └── api/
│   │       ├── daily-report/route.ts   # GET  - Today's digest
│   │       ├── changes/route.ts        # GET  - List/filter changes
│   │       ├── changes/[id]/route.ts   # GET  - Single change detail
│   │       ├── impact/route.ts         # POST - Personalized impact scores
│   │       ├── upcoming/route.ts       # GET  - Future events
│   │       ├── summarize/route.ts      # POST - Custom AI summary
│   │       └── ingest/route.ts         # POST - Cron data ingestion
│   ├── components/
│   │   ├── ui/                # Card, Badge, ImpactBadge, Skeleton
│   │   ├── layout/            # Header, Footer
│   │   └── changes/           # ChangeFilters (client component)
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── ai/
│   │   │   ├── client.ts      # AI provider abstraction (OpenAI/Anthropic)
│   │   │   ├── prompts.ts     # All system prompts (neutrality rules)
│   │   │   ├── summarize.ts   # Summary generation + neutrality validation
│   │   │   └── impact-analyzer.ts  # Demographic impact rating with triage
│   │   ├── ingestion/
│   │   │   ├── federal-register.ts  # Federal Register API client
│   │   │   ├── ap-news.ts          # AP News RSS parser
│   │   │   ├── deduplication.ts     # Duplicate detection
│   │   │   └── orchestrator.ts      # Full ingestion pipeline
│   │   ├── api/
│   │   │   ├── rate-limit.ts  # Token-bucket rate limiter
│   │   │   ├── response.ts    # Standardized API response helpers
│   │   │   └── validation.ts  # Zod schemas for request validation
│   │   └── utils/
│   │       ├── constants.ts   # Demographic matrix, loaded words, keywords
│   │       └── date.ts        # Date formatting helpers
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── vercel.json                # Cron job configuration
├── next.config.ts             # Next.js config (CORS headers, turbopack)
├── .env.example               # Environment variable template
└── package.json
```

---

## Data Model

### Core Models

- **PolicyChange** -- Central entity representing a tracked policy action (executive order, rule, legislation, etc.). Stores the AI-generated summary, source metadata, agencies, topics, and lifecycle status.
- **ImpactRating** -- Per-demographic impact score for a policy change. Score ranges from -2 (very negative) to +2 (very positive) with a confidence value (0.0-1.0). Composite unique on `[policyChangeId, category, subcategory]`.
- **UpcomingEvent** -- Scheduled future event (hearing, deadline, implementation date, court date) linked to a policy change.
- **DailyDigest** -- Pre-computed daily rollup with an AI-generated headline and summary. One per day.
- **DailyDigestEntry** -- Joins a DailyDigest to its PolicyChange entries with brief card summaries and display ordering.
- **IngestionLog** -- Tracks each cron run for observability: documents found/new, errors, duration.

### Enums

- **ChangeType**: EXECUTIVE_ORDER, LEGISLATION, AGENCY_RULE, AGENCY_PROPOSED_RULE, AGENCY_NOTICE, APPOINTMENT, PROCLAMATION, MEMORANDUM, OTHER
- **ChangeStatus**: TRACKING, IN_EFFECT, PENDING_IMPLEMENTATION, CHALLENGED, BLOCKED, OVERTURNED, SUPERSEDED
- **DemographicCategory**: SEX, MARITAL_STATUS, SEXUAL_ORIENTATION, RELIGION, ETHNICITY, SALARY_BRACKET, US_STATE, POLITICAL_AFFILIATION
- **EventType**: HEARING, DEADLINE, IMPLEMENTATION, COURT_DATE, VOTE, COMMENT_PERIOD_END, OTHER

---

## API Endpoints

All responses use a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "error": { "code": "...", "message": "..." },
  "meta": { "page": 1, "perPage": 20, "total": 47 }
}
```

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| GET | `/api/daily-report` | Today's digest (headline, summary, entries) | 60/min |
| GET | `/api/changes` | List changes with filters (`search`, `type`, `status`, `dateFrom`, `dateTo`, `page`, `perPage`) | 60/min |
| GET | `/api/changes/:id` | Single change with impact ratings and events | 60/min |
| POST | `/api/impact` | Personalized impact scores (body: demographic profile) | 60/min |
| GET | `/api/upcoming` | Upcoming events (`eventType`, `page`, `perPage`) | 60/min |
| POST | `/api/summarize` | Custom AI summary on a topic (body: `{ topic, dateFrom?, dateTo? }`) | 10/min |
| POST | `/api/ingest` | Trigger data ingestion (protected by `CRON_SECRET`) | N/A |

CORS is enabled on all `/api/*` routes.

---

## Neutrality Approach

PolicyPulse enforces factual, non-partisan content through multiple layers:

1. **System prompts** -- Every AI call uses a base prompt requiring AP-style writing: factual, third-person, no editorializing, no loaded language, inverted pyramid structure.
2. **Loaded-word blocklist** -- Post-processing checks for words like "controversial," "radical," "unprecedented," etc. If detected, the AI is asked to regenerate.
3. **Confidence thresholds** -- Impact ratings with confidence below 0.2 are automatically set to 0 (neutral) to prevent speculative ratings.
4. **Source attribution** -- Summaries must cite specific provisions from policy text rather than characterize intent.
5. **Triage pass** -- The system first determines which demographics are directly affected before generating ratings, preventing spurious associations.

---

## Deployment to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set all environment variables in Vercel project settings
4. Vercel will auto-detect Next.js and deploy
5. After the first deploy, the cron job in `vercel.json` will trigger `/api/ingest` daily at 10:00 AM UTC

> Set `CRON_SECRET` in your Vercel environment variables. Vercel automatically sends this as a Bearer token with cron requests. Without it, the ingestion endpoint is unprotected.

For Vercel Pro plans, you can add a second cron run to catch afternoon updates:

```json
{
  "crons": [
    { "path": "/api/ingest", "schedule": "0 10 * * *" },
    { "path": "/api/ingest", "schedule": "0 18 * * *" }
  ]
}
```

---

## Troubleshooting

**"Can't reach database server"**
Make sure PostgreSQL is running and `DATABASE_URL` in `.env.local` matches your setup. For Docker: `docker start policypulse-db`.

**"Module not found: @prisma/client"**
Run `npx prisma generate` to regenerate the Prisma client.

**Ingestion returns empty results**
The Federal Register API only returns documents published on business days. If you run ingestion on a weekend, try passing `?daysBack=3` to look further back.

**AI API errors**
Verify your API key is set correctly in `.env.local` and that `AI_PROVIDER` matches the key you provided (`anthropic` or `openai`).

**"CRON_SECRET" unauthorized on ingestion**
For local development, either set `CRON_SECRET` in `.env.local` and pass it as a Bearer token, or leave it empty to allow unauthenticated local calls.

---

## License

MIT
