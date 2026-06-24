"use client";

import React, { useEffect, useState } from "react";

export default function LogoIcon({ size = 36 }: { size?: number }) {
  const [blinkEnabled, setBlinkEnabled] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'b') {
        setBlinkEnabled(prev => {
          const next = !prev;
          if (next) {
            // Force a blink to show it was enabled
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!blinkEnabled) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.01) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [blinkEnabled]);

  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="logoEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
          <filter id="logoEyeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g style={{ 
          transformOrigin: "50% 50%", 
          transform: isBlinking ? "scaleY(0.1)" : "scaleY(1)", 
          transition: isBlinking ? "transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" 
        }}>
          {/* Outer Eye Shape */}
          <path d="M50 25 C20 25 5 50 5 50 C5 50 20 75 50 75 C80 75 95 50 95 50 C95 50 80 25 50 25 Z" 
                fill="none" stroke="url(#logoEyeGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#logoEyeGlow)"/>
          
          {/* Inner concentric rings */}
          <path d="M50 32 C28 32 15 50 15 50 C15 50 28 68 50 68 C72 68 85 50 85 50 C85 50 72 32 50 32 Z" 
                fill="none" stroke="url(#logoEyeGrad)" strokeWidth="2" opacity="0.6"/>
          <path d="M50 38 C35 38 25 50 25 50 C25 50 35 62 50 62 C65 62 75 50 75 50 C75 50 65 38 50 38 Z" 
                fill="none" stroke="url(#logoEyeGrad)" strokeWidth="2" opacity="0.3"/>
          
          {/* Center Document Icon */}
          <rect x="36" y="32" width="28" height="36" rx="3" fill="url(#logoEyeGrad)" filter="url(#logoEyeGlow)"/>
          <path d="M54 32 v10 h10" fill="none" stroke="var(--surface)" strokeWidth="3" strokeLinejoin="round" />
          <line x1="42" y1="46" x2="58" y2="46" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="54" x2="58" y2="54" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="62" x2="50" y2="62" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
