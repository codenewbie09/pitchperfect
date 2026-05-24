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
