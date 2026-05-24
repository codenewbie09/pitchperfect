import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, staticFile, spring } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

const perks = [
  { text: "No login required" },
  { text: "Full scorecard included" },
  { text: "Share with managers or coaches" },
];

export const ShareScene: React.FC = () => {
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
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 70 },
    durationInFrames: 35,
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
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
            Share
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
            Share results with anyone
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {perks.map((p, i) => {
            const delay = fps * (0.4 + i * 0.2);
            const pOpacity = interpolate(frame, [delay, delay + fps * 0.4], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });
            const pX = interpolate(frame, [delay, delay + fps * 0.4], [20, 0], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });
            return (
              <div
                key={p.text}
                style={{
                  opacity: pOpacity,
                  transform: `translateX(${pX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  padding: "5px 12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  color: "#94a3b8",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <span>{p.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          opacity: interpolate(browserSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(browserSpring, [0, 1], [24, 0])}px)`,
        }}
      >
        <BrowserFrame
          src={staticFile("screenshot-share.png")}
          cropTop={0}
          cropHeight={400}
          style={{ width: "80%", margin: "0 auto" }}
        />
      </div>
    </div>
  );
};
