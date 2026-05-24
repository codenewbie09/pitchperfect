import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, spring } from "remotion";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
    durationInFrames: 40,
  });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.82, 1]);

  const subtitleOpacity = interpolate(frame, [fps * 0.9, fps * 1.5], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const taglineOpacity = interpolate(frame, [fps * 1.5, fps * 2.2], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const taglineY = interpolate(frame, [fps * 1.5, fps * 2.2], [18, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const dot1 = interpolate(frame, [fps * 2.4, fps * 2.7], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const dot2 = interpolate(frame, [fps * 2.7, fps * 3.0], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const dot3 = interpolate(frame, [fps * 3.0, fps * 3.3], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const glowScale = interpolate(
    Math.sin((frame / fps) * 1.2),
    [-1, 1],
    [0.95, 1.05]
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0a1628 0%, #0f172a 50%, #1a2640 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 560,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.13) 0%, transparent 70%)",
          transform: `scale(${glowScale})`,
          opacity: titleSpring,
        }}
      />

      <div
        style={{
          fontSize: 84,
          fontWeight: 800,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.03em",
          opacity: titleSpring,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
          lineHeight: 1,
        }}
      >
        PitchPerfect
      </div>

      <div
        style={{
          fontSize: 20,
          color: "#64748b",
          marginTop: 16,
          fontFamily: "system-ui, -apple-system, sans-serif",
          opacity: subtitleOpacity,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        AI Sales Roleplay Training
      </div>

      <div
        style={{
          marginTop: 48,
          display: "flex",
          alignItems: "center",
          gap: 0,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        {[
          { text: "Practice", opacity: dot1 },
          { text: "Get Scored", opacity: dot2 },
          { text: "Close More", opacity: dot3 },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span
                style={{
                  color: "#22c55e",
                  fontSize: 22,
                  opacity: item.opacity,
                  marginInline: 14,
                  fontWeight: 700,
                }}
              >
                ·
              </span>
            )}
            <span
              style={{
                fontSize: 20,
                color: i === 2 ? "#22c55e" : "#94a3b8",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: i === 2 ? 700 : 500,
                opacity: item.opacity,
              }}
            >
              {item.text}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
