import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, staticFile, spring } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

const stats = [
  { label: "Turns", value: "2" },
  { label: "Difficulty", value: "Medium", highlight: true },
  { label: "Company", value: "ElevateTech" },
  { label: "Role", value: "Dir. of Sales" },
];

const coachText =
  "The SDR did a good job starting with a personalized greeting. Could improve by being more concise and drilling deeper on qualification. Objection handling was strong. Closing could be more value-specific.";

export const ReviewScene: React.FC = () => {
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
    frame: frame - 10,
    fps,
    config: { damping: 18, stiffness: 70 },
    durationInFrames: 35,
  });

  const typeStart = fps * 2.5;
  const typeEnd = fps * 6.5;
  const charsVisible = Math.floor(
    interpolate(frame, [typeStart, typeEnd], [0, coachText.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const coachOpacity = interpolate(frame, [fps * 2.2, fps * 2.6], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
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
          marginBottom: 14,
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
          Review
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
          Full session breakdown
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {stats.map((s, i) => {
          const delay = fps * (0.3 + i * 0.12);
          const sOpacity = interpolate(frame, [delay, delay + fps * 0.4], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const sY = interpolate(frame, [delay, delay + fps * 0.4], [10, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          return (
            <div
              key={s.label}
              style={{
                flex: 1,
                opacity: sOpacity,
                transform: `translateY(${sY}px)`,
                backgroundColor: s.highlight
                  ? "rgba(234,179,8,0.1)"
                  : "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: "10px 14px",
                border: `1px solid ${s.highlight ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontFamily: "system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: s.highlight ? "#eab308" : "#f1f5f9",
                  fontWeight: 600,
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 2,
                }}
              >
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            opacity: interpolate(browserSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(browserSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <BrowserFrame
            src={staticFile("screenshot-review-transcript.png")}
            cropTop={0}
            cropHeight={370}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            width: 260,
            opacity: coachOpacity,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(59,130,246,0.08)",
              borderRadius: 12,
              padding: 16,
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#3b82f6",
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              Coach Notes
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.6,
              }}
            >
              {coachText.slice(0, charsVisible)}
              {charsVisible < coachText.length && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 14,
                    backgroundColor: "#3b82f6",
                    marginLeft: 1,
                    verticalAlign: "middle",
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {["Share Results", "Try Again"].map((label, i) => {
              const btnOpacity = interpolate(
                frame,
                [typeEnd - fps * 0.5 + i * fps * 0.3, typeEnd + i * fps * 0.3],
                [0, 1],
                { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
              );
              return (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    opacity: btnOpacity,
                    backgroundColor: i === 1 ? "#3b82f6" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === 1 ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 7,
                    padding: "8px 0",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === 1 ? "#fff" : "#94a3b8",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
