import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({}));

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
    const result = await generateProspectBrief(
      "Alex Kumar",
      "VP of Sales at B2B SaaS",
      "medium",
    );
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
