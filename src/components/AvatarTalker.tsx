"use client";
import React from "react";

export function AvatarTalker({ level }: { level: number }) {
  // level: 0..1
  const mouth = Math.max(6, Math.min(28, 6 + level * 22));

  return (
    <div
      style={{
        width: 300,
        borderRadius: 18,
        border: "1px solid #eee",
        padding: 14,
        background: "white",
        boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 10 }}>AI Buyer Avatar</div>

      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: 22,
          border: "1px solid #eee",
          display: "grid",
          placeItems: "center",
          background: "white",
        }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="92" fill="#f6f6f6" stroke="#e6e6e6" />
          {/* eyes */}
          <circle cx="80" cy="95" r="8" fill="#111" />
          <circle cx="140" cy="95" r="8" fill="#111" />
          {/* brows */}
          <path
            d="M65 78 Q80 68 95 78"
            stroke="#111"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M125 78 Q140 68 155 78"
            stroke="#111"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* mouth */}
          <rect x="85" y="135" width="50" height={mouth} rx="10" fill="#111" />
          {/* subtle chin */}
          <path
            d="M85 175 Q110 190 135 175"
            stroke="#ddd"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Voice style: mature/pro
      </div>
    </div>
  );
}
