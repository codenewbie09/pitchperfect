import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prospect", () => ({
  runProspectTurn: vi
    .fn()
    .mockResolvedValue({ message: "Interesting...", status: "active" }),
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
          status: "completed",
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
    const { POST } = await import(
      "@/app/api/sessions/[id]/reply/route"
    );
    const req = new Request(
      "http://localhost/api/sessions/session-1/reply",
      {
        method: "POST",
        body: JSON.stringify({ content: "Let's schedule a call" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req as never, {
      params: { id: "session-1" },
    } as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty", async () => {
    const { POST } = await import(
      "@/app/api/sessions/[id]/reply/route"
    );
    const req = new Request(
      "http://localhost/api/sessions/session-1/reply",
      {
        method: "POST",
        body: JSON.stringify({ content: "" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req as never, {
      params: { id: "session-1" },
    } as never);
    expect(res.status).toBe(400);
  });
});
