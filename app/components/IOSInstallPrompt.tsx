"use client";

import { useEffect, useState } from "react";
import { Share, PlusSquare, X } from "lucide-react";
import LogoIcon from "./LogoIcon";

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if on iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;

    // Check if running in standalone mode (installed PWA)
    const isStandalone =
      (window.navigator as any).standalone ||
      window.matchMedia("(display-mode: standalone)").matches;

    // Check if user dismissed it recently
    const dismissedTime = localStorage.getItem("ios-pwa-prompt-dismissed");
    let isDismissedRecently = false;
    if (dismissedTime) {
      const diff = Date.now() - parseInt(dismissedTime, 10);
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      if (diff < fourteenDays) {
        isDismissedRecently = true;
      }
    }

    if (isIOS && !isStandalone && !isDismissedRecently) {
      // Small delay to make it feel natural
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("ios-pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        left: 16,
        right: 16,
        background: "rgba(19, 19, 31, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border-lit)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        boxShadow: "var(--shadow-md), var(--shadow-glow)",
        zIndex: 9999,
        maxWidth: 500,
        margin: "0 auto",
      }}
      className="anim-fade-up"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo representation */}
          <LogoIcon size={36} />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Install InvoiceLens</h3>
            <p style={{ fontSize: 11, color: "var(--text-2)" }}>Add to Home Screen for a native experience</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            cursor: "pointer",
            padding: 4,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface-3)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          aria-label="Dismiss prompt"
        >
          <X size={18} />
        </button>
      </div>

      <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Access features like offline invoice viewing, instant camera scans, and a clean native app shell.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "var(--surface-3)",
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Share size={15} color="var(--accent-2)" />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-1)" }}>
            1. Tap the <strong style={{ color: "var(--text-1)" }}>Share</strong> button in Safari's bottom toolbar
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "var(--surface-3)",
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <PlusSquare size={15} color="var(--accent-2)" />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-1)" }}>
            2. Scroll down and select <strong style={{ color: "var(--text-1)" }}>Add to Home Screen</strong>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button
          onClick={handleDismiss}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-2)",
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-lit)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
