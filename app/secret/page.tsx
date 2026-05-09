"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SecretPage() {
  const [showContent, setShowContent] = useState(false);
  const [particleCount, setParticleCount] = useState(0);

  useEffect(() => {
    // Verify the secret is unlocked
    if (typeof window !== "undefined" && localStorage.getItem("secretUnlocked") !== "true") {
      window.location.href = "/";
      return;
    }
    const t = setTimeout(() => setShowContent(true), 100);
    // Animate particle count
    let i = 0;
    const iv = setInterval(() => {
      setParticleCount(p => p + 1);
      i++;
      if (i >= 20) clearInterval(iv);
    }, 80);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
      textAlign: "center",
    }}>
      {/* Animated background orbs */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            borderRadius: "50%",
            background: [
              "radial-gradient(circle, rgba(124,110,247,0.25) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(167,139,250,0.20) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
            ][i],
            width: [400, 300, 500, 350, 450, 280][i],
            height: [400, 300, 500, 350, 450, 280][i],
            top: [`${-10 + i * 15}%`, `${30 + i * 10}%`, `${-5 + i * 20}%`, `${50 - i * 8}%`, `${10 + i * 12}%`, `${60 - i * 5}%`][i % 6],
            left: [`${i * 18}%`, `${70 - i * 10}%`, `${40 + i * 5}%`, `${10 + i * 12}%`, `${60 - i * 8}%`, `${30 + i * 7}%`][i % 6],
            animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
      </div>

      {/* Floating emoji confetti */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        {["🎉", "✨", "🌟", "🎊", "💫", "🔮", "🎯", "🏆", "🦄", "🚀", "🌈", "💎", "🎆", "⭐", "🎗️", "🥳", "🎈", "🪄", "🔭", "🧩"].slice(0, particleCount).map((emoji, i) => (
          <div key={i} style={{
            position: "absolute",
            fontSize: `${16 + (i % 4) * 8}px`,
            top: `${5 + (i * 13 + i * i * 3) % 85}%`,
            left: `${3 + (i * 17 + i * 7) % 92}%`,
            animation: `float ${2.5 + (i % 3) * 0.8}s ease-in-out infinite`,
            animationDelay: `${(i % 4) * 0.3}s`,
            opacity: 0.7,
          }}>{emoji}</div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 680 }}>
        <div style={{
          fontSize: 80,
          marginBottom: 24,
          animation: "float 3s ease-in-out infinite",
          filter: "drop-shadow(0 0 20px rgba(124,110,247,0.5))",
        }}>🔮</div>

        <div style={{
          background: "linear-gradient(135deg, rgba(124,110,247,0.12), rgba(167,139,250,0.08), rgba(236,72,153,0.06))",
          border: "1px solid var(--border-lit)",
          borderRadius: "var(--radius-lg)",
          padding: "40px 48px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 60px rgba(124,110,247,0.2), 0 0 120px rgba(167,139,250,0.1)",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{
            display: "inline-block",
            padding: "4px 16px",
            borderRadius: 99,
            background: "linear-gradient(135deg, rgba(124,110,247,0.2), rgba(167,139,250,0.15))",
            border: "1px solid rgba(124,110,247,0.3)",
            fontSize: 11, fontWeight: 600, color: "var(--accent-2)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 20,
          }}>
            🏆 Achievement Unlocked
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 24,
            background: "linear-gradient(135deg, var(--text-1) 0%, var(--accent-2) 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            Congratulations!!! You&apos;re a very curious person and might have gotten here by spamming all combo keybinds that might have existed in this entire world!
          </h1>

          <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Out of all the key combinations in existence — <strong style={{ color: "var(--accent-2)" }}>Alt + 0</strong> was the chosen one.
            Your dedication to exploration is truly remarkable. 🌟
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 20px var(--accent-glow)",
            }}>
              🏠 Go Home
            </Link>
            <Link href="/history" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: "var(--radius-md)",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-1)", textDecoration: "none", fontSize: 14, fontWeight: 500,
            }}>
              <ArrowLeft size={14}/> Back to History
            </Link>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)" }}>
          This page is visible only to the most curious minds 🕵️
        </p>
      </div>
    </div>
  );
}
