import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, spring } from "remotion";

const benefits = [
  "3 difficulty levels — Easy, Medium, Hard",
  "AI prospects with unique personas every session",
  "Instant scorecard: Opener · Qualification · Closing",
];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 35,
  });

  const urlGlow = interpolate(
    Math.sin((frame / fps) * 2.0),
    [-1, 1],
    [0.6, 1.0]
  );

  const urlOpacity = interpolate(frame, [fps * 0.7, fps * 1.2], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0a1628 0%, #0f172a 50%, #1a2640 100%)",
        opacity: containerOpacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 600,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.1) 0%, transparent 70%)",
          opacity: titleSpring,
        }}
      />

      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.02em",
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleSpring, [0, 1], [28, 0])}px)`,
        }}
      >
        Try it yourself
      </div>

      <div
        style={{
          marginTop: 18,
          opacity: urlOpacity,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 12,
            background: `rgba(34,197,94,${0.06 * urlGlow})`,
            filter: "blur(8px)",
          }}
        />
        <div
          style={{
            fontSize: 26,
            color: "#22c55e",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.01em",
            position: "relative",
          }}
        >
          pp-sales.vercel.app
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
        }}
      >
        {benefits.map((b, i) => {
          const delay = fps * (1.2 + i * 0.3);
          const bOpacity = interpolate(frame, [delay, delay + fps * 0.35], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const bX = interpolate(frame, [delay, delay + fps * 0.35], [-24, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: bOpacity,
                transform: `translateX(${bX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "#94a3b8",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <span
                style={{
                  color: "#22c55e",
                  fontSize: 15,
                  fontWeight: 700,
                  width: 18,
                  textAlign: "center",
                }}
              >
                ✓
              </span>
              {b}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#1e293b",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginTop: 52,
          opacity: urlOpacity,
          letterSpacing: "0.05em",
        }}
      >
        Built with Next.js · Drizzle ORM · Neon · Groq
      </div>
    </div>
  );
};
