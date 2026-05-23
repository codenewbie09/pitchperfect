# Leadwire — LinkedIn Outreach Agent

An AI agent that runs LinkedIn DM conversations, qualifies prospects, and books meetings.

## Live Demo

[https://leadwire-beta.vercel.app](https://leadwire-beta.vercel.app)

## What it does

- Create a campaign with a target persona description
- Start conversations with named prospects
- AI agent handles qualification across multiple turns
- Conversation closes as Booked or Rejected

## Stack

Next.js · TypeScript · Drizzle ORM · PostgreSQL (Neon) · OpenRouter (free models) · Vercel

## Run locally

```bash
git clone https://github.com/codenewbie09/leadwire
cd leadwire
npm install
cp .env.example .env.local

# Fill in DATABASE_URL and OPENROUTER_API_KEY

npx drizzle-kit migrate
npm run dev
```
