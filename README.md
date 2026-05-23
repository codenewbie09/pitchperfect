# PitchPerfect — AI Sales Roleplay Training

Practice sales conversations against AI prospects that respond in-character based on their persona, pain points, and personality. Get scored on opener quality, qualification, objection handling, and closing technique.

## Live Demo

https://leadwire-beta.vercel.app

## What it does

- Create scenarios with a target persona description and difficulty level
- AI generates a realistic prospect brief (company, role, pain points, trigger event, personality)
- You play the SDR and send the first message
- AI responds in-character based on the brief and difficulty
- Session auto-completes when the SDR proposes a meeting
- AI delivers a scorecard: opener, qualification, objection handling, closing, overall
- Shareable review links for completed sessions
- CSV export of all sessions

## Stack

Next.js (App Router) -- TypeScript -- Tailwind CSS -- Drizzle ORM -- PostgreSQL (Neon) -- Groq API -- Vercel

## Run locally

```bash
git clone https://github.com/codenewbie09/leadwire
cd leadwire
npm install
cp .env.example .env.local

# Fill in DATABASE_URL and GROQ_API_KEY

npx drizzle-kit migrate
npm run dev
```
