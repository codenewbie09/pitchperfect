import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, staticFile, spring } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

const features = [
  { label: "3 Difficulty Levels", desc: "Easy / Medium / Hard" },
  { label: "AI-Generated Prospects", desc: "Unique personas every time" },
  { label: "Instant Scorecard", desc: "Opener · Qualification · Objections · Closing" },
];

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.6], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.6], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const browserSpring = spring({
    frame: frame - fps * 0.4,
    fps,
    config: { damping: 18, stiffness: 80 },
    durationInFrames: 40,
  });
  const browserY = interpolate(browserSpring, [0, 1], [30, 0]);
  const browserOpacity = interpolate(browserSpring, [0, 1], [0, 1]);

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
          Dashboard
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
          Create a scenario in seconds
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {features.map((f, i) => {
          const cardSpring = spring({
            frame: frame - fps * (0.3 + i * 0.15),
            fps,
            config: { damping: 16, stiffness: 100 },
            durationInFrames: 25,
          });
          const cardY = interpolate(cardSpring, [0, 1], [20, 0]);
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

          return (
            <div
              key={f.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#ffffff",
                  fontWeight: 600,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  marginTop: 3,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          opacity: browserOpacity,
          transform: `translateY(${browserY}px)`,
        }}
      >
        <BrowserFrame
          src={staticFile("screenshot-dashboard.png")}
          cropTop={55}
          cropHeight={430}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};
