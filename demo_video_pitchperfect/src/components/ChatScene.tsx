import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, staticFile, spring } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

const messages = [
  {
    role: "user",
    name: "You (SDR)",
    text: "Hi Sarah, I understand you recently acquired a new sales team. How are you currently handling performance tracking across your teams?",
  },
  {
    role: "prospect",
    name: "Sarah Chen",
    text: "We're still trying to get our arms around it. Our current system is manual and relies heavily on spreadsheets...",
  },
  {
    role: "user",
    name: "You (SDR)",
    text: "Our platform provides real-time pipeline visibility and automates reporting across teams. Would you be open to a quick demo next week?",
  },
  {
    role: "prospect",
    name: "Sarah Chen",
    text: "I'd be interested — can you tell me more about how you handle data accuracy?",
  },
];

const TypingDots: React.FC<{ frame: number; fps: number; startFrame: number }> = ({
  frame,
  fps,
  startFrame,
}) => {
  const visible = frame >= startFrame && frame < startFrame + fps * 1.2;
  if (!visible) return null;
  const dot = (delay: number) =>
    interpolate(
      Math.sin(((frame - startFrame) / fps) * Math.PI * 3 + delay),
      [-1, 1],
      [0.3, 1]
    );
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        padding: "6px 10px",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#64748b",
            opacity: dot(i * 1),
          }}
        />
      ))}
    </div>
  );
};

export const ChatScene: React.FC = () => {
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

  const msgTimings = [fps * 0.8, fps * 2.4, fps * 4.2, fps * 6.0];
  const typingFrames = [null, fps * 1.4, null, fps * 5.0];

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
          Live Session
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
          Practice against AI prospects
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: 4,
          }}
        >
          AI responds in-character based on persona, pain points, and personality
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            opacity: interpolate(browserSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(browserSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <BrowserFrame
            src={staticFile("screenshot-session.png")}
            cropTop={0}
            cropHeight={390}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            width: 268,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {messages.map((msg, i) => {
            const msgFrame = msgTimings[i];
            const opacity = interpolate(frame, [msgFrame, msgFrame + 10], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });
            const y = interpolate(frame, [msgFrame, msgFrame + 14], [14, 0], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });

            const isUser = msg.role === "user";

            return (
              <React.Fragment key={i}>
                {!isUser && typingFrames[i] != null && (
                  <TypingDots frame={frame} fps={fps} startFrame={typingFrames[i]!} />
                )}
                <div
                  style={{
                    opacity,
                    transform: `translateY(${y}px)`,
                    backgroundColor: isUser
                      ? "rgba(34,197,94,0.14)"
                      : "rgba(255,255,255,0.05)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    border: `1px solid ${isUser ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: isUser ? "#22c55e" : "#64748b",
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      marginBottom: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {msg.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#cbd5e1",
                      fontFamily: "system-ui, sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
