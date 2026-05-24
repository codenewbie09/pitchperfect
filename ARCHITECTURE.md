# PitchPerfect — Architecture & Design Document

## Overview

PitchPerfect is a B2B SaaS web application for AI-powered sales roleplay training. Users practice cold outreach conversations against AI prospects that respond in-character, then receive structured feedback from an AI sales coach.

**Core value prop:** Practice reps get unlimited realistic prospects, instant scoring, and shareable proof of performance — without scheduling time with a human coach.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  Next.js App Router — React Server + Client Components   │
│                                                          │
│  /              → Dashboard (scenarios + sessions)       │
│  /session/[id]  → Active chat with AI prospect           │
│  /review/[id]   → Scorecard + full transcript            │
│  /share/[id]    → Public read-only view (no auth)        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch)
┌────────────────────────▼────────────────────────────────┐
│                  Next.js API Routes                      │
│  (Node.js serverless functions on Vercel)                │
│                                                          │
│  POST /api/scenarios          → create scenario          │
│  GET  /api/scenarios          → list all                 │
│  POST /api/sessions           → create + generate brief  │
│  GET  /api/sessions?scenarioId→ list for scenario        │
│  GET  /api/sessions/[id]      → single session           │
│  POST /api/sessions/[id]/reply→ SDR turn → prospect turn │
│  GET  /api/sessions/[id]/share→ public share data        │
│  GET  /api/messages?sessionId → message history          │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│   PostgreSQL (Neon)  │   │      Groq API                │
│   Drizzle ORM        │   │  llama-3.1-8b-instant        │
│                      │   │  (fallback: mixtral-8x7b)    │
│  scenarios           │   │                              │
│  sessions            │   │  3 call types:               │
│  messages            │   │  1. generateProspectBrief    │
└─────────────────────┘   │  2. runProspectTurn           │
                           │  3. generateFeedback          │
                           └──────────────────────────────┘
```

---

## Data Flow

### 1. Creating a Scenario
```
User fills form (title, persona, industry, difficulty)
→ POST /api/scenarios
→ INSERT into scenarios
→ Return scenario row
→ Dashboard re-fetches and renders new card
```

### 2. Starting a Session
```
User enters prospect name → clicks "Start Session"
→ POST /api/sessions { scenarioId, prospectName }
→ INSERT session row (status: active)
→ callGroq: generateProspectBrief(name, persona, difficulty)
   ↳ Returns { company, role, painPoints, triggerEvent, personality }
→ UPDATE session.prospectBrief = brief (jsonb)
→ Return session
→ Navigate to /session/[id]
→ User sees prospect brief card, writes first message
```

### 3. Conversation Turn (Critical Path)
```
User types SDR message → clicks Send
→ POST /api/sessions/[id]/reply { content }
→ INSERT message { role: "user", content }
→ runProspectTurn(sessionId):
   → SELECT session + scenario + all messages (ordered by createdAt)
   → Build system prompt with brief + difficulty persona
   → callGroq with full message history
   → extractJSON(raw) with 3-strategy fallback
   → Server-side override: if userMsgs >= 2 AND closingSignal → force "completed"
   → Return { message, status }
→ INSERT message { role: "assistant", content: result.message }
→ If status === "completed":
   → UPDATE sessions.status = "completed"
   → generateFeedback(fullHistory)
   → UPDATE sessions.feedback = scorecard (jsonb)
→ Return { message, status, feedback? }
→ Client re-fetches messages + session
→ If completed: show scorecard modal → navigate to /review/[id]
```

### 4. Generating Feedback
```
generateFeedback(history):
→ Build transcript string (SDR: ... / Prospect: ...)
→ callGroq with sales coach system prompt
→ Rate 4 dimensions: opener, qualification, objection handling, closing
→ Return structured scorecard with scores (1-10) + one-line feedback each
→ Overall score + coach notes
```

### 5. Share Flow
```
User clicks "Share" on review page
→ Copy /share/[id] to clipboard
→ Recipient opens URL (no auth required)
→ GET /api/sessions/[id]/share
→ Returns { session, scenario, messages }
→ Renders transcript + scorecard read-only
```

---

## AI Layer Design

### Why Groq (not OpenAI)
- Free tier with high rate limits — zero cost for development and light production use
- `llama-3.1-8b-instant` is fast enough for real-time chat (< 1s typical)
- OpenAI-compatible API — switching is a one-line model string change

### Why llama-3.1-8b-instant
- Fast enough for real-time UX — latency matters for a chat product
- Free tier — no API cost for the project
- Sufficient capability for structured JSON output with good prompting
- Fallback: `mixtral-8x7b-32768` for better JSON compliance when needed

### JSON Reliability Strategy
Small models don't reliably return pure JSON. Three-layer approach in `extractJSON`:

1. **Direct parse** — try `JSON.parse(raw)` as-is
2. **Wrap attempt** — try `JSON.parse("{" + raw + "}")` for truncated objects
3. **Regex extraction** — pull `message` and `status` fields individually via regex
4. **Final fallback** — use raw text as message, default status to "active"

This means the app never crashes from malformed model output.

### Server-Side Completion Override
The model rarely sets `status: "completed"` on its own — too conservative. Server-side logic overrides this when:
- SDR has sent >= 2 messages (prevents false positives on early closes)
- Any SDR message contains a closing signal keyword

This is intentional — the model handles in-character responses, the server handles state transitions.

### Three-Prompt Architecture
Each Groq call has a distinct role:

| Function | Role | Temp | Max tokens |
|---|---|---|---|
| `generateProspectBrief` | Sales researcher | 0.8 | 200 |
| `runProspectTurn` | In-character prospect | 0.7 | 800 |
| `generateFeedback` | Sales coach evaluator | 0.3 | 400 |

Lower temperature for feedback = more consistent scoring across runs.
Higher temperature for brief = more variety in generated prospects.

---

## Database Schema Design

### Why jsonb for `prospectBrief` and `feedback`
Both fields have nested structure that would require 2-3 extra tables if normalized. Since neither field is queried by its sub-fields (only read/written as a whole), jsonb is the correct choice — simpler schema, no joins, no migrations when the AI output shape evolves.

### Why no `users` table
No auth in v1. This is intentional — adding auth would require session ownership, RLS policies, and login UI. The share link model (anyone with the link can view) is simpler and sufficient for the portfolio use case.

### Relation structure
```
scenarios (1) ──── (many) sessions (1) ──── (many) messages
```
Drizzle relations are defined for `db.query.*` with relational queries — used in `runProspectTurn` to load session+scenario+messages in one query.

---

## Key Design Decisions

### Decision 1: SDR sends first message (not AI)
**Alternative considered:** Auto-generate an opener from the prospect.
**Why rejected:** PitchPerfect is training software. The whole point is the user practices the opener. Having the AI go first removes the most important skill to train.

### Decision 2: Scorecard generated at session end, not on-demand
**Alternative considered:** Generate feedback lazily when the review page loads.
**Why rejected:** Groq latency (~1-2s) on the review page would feel broken. Generating at session close means the review page loads instantly with pre-computed feedback.

### Decision 3: Completion override on server, not in prompt
**Alternative considered:** Better prompt engineering to make the model set status correctly.
**Why rejected:** Small models are inconsistent with status JSON even with good prompts. Server-side deterministic logic is more reliable than prompt iteration for state transitions.

### Decision 4: Full message history in every prospect turn
**Alternative considered:** Sliding window of last N messages.
**Why rejected:** Sales conversations are short (5-15 turns). Full history costs very few tokens and ensures the prospect remembers everything said. No context truncation needed.

### Decision 5: Public share with no auth
**Alternative considered:** Token-based share links with expiry.
**Why rejected:** Unnecessary complexity for v1. The session ID is a UUID — unguessable. Public by default makes sharing frictionless, which is the goal.

---

## Performance Characteristics

| Operation | Typical latency | Bottleneck |
|---|---|---|
| Load dashboard | < 200ms | Neon cold start (serverless) |
| Create scenario | < 100ms | DB insert only |
| Create session + brief | 1-2s | Groq: generateProspectBrief |
| SDR reply → prospect turn | 0.8-1.5s | Groq: runProspectTurn |
| Session close + feedback | 2-4s | Two Groq calls sequential |
| Load review page | < 200ms | DB reads, feedback pre-computed |

### Neon Serverless Cold Start
Neon's serverless driver adds ~100-300ms on first connection in a cold Vercel function. Subsequent requests in the same function instance reuse the connection pool. This is acceptable for the use case.

---

## Known Limitations

### 1. No rate limiting on Groq calls
A user can spam the send button and fire many Groq calls in parallel. Mitigation in UI: the Send button is disabled while `sending === true`. But the API route itself has no rate limit. Fix: add Upstash Redis rate limiting per IP on `/api/sessions/[id]/reply`.

### 2. Feedback scoring is non-deterministic
The same conversation may score slightly differently across runs (temperature: 0.3 helps but doesn't eliminate variance). This is inherent to LLM evaluation. Fix for v2: run feedback 3 times and average the scores.

### 3. Closing signal detection is keyword-based
`runProspectTurn` uses a hardcoded keyword list for completion detection. This misses semantically equivalent phrases ("want to hop on a call?" doesn't contain "call" as a standalone word — wait, it does). Edge cases: "I'll call you back" would not trigger (no meeting context), but "let's get on a call" would. Good enough for v1.

### 4. No session recovery on browser refresh mid-session
If the user refreshes during an active session, the page re-fetches messages correctly. However, the `waitingForAI` state resets to false — if they refresh while waiting for a Groq response, the response will still arrive and be saved to DB, but the UI won't show the typing indicator. Minor UX issue, not a data loss.

### 5. No pagination on message history
Sessions with 50+ messages would load all at once. Unrealistic for current use case (sessions are typically 6-15 turns) but worth noting.
