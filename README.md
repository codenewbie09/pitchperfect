# PitchPerfect -- AI Sales Roleplay Training

Practice sales conversations against AI prospects that respond in-character based on their persona, pain points, and personality. Get scored on opener quality, qualification, objection handling, and closing technique.

## Live Demo

https://pp-sales.vercel.app

## How it works

1. Create a scenario -- describe a target persona (role, company size, industry) and set a difficulty level (easy / medium / hard)
2. AI generates a realistic prospect brief -- company name, role, pain points, trigger event, and personality tailored to the difficulty
3. You play the SDR and send the first message
4. AI responds in-character, staying true to the prospect's personality and pain points
5. The session auto-completes when the SDR proposes a meeting (or the prospect walks away)
6. AI delivers a scorecard evaluating opener, qualification, objection handling, closing, and an overall score
7. Shareable review links let you send completed session transcripts to anyone

## Design decisions

**Minimal, single-column layout.** The dashboard, chat, and review pages all use a centered max-width container with generous whitespace. This keeps focus on the conversation and reduces visual noise during a roleplay session.

**Hero section on the dashboard.** Above the scenario creation form, a hero section introduces the product with headline, subheadline, feature pills (3 difficulty levels, AI-generated prospects, instant scorecard), and a 3-step "How it works" grid. This makes the first visit feel like a real SaaS product, not just a form.

**Chat-first UX with persistent prospect sidebar.** Messages alternate left (prospect) and right (SDR), mimicking familiar chat interfaces. A fixed sidebar on desktop (collapsible panel on mobile) keeps the prospect brief visible at all times -- name, role, company, difficulty badge, trigger event, pain points, and personality. This contextual awareness is critical during training.

**Typing indicator as a local state animation.** Rather than polling or server-sent events, the UI shows a bouncing-dot animation while waiting for the AI response. The 1-1.5 second round-trip through Groq feels natural with this treatment -- the dots appear, then the prospect message slides in.

**Scorecard as an overlay, not a redirect.** When a session completes, the scorecard appears as a modal on the same page rather than forcing navigation. This lets the user review their performance in the context of the full conversation. A dedicated review page is also available for post-session analysis.

**Session stats on the review page.** A stats row above the scorecard shows total turns, difficulty badge, prospect company, and role -- turning the review page into a performance report, not just a chat log.

**Color-coded scores.** Scores are color-mapped (green for 7+, yellow for 4-6, red for below 4) so users can instantly identify strengths and weaknesses without reading numbers.

**Public share pages require no authentication.** The `/share/[id]` route fetches data from a dedicated no-auth API endpoint. This means users can send their scorecard to recruiters, hiring managers, or peers without requiring them to log in.

**Breadcrumb navigation.** The session page includes a back arrow to the dashboard. The review page provides a "Try Again" button that creates a fresh session with the same scenario, keeping the practice loop tight.

**CSV export for tracking progress over time.** Each scenario card has an export button that downloads all completed sessions as CSV with prospect name, difficulty, overall score, category scores, turn count, and completed date.

**Best Session badge.** Each scenario card shows the highest-scoring completed session with a link to its review page. Quick way to showcase top performance.

## Stack

Next.js (App Router) -- TypeScript -- Tailwind CSS -- Drizzle ORM -- PostgreSQL (Neon) -- Groq API -- Vercel

## Run locally

```bash
git clone https://github.com/codenewbie09/pitchperfect
cd pitchperfect
npm install
cp .env.example .env.local

# Fill in DATABASE_URL and GROQ_API_KEY

npx drizzle-kit migrate
npm run dev
```

## Run tests

```bash
npm test           # Run once
npm run test:watch # Watch mode
```
