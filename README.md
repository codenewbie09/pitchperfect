# PitchPerfect -- AI Sales Roleplay Training

Practice sales conversations against AI prospects that respond in-character based on their persona, pain points, and personality. Get scored on opener quality, qualification, objection handling, and closing technique.

## Live Demo

https://pp-sales.vercel.app

## Features

| Feature | Description |
|---------|-------------|
| Auth methods | Sign in with Google or continue as a guest |
| AI roleplay | Realistic prospect personas that respond in-character using Groq LLM |
| Scoring | Auto-generated scorecard evaluating opener, qualification, objection handling, closing, and overall |
| Responsive UI | Desktop-first with mobile-friendly collapse panels |
| Shareable reviews | Share completed session transcripts and scorecards via public links |
| CSV export | Export session history for tracking progress over time |
| Best Session badge | Quick-link to the highest-scoring completed session per scenario |

## Screenshots

- Dashboard with hero section, scenario creation form, and scenario list -- screenshot coming soon
- Chat interface with prospect brief sidebar and message bubbles -- screenshot coming soon
- Scorecard modal with category breakdown and color-coded scores -- screenshot coming soon
- Public share page for external review -- screenshot coming soon

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Database ORM:** Drizzle ORM
- **Database:** Neon (PostgreSQL)
- **Component Library:** shadcn/ui (canary v4)
- **Styling:** Tailwind CSS v4
- **AI API:** Groq (llama-3.1-8b-instant)
- **Authentication:** NextAuth v5
- **Deployment:** Vercel

## Architecture Overview

The app follows a serverless SaaS architecture with auth-gated routes and a component-based UI:

1. **Pages** use the App Router -- a public landing page, authenticated dashboard, session chat with two-column layout, review page, and public share page.
2. **API routes** are co-located under `/app/api/` -- individual endpoints for scenarios and sessions CRUD, a consolidated `/api/dashboard` endpoint (N+1 fetch fix), plus NextAuth route handlers for auth.
3. **Drizzle ORM** connects to a Neon PostgreSQL database with tables for scenarios, sessions, messages, and NextAuth adapter tables for user, account, session, and verification token storage.
4. **Groq API** powers the AI prospect -- each session generates a prospect persona at creation time, and every SDR message triggers an in-character response with automated scorecard generation on completion.
5. **NextAuth v5** manages authentication with Google OAuth and a credentials-based guest mode. Protected routes use middleware to enforce auth, and all API queries filter by user ID for data isolation.
6. **Component architecture** is organized by domain -- shared UI primitives under `/components/ui/` (shadcn/ui), dashboard components under `/components/dashboard/` (ScenarioCard, StatsBar, ScenarioForm, EmptyState), and chat components under `/components/chat/` (ChatMessage, ComposeBar, ScorecardDialog, BriefPanel, SessionHeader, TypingIndicator).
7. **Error and loading states** use an ErrorBoundary wrapper with ErrorFallback component across routes, plus Skeleton placeholders during data fetching.

## Getting Started

```bash
git clone https://github.com/codenewbie09/pitchperfect
cd pitchperfect
cp .env.example .env.local
npm install
npm run dev
```

Fill in `DATABASE_URL` (Neon connection string) and `GROQ_API_KEY` in `.env.local`, then run database migrations:

```bash
npx drizzle-kit migrate
```

Open http://localhost:3000 in your browser.

## Running Tests

```bash
npm test                   # Run 23 tests (unit + integration)
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

The test suite includes:
- **Unit tests**: score color boundaries, JSON extraction from AI responses, prospect brief generation, and feedback parsing (18 tests)
- **Integration tests**: API route validation for scenarios and session reply endpoints (5 tests, using mocked DB)

## License

MIT -- see [LICENSE](./LICENSE) for details.
