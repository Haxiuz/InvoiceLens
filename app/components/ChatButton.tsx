"use client";

import React, { useState } from "react";

export default function ChatButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="chat-button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => alert("AI Chatbot coming soon! 🤖")}
      style={{
        position: "fixed",
        right: 24,
        width: 80,
        height: 80,
        borderRadius: 24, // squircle
        background: "rgba(12, 12, 20, 0.75)",
        backdropFilter: "blur(12px)",
        border: "2px solid var(--accent)",
        boxShadow: isHovered ? "0 0 24px var(--accent-glow)" : "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 9999,
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isHovered ? "scale(1.08) translateY(-4px)" : "scale(1)",
        fontSize: 36,
      }}
    >
      🤖
    </button>
  );
}
