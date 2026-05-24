import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({}));

const mockFeedbackJSON = JSON.stringify({
  opener: { score: 8, feedback: "Strong personalized opener" },
  qualification: { score: 6, feedback: "Good but missed budget" },
  objectionHandling: { score: 5, feedback: "Needed more confidence" },
  closing: { score: 7, feedback: "Timely close" },
  overall: 7,
  notes: "Solid attempt, work on objection handling",
});

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
