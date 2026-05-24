# PitchPerfect — AI Sales Roleplay Training

## Product Pivot

Leadwire was an AI SDR that reached out to prospects. PitchPerfect flips the model: the human plays the SDR, and the AI plays the prospect. This turns the tool into a sales roleplay training platform for SDR teams to practice conversations, handle objections, and improve closing technique.

## MVP Scope

- Single mode (AI-as-prospect only)
- Custom scenario creation
- Prospect brief generation per session
- Chat: user sends opener, AI responds in-character
- Feedback scorecard at session end (opener, qualification, objection handling, closing, overall)
- Dashboard with kanban views and per-scenario stats
- Difficulty levels (easy / medium / hard)
- Shareable review link (`/session/[id]/review`)
- CSV export of sessions

## Data Model

### `scenarios` (was `campaigns`)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| title | text | NEW — human-readable scenario name |
| personaDescription | text | kept from campaigns |
| industry | text | NEW |
| difficulty | text | NEW — "easy" \| "medium" \| "hard" |
| createdAt | timestamp | kept |

### `sessions` (was `conversations`)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| scenarioId | uuid | FK → scenarios.id (was campaignId) |
| status | session_status | "active" \| "completed" (was: active/booked/rejected) |
| prospectBrief | jsonb | NEW from generateProspectBrief |
| feedback | jsonb | NEW from generateFeedback |
| prospectName | text | kept (represents the fake prospect) |
| createdAt | timestamp | kept |

### `messages` — unchanged but role semantics change

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| sessionId | uuid | FK → sessions.id (was conversationId) |
| role | text | "user" = trainee SDR, "assistant" = AI prospect, "system" = feedback |
| content | text | |
| createdAt | timestamp | |

## Migration

Drop old tables and types, create new ones. Old data is test data — no preservation needed.

## Agent Architecture

### `lib/prospect.ts` (replaces `lib/agent.ts`)

**`generateProspectBrief(name, persona, difficulty)`** → `ProspectBrief`
- Called once per session creation
- One Groq call, returns: `{ company, role, painPoints[], triggerEvent, personality }`

**`runProspectTurn(sessionId, userMessage)`** → `{ message, status }`
- AI responds as the prospect, in-character from the brief + difficulty
- If the user closes / books → status = "completed"
- If the user disengages / prospect would walk → status = "completed"
- After status flips → auto-generate feedback

**`generateFeedback(history)`** → `FeedbackScorecard`
- One Groq call with full history + rubric
- Returns: `{ opener: {score, feedback}, qualification, objectionHandling, closing, overall, notes }`
- Stored in `sessions.feedback`

### Difficulty Levels

| Level | Behavior | Brief |
|-------|----------|-------|
| Easy | Cooperative, direct answers, clear buying signals, easy to book | Enthusiastic buyer, obvious pain |
| Medium | Neutral, counter-questions, needs 2-3 qualifying attempts | Busy exec, some skepticism |
| Hard | Skeptical, challenges claims, objects on price/competitors/timing | C-level, seen 10 pitches this week |

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | /api/scenarios | List all / create scenario |
| GET | /api/sessions?scenarioId= | List sessions for a scenario |
| POST | /api/sessions | Create session + generate brief |
| POST | /api/sessions/[id]/reply | User sends a message, AI responds |
| GET | /api/sessions/[id] | Fetch session with feedback |
| GET | /api/messages?sessionId= | Fetch message history |
| GET | /api/export?scenarioId= | CSV download |
| DELETE | /api/scenarios/[id] | Delete scenario + cascade |

## Pages

| Route | Content |
|-------|---------|
| `/` | Dashboard — kanban (Active / Completed), scenario cards, create form |
| `/session/[id]` | Chat — user types opener, AI responds, scorecard on completion |
| `/session/[id]/review` | Read-only transcript + scorecard (shareable) |

## Implementation Order

1. Data model — migration, drizzle schema
2. Groq prospect functions — brief, turn, feedback
3. API routes — scenarios, sessions, messages, export
4. Dashboard UI — kanban, scenario cards, creation form
5. Chat UI — conversation view, typing indicator, first-turn swap
6. Scorecard — feedback display after session ends
7. Review page — `/session/[id]/review`
8. Polish — CSV export, error states, empty states
