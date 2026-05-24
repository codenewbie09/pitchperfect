import React from "react";
import { Img } from "remotion";

interface BrowserFrameProps {
  src: string;
  style?: React.CSSProperties;
  cropTop?: number;
  cropHeight?: number;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  src,
  style,
  cropTop = 0,
  cropHeight,
}) => {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
        ...style,
      }}
    >
      <div
        style={{
          height: 36,
          backgroundColor: "#1e293b",
          display: "flex",
          alignItems: "center",
          paddingLeft: 14,
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#ef4444" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#eab308" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#22c55e" }} />
        <div
          style={{
            flex: 1,
            marginLeft: 12,
            marginRight: 40,
            height: 22,
            borderRadius: 6,
            backgroundColor: "#334155",
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
            fontSize: 11,
            color: "#94a3b8",
            fontFamily: "monospace",
          }}
        >
          https://pp-sales.vercel.app
        </div>
      </div>

      <div
        style={{
          overflow: "hidden",
          height: cropHeight ?? "auto",
          position: "relative",
        }}
      >
        <Img
          src={src}
          style={{
            width: "100%",
            display: "block",
            verticalAlign: "bottom",
            marginTop: cropTop ? -cropTop : 0,
          }}
        />
      </div>
    </div>
  );
};
