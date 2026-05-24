# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# PitchPerfect — AI Coding Agent Instructions

You are working on **PitchPerfect**, a live B2B SaaS product for AI sales roleplay training. The core loop is fully built and working. Your job is to upgrade it — better UI, test suite, new features, and production polish. Do not restructure what works.

**Live URL:** https://pp-sales.vercel.app  
**Repo:** https://github.com/codenewbie09/pitchperfect  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL (Neon) · Groq API (llama-3.1-8b-instant) · Vercel

---

## Agent Rules

- TypeScript everywhere. No `.js` files.
- `async/await` only. No `.then()` chains.
- Never use `any` unless unavoidable.
- Every file must compile before moving to the next step.
- Verify each step works before proceeding.
- Do not restructure existing working files unless explicitly told to.
- Do not build anything not listed here.

---

## Step 0 — Read Skills Before Writing Any Code

```
/mnt/skills/public/
  frontend-design/SKILL.md   ← read before writing ANY React/UI code
```

Re-read before every new React component. Skills are defaults — explicit instructions here override them.

---

## Environment Variables

```env
DATABASE_URL=postgresql://REPLACE_WITH_NEON_CONNECTION_STRING
GROQ_API_KEY=REPLACE_WITH_GROQ_KEY
```

---

## What Is Already Built (Do Not Rewrite)

### Schema (`db/schema.ts`) — COMPLETE

Tables: `scenarios`, `sessions`, `messages` with Drizzle relations.
Scenarios have: `id`, `title`, `personaDescription`, `industry`, `difficulty`, `createdAt`
Sessions have: `id`, `scenarioId`, `prospectName`, `prospectBrief` (jsonb), `feedback` (jsonb), `status`, `createdAt`
Messages have: `id`, `sessionId`, `role`, `content`, `createdAt`

### Core AI Logic (`lib/prospect.ts`) — COMPLETE, DO NOT MODIFY

Three exported functions — do not change signatures or restructure:

**`generateProspectBrief(prospectName, personaDescription, difficulty)`**
Returns `{ company, role, painPoints[], triggerEvent, personality }`.
Difficulty: easy=enthusiastic, medium=neutral, hard=skeptical+objections.

**`runProspectTurn(sessionId)`**
Reads full session+history from DB, calls Groq in-character, returns `{ message, status }`.
Server-side completion override: fires when `userMessages.length >= 2 && sdrUsedClosingSignal`.
Closing signals: schedule, meeting, call, demo, chat, thursday, friday, next week, calendar, book, set up a time.

**`generateFeedback(history)`**
Returns scorecard: `{ opener, qualification, objectionHandling, closing, overall, notes }`.
Each category: `{ score: number (1-10), feedback: string }`.

**`extractJSON(text)`** — internal fallback parser. Three strategies. Do not touch.
**`callGroq(messages)`** — internal Groq client. Fallback model: `mixtral-8x7b-32768`.

### Pages — COMPLETE

- `app/page.tsx` — Dashboard: create scenario (title+persona+industry+difficulty), accordion list with stats, start session modal
- `app/session/[id]/page.tsx` — Chat UI: bubbles, typing indicator (3-dot bounce), scorecard modal on completion
- `app/review/[id]/page.tsx` — Full review: scorecard grid, transcript, share+try again buttons
- `app/share/[id]/page.tsx` — Public share: no auth, scorecard+transcript, "Powered by PitchPerfect" footer

### Known Bug to Fix

`app/review/[id]/page.tsx` and `app/share/[id]/page.tsx` render all score bars as `bg-blue-500` regardless of score. They should use the same color logic as the session scorecard modal:

- score >= 7 → `bg-green-500`
- score >= 4 → `bg-yellow-500`
- score < 4 → `bg-red-500`

Fix this before building anything new.

---

## Current File Structure

```
pitchperfect/
├── app/
│   ├── page.tsx                          # Dashboard ✅
│   ├── session/[id]/page.tsx             # Chat UI ✅
│   ├── review/[id]/page.tsx              # Scorecard review ✅
│   ├── share/[id]/page.tsx               # Public share ✅
│   └── api/
│       ├── scenarios/route.ts            # GET + POST ✅
│       ├── sessions/route.ts             # GET + POST ✅
│       ├── sessions/[id]/route.ts        # GET single session ✅
│       ├── sessions/[id]/reply/route.ts  # POST SDR reply → prospect turn ✅
│       ├── sessions/[id]/share/route.ts  # GET public share data ✅
│       └── messages/route.ts             # GET messages by sessionId ✅
├── db/
│   ├── schema.ts                         # ✅
│   └── index.ts                          # ✅
├── lib/
│   └── prospect.ts                       # ✅ DO NOT MODIFY
└── drizzle.config.ts
```

---

## Upgrades to Build (Priority Order)

---

### Upgrade 1 — Fix Score Bar Colors (Day 1, 30 min)

In `app/review/[id]/page.tsx` and `app/share/[id]/page.tsx`, replace the static `bg-blue-500` on progress bars with:

```ts
function scoreColor(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}
```

Apply to both the bar (`className`) and the score text color. Match exactly what the session scorecard modal does.

---

### Upgrade 2 — Prospect Brief Sidebar (Day 1)

On `app/session/[id]/page.tsx`, the brief is currently shown only as an empty-state card before the first message. Once messages start, it disappears.

Add a collapsible sidebar/panel that shows the prospect brief at all times during an active session:

- Prospect name + role + company
- Trigger event (italic)
- Pain points as a bulleted list
- Personality note
- Difficulty badge

On desktop: fixed right sidebar (280px). On mobile: collapsible panel toggled by an info button in the header.

This gives the user context while they type — critical for the training use case.

---

### Upgrade 3 — Landing Page (`app/landing/page.tsx` or make `app/page.tsx` conditional) (Day 2)

Add a proper landing/hero section above the scenario creation form on the dashboard. It should feel like a real SaaS product:

- Headline: "Practice Sales. Get Scored. Close More."
- Subheadline: "AI prospects that respond in-character. Instant feedback from your AI coach."
- Three feature pills: "3 difficulty levels", "AI-generated prospects", "Instant scorecard"
- A "How it works" section: 3 steps (Create scenario → Practice conversation → Get scored)
- Then the existing scenario creation form and list below

Use only Tailwind. No images needed — use emoji or SVG icons inline.

---

### Upgrade 4 — Session History on Review Page (Day 2)

On `app/review/[id]/page.tsx`, add a "Session Stats" row above the scorecard:

- Total turns (count of SDR messages)
- Difficulty badge
- Date completed
- Prospect company + role from brief

This makes the review page feel like a real performance report, not just a chat log.

---

### Upgrade 5 — Test Suite (Day 3-4)

Install Vitest:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

#### Tests to write:

**`tests/unit/extractJSON.test.ts`** — test `extractJSON` from `prospect.ts`

```ts
// Test cases:
// 1. Valid JSON string → returns parsed object
// 2. JSON wrapped in markdown fences → strips and parses
// 3. Partial JSON with message field → extracts via regex
// 4. Completely invalid → returns { message: rawText, status: "active" }
// 5. JSON with status "completed" → status preserved
```

**`tests/unit/scoreColor.test.ts`** — test the score color helper

```ts
// score >= 7 → "bg-green-500"
// score 4-6 → "bg-yellow-500"
// score < 4 → "bg-red-500"
// score exactly 7 → green
// score exactly 4 → yellow
```

**`tests/unit/feedback.test.ts`** — test `generateFeedback` shape validation

```ts
// Mock callGroq to return known JSON
// Assert all four categories present with score + feedback
// Assert overall is a number
// Assert notes is a string
// Test parseScore with missing fields → defaults to score: 5
```

**`tests/unit/prospectBrief.test.ts`** — test `generateProspectBrief` output shape

```ts
// Mock callGroq to return known JSON
// Assert company, role, painPoints[], triggerEvent, personality are strings/arrays
// Test with missing fields in Groq response → graceful defaults
```

**`tests/integration/api.test.ts`** — test API route logic (mock DB)

```ts
// POST /api/scenarios — missing fields → 400
// POST /api/scenarios — valid body → 201 with id
// POST /api/sessions — missing scenarioId → 400
// POST /api/sessions/[id]/reply — session already completed → 400
// GET /api/sessions/[id]/share — returns session + messages + scenario
```

Add to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

All tests must pass with `npm test` before marking this upgrade done.

---

### Upgrade 6 — `ARCHITECTURE.md` (Day 4)

Create `ARCHITECTURE.md` in the repo root. See the separate `ARCHITECTURE.md` file in this repo for the full content to write. It must cover:

- System overview diagram (ASCII)
- Data flow for each major operation
- AI layer design decisions
- Schema design rationale
- Known limitations and tradeoffs

---

### Upgrade 7 — CSV Export (Day 5)

Add `GET /api/scenarios/[id]/export` route:

- Returns a CSV file with headers: `prospect_name,difficulty,overall_score,opener,qualification,objection_handling,closing,turns,completed_at`
- Only includes completed sessions
- Sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="pitchperfect-export.csv"`

Add an "Export CSV" button to the scenario accordion in `app/page.tsx`. Triggers a download via `window.open(/api/scenarios/${id}/export)`.

---

### Upgrade 8 — Leaderboard / Best Sessions (Day 5)

Add `GET /api/scenarios/[id]/stats` if not already present:

```json
{
  "total": 12,
  "completed": 8,
  "completionRate": 0.67,
  "avgOverallScore": 6.4,
  "avgTurns": 5.2,
  "topSession": {
    "prospectName": "Alex Kumar",
    "score": 9,
    "sessionId": "uuid"
  }
}
```

Show a "Best Session" badge on the scenario card linking to that session's review page.

---

## Error Handling Requirements

Every API route must handle:

- Missing required fields → 400 with `{ error: "field X required" }`
- Session already completed → 400 with `{ error: "Session is already completed" }`
- Groq API failure → 500 with `{ error: "AI service error" }`, never crash silently
- DB connection failure → 500 with error message surfaced in response
- Share page for non-existent session → 404

---

## Scope Boundaries

Do NOT build:

- User authentication or login
- Real LinkedIn or CRM integration
- Voice or audio features
- Multi-user or team features
- Payments or subscription logic
- Any feature not listed in Upgrades 1-8

---

## Error Handling Checklist

Before marking any upgrade done:

- [ ] Score bars use green/yellow/red based on score value (not static blue)
- [ ] `extractJSON` fallback tested — malformed Groq response never crashes the app
- [ ] Session already completed → API returns 400, not 500
- [ ] `generateFeedback` failure → session still closes, feedback stays null, review shows "Feedback unavailable"
- [ ] Share page for missing ID → 404, not crash
- [ ] SDR sends empty string → rejected at API level before Groq is called
- [ ] CSV export only includes completed sessions
- [ ] All Vitest tests pass with `npm test`
