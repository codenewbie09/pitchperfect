# PitchPerfect — Test Suite Specification

This document specifies every test to write. Implement using **Vitest + Testing Library**.

---

## Setup

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

`vitest.config.ts`:
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

`tests/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

`package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Test Files

### `tests/unit/extractJSON.test.ts`

Tests the `extractJSON` function from `lib/prospect.ts`.
You will need to export it: add `export` to the function declaration.

```ts
import { describe, it, expect } from "vitest";
import { extractJSON } from "@/lib/prospect";

describe("extractJSON", () => {
  it("parses clean JSON string", () => {
    const input = '{"message": "Hello", "status": "active"}';
    const result = extractJSON(input);
    expect(result.message).toBe("Hello");
    expect(result.status).toBe("active");
  });

  it("strips markdown fences before parsing", () => {
    const input = '```json\n{"message": "Hi", "status": "active"}\n```';
    // Note: callGroq already strips fences, but extractJSON handles residue
    const result = extractJSON(input);
    expect(result).toBeDefined();
  });

  it("extracts message via regex when JSON is partial", () => {
    const input = '"message": "Nice to meet you", "status": "active"';
    const result = extractJSON(input);
    expect(result.message).toBe("Nice to meet you");
    expect(result.status).toBe("active");
  });

  it("falls back to raw text when all parsing fails", () => {
    const input = "completely invalid {{{";
    const result = extractJSON(input);
    expect(typeof result.message).toBe("string");
    expect(result.status).toBe("active");
  });

  it("preserves status completed when present", () => {
    const input = '"message": "Great talking!", "status": "completed"';
    const result = extractJSON(input);
    expect(result.status).toBe("completed");
  });

  it("defaults status to active when missing", () => {
    const input = '{"message": "Hello"}';
    const result = extractJSON(input);
    expect(result.status).toBe("active");
  });
});
```

---

### `tests/unit/scoreColor.test.ts`

Tests the `scoreColor` helper. Extract it to `lib/utils.ts` and export it:

```ts
export function scoreColor(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}
```

```ts
import { describe, it, expect } from "vitest";
import { scoreColor } from "@/lib/utils";

describe("scoreColor", () => {
  it("returns green for score >= 7", () => {
    expect(scoreColor(7)).toBe("bg-green-500");
    expect(scoreColor(8)).toBe("bg-green-500");
    expect(scoreColor(10)).toBe("bg-green-500");
  });

  it("returns yellow for score 4-6", () => {
    expect(scoreColor(4)).toBe("bg-yellow-500");
    expect(scoreColor(5)).toBe("bg-yellow-500");
    expect(scoreColor(6)).toBe("bg-yellow-500");
  });

  it("returns red for score < 4", () => {
    expect(scoreColor(1)).toBe("bg-red-500");
    expect(scoreColor(3)).toBe("bg-red-500");
  });

  it("boundary: exactly 7 is green not yellow", () => {
    expect(scoreColor(7)).toBe("bg-green-500");
  });

  it("boundary: exactly 4 is yellow not red", () => {
    expect(scoreColor(4)).toBe("bg-yellow-500");
  });
});
```

---

### `tests/unit/feedback.test.ts`

Mocks `callGroq` to test `generateFeedback` output shape and fallback handling.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Groq fetch call
vi.mock("node-fetch", () => ({ default: vi.fn() }));

const mockFeedbackJSON = JSON.stringify({
  opener: { score: 8, feedback: "Strong personalized opener" },
  qualification: { score: 6, feedback: "Good but missed budget" },
  objectionHandling: { score: 5, feedback: "Needed more confidence" },
  closing: { score: 7, feedback: "Timely close" },
  overall: 7,
  notes: "Solid attempt, work on objection handling",
});

// Mock global fetch
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: mockFeedbackJSON } }],
    }),
  } as unknown as Response);
});

describe("generateFeedback", () => {
  it("returns all four score categories", async () => {
    const { generateFeedback } = await import("@/lib/prospect");
    const history = [
      { role: "user", content: "Hi, I saw you recently expanded your team" },
      { role: "assistant", content: "Yeah, we added 10 engineers last month" },
    ];
    const result = await generateFeedback(history);
    expect(result.opener).toHaveProperty("score");
    expect(result.opener).toHaveProperty("feedback");
    expect(result.qualification).toHaveProperty("score");
    expect(result.objectionHandling).toHaveProperty("score");
    expect(result.closing).toHaveProperty("score");
  });

  it("overall is a number between 1 and 10", async () => {
    const { generateFeedback } = await import("@/lib/prospect");
    const history = [{ role: "user", content: "Test" }];
    const result = await generateFeedback(history);
    expect(typeof result.overall).toBe("number");
    expect(result.overall).toBeGreaterThanOrEqual(1);
    expect(result.overall).toBeLessThanOrEqual(10);
  });

  it("notes is a string", async () => {
    const { generateFeedback } = await import("@/lib/prospect");
    const result = await generateFeedback([{ role: "user", content: "Hi" }]);
    expect(typeof result.notes).toBe("string");
  });

  it("defaults score to 5 when field missing from response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"overall": 6, "notes": "ok"}' } }],
      }),
    } as unknown as Response);
    const { generateFeedback } = await import("@/lib/prospect");
    const result = await generateFeedback([{ role: "user", content: "Hi" }]);
    expect(result.opener.score).toBe(5);
    expect(result.opener.feedback).toBe("");
  });
});
```

---

### `tests/unit/prospectBrief.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBriefJSON = JSON.stringify({
  company: "Acme Corp",
  role: "VP of Sales",
  painPoints: ["manual outreach", "no pipeline visibility", "high churn"],
  triggerEvent: "Just raised Series B",
  personality: "Direct and data-driven",
});

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: mockBriefJSON } }],
    }),
  } as unknown as Response);
});

describe("generateProspectBrief", () => {
  it("returns correct shape", async () => {
    const { generateProspectBrief } = await import("@/lib/prospect");
    const result = await generateProspectBrief("Alex Kumar", "VP of Sales at B2B SaaS", "medium");
    expect(result.company).toBe("Acme Corp");
    expect(result.role).toBe("VP of Sales");
    expect(Array.isArray(result.painPoints)).toBe(true);
    expect(result.painPoints).toHaveLength(3);
    expect(typeof result.triggerEvent).toBe("string");
    expect(typeof result.personality).toBe("string");
  });

  it("handles missing fields gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"company": "Test Co"}' } }],
      }),
    } as unknown as Response);
    const { generateProspectBrief } = await import("@/lib/prospect");
    const result = await generateProspectBrief("Jane", "CTO", "easy");
    expect(result.company).toBe("Test Co");
    expect(result.role).toBe("");
    expect(Array.isArray(result.painPoints)).toBe(true);
    expect(result.painPoints).toHaveLength(0);
  });

  it("painPoints is always an array of strings", async () => {
    const { generateProspectBrief } = await import("@/lib/prospect");
    const result = await generateProspectBrief("Bob", "CEO", "hard");
    result.painPoints.forEach((p) => expect(typeof p).toBe("string"));
  });
});
```

---

### `tests/integration/api.scenarios.test.ts`

Mock DB to test API route logic without hitting Neon.

```ts
import { describe, it, expect, vi } from "vitest";

// Mock drizzle db
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: "test-uuid",
          title: "Test Scenario",
          personaDescription: "VP of Sales",
          industry: "SaaS",
          difficulty: "medium",
          createdAt: new Date(),
        }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

describe("POST /api/scenarios", () => {
  it("returns 400 when personaDescription missing", async () => {
    const { POST } = await import("@/app/api/scenarios/route");
    const req = new Request("http://localhost/api/scenarios", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when title missing", async () => {
    const { POST } = await import("@/app/api/scenarios/route");
    const req = new Request("http://localhost/api/scenarios", {
      method: "POST",
      body: JSON.stringify({ personaDescription: "VP of Sales", industry: "SaaS" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns created scenario on valid input", async () => {
    const { POST } = await import("@/app/api/scenarios/route");
    const req = new Request("http://localhost/api/scenarios", {
      method: "POST",
      body: JSON.stringify({
        title: "VP Outreach",
        personaDescription: "VP of Sales at B2B SaaS",
        industry: "SaaS",
        difficulty: "medium",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("test-uuid");
  });
});
```

---

### `tests/integration/api.reply.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prospect", () => ({
  runProspectTurn: vi.fn().mockResolvedValue({ message: "Interesting...", status: "active" }),
  generateFeedback: vi.fn().mockResolvedValue({
    opener: { score: 7, feedback: "Good" },
    qualification: { score: 6, feedback: "Ok" },
    objectionHandling: { score: 5, feedback: "Needs work" },
    closing: { score: 7, feedback: "Timely" },
    overall: 6,
    notes: "Good attempt",
  }),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      sessions: {
        findFirst: vi.fn().mockResolvedValue({
          id: "session-1",
          status: "completed", // already completed
        }),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

describe("POST /api/sessions/[id]/reply", () => {
  it("returns 400 when session is already completed", async () => {
    const { POST } = await import("@/app/api/sessions/[id]/reply/route");
    const req = new Request("http://localhost/api/sessions/session-1/reply", {
      method: "POST",
      body: JSON.stringify({ content: "Let's schedule a call" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never, { params: { id: "session-1" } } as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty", async () => {
    const { POST } = await import("@/app/api/sessions/[id]/reply/route");
    const req = new Request("http://localhost/api/sessions/session-1/reply", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never, { params: { id: "session-1" } } as never);
    expect(res.status).toBe(400);
  });
});
```

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage
```

Expected output when all pass:
```
✓ tests/unit/extractJSON.test.ts (6)
✓ tests/unit/scoreColor.test.ts (5)
✓ tests/unit/generateFeedback.test.ts (4)
✓ tests/unit/generateProspectBrief.test.ts (3)
✓ tests/integration/api.scenarios.test.ts (3)
✓ tests/integration/api.reply.test.ts (2)

Test Files  6 passed (6)
Tests      23 passed (23)
```

---

## What We Don't Test (And Why)

| What | Why not |
|------|---------|
| Groq response quality | Non-deterministic — not meaningful to assert |
| Full UI rendering (E2E) | No Playwright in v1 — scope too large |
| Real DB queries | No Neon test instance — mock DB instead |
| Share page render | Covered by integration test on the API route |
| Score variance across runs | LLM eval variance is expected — document, don't test |
