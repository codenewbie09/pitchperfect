import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, staticFile, spring } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

const categories = [
  { name: "Opener", score: 8, note: "Strong greeting, showed understanding of pain point" },
  { name: "Qualification", score: 8, note: "Uncovered pain point, could drill deeper on budget" },
  { name: "Objection Handling", score: 9, note: "Handled objections smoothly with specific solutions" },
  { name: "Closing", score: 7, note: "Asked for meeting, but could specify more value" },
];

function barColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#eab308";
  return "#ef4444";
}

export const ScorecardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.5], [16, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const browserSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, stiffness: 70 },
    durationInFrames: 35,
  });

  const scoreCount = interpolate(frame, [fps * 1.2, fps * 2.0], [0, 8], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const overallSpring = spring({
    frame: frame - fps * 1.0,
    fps,
    config: { damping: 12, stiffness: 90 },
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(145deg, #0a1628 0%, #0f172a 50%, #1a2640 100%)",
        padding: "32px 40px 28px",
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#22c55e",
            fontFamily: "monospace",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Scorecard
        </span>
        <div
          style={{
            fontSize: 30,
            color: "#ffffff",
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: 4,
            letterSpacing: "-0.01em",
          }}
        >
          Instant AI-powered feedback
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 24, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            opacity: interpolate(browserSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(browserSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <BrowserFrame
            src={staticFile("screenshot-session.png")}
            cropTop={0}
            cropHeight={400}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            width: 290,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "18px 20px",
              backgroundColor: "rgba(34,197,94,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(34,197,94,0.25)",
              opacity: interpolate(overallSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(overallSpring, [0, 1], [0.88, 1])})`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                fontFamily: "system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Overall Score
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: "#22c55e",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1,
              }}
            >
              {Math.round(scoreCount)}
              <span style={{ fontSize: 24, color: "#334155", fontWeight: 500 }}>/10</span>
            </div>
          </div>

          {categories.map((cat, i) => {
            const delay = fps * (2.2 + i * 0.35);
            const opacity = interpolate(frame, [delay, delay + fps * 0.4], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });
            const barW = interpolate(frame, [delay + 6, delay + fps * 0.7], [0, (cat.score / 10) * 100], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });

            return (
              <div key={cat.name} style={{ opacity }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#cbd5e1", fontFamily: "system-ui, sans-serif", fontWeight: 500 }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: barColor(cat.score), fontFamily: "system-ui, sans-serif" }}>
                    {cat.score}/10
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barW}%`,
                      backgroundColor: barColor(cat.score),
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>
                  {cat.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
