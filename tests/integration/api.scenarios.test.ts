import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user" } }),
}));

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([
            {
              id: "test-uuid",
              title: "Test Scenario",
              personaDescription: "VP of Sales",
              industry: "SaaS",
              difficulty: "medium",
              createdAt: new Date(),
            },
          ]),
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
      body: JSON.stringify({
        personaDescription: "VP of Sales",
        industry: "SaaS",
      }),
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
