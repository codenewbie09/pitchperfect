import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({}));

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

  it("status is undefined when not present in parsed JSON", () => {
    const input = '{"message": "Hello"}';
    const result = extractJSON(input);
    expect(result.status).toBeUndefined();
  });
});
