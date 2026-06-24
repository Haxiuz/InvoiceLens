"use client";

import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { X, FileText, Settings, User, BarChart2, Sparkles, ScanLine, Home } from "lucide-react";
import LogoIcon from "./LogoIcon";
import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if secret was already unlocked
    if (typeof window !== "undefined") {
      setSecretUnlocked(localStorage.getItem("secretUnlocked") === "true");
    }

    // Listen for Alt+0 to unlock the secret
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "0") {
        e.preventDefault();
        if (localStorage.getItem("secretUnlocked") !== "true") {
          localStorage.setItem("secretUnlocked", "true");
          setSecretUnlocked(true);
          // Brief flash notification
          const toast = document.createElement("div");
          toast.textContent = "🔮 Secret unlocked!";
          Object.assign(toast.style, {
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #7c6ef7, #a78bfa)",
            color: "#fff", padding: "12px 24px", borderRadius: "99px",
            fontWeight: "600", fontSize: "14px", zIndex: "9999",
            boxShadow: "0 4px 24px rgba(124,110,247,0.4)",
            animation: "none",
          });
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2500);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!mounted) return null;

  const navLinkStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    background: "var(--surface-2)", borderRadius: "var(--radius-md)",
    color: "var(--text-1)", textDecoration: "none", fontWeight: 500,
    border: "1px solid var(--border)", transition: "all 0.2s",
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
            animation: "fadeIn 0.3s ease-out",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 320,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 100,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isOpen ? "var(--shadow-md)" : "none",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon size={32} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-1)" }}>{t("menu")}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "transparent", border: "none", color: "var(--text-2)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              padding: 4, borderRadius: "50%", transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{t("menu")}</p>

          {session ? (
            <>
              <Link href="/home" onClick={() => setIsOpen(false)} style={{
                ...navLinkStyle,
                background: "linear-gradient(135deg, rgba(124,110,247,0.12), rgba(167,139,250,0.07))",
                borderColor: "rgba(124,110,247,0.3)",
              }}>
                <Home size={18} color="var(--accent)" />
                Home
              </Link>
              <Link href="/scanner" onClick={() => setIsOpen(false)} style={navLinkStyle}>
                <ScanLine size={18} color="var(--accent)" />
                Scanner
              </Link>
              <Link href="/history" onClick={() => setIsOpen(false)} style={navLinkStyle}>
                <FileText size={18} color="var(--accent)" />
                {t("history")}
              </Link>
              <Link href="/profile" onClick={() => setIsOpen(false)} style={navLinkStyle}>
                <User size={18} color="var(--accent)" />
                {t("profile")}
              </Link>
              <Link href="/reports" onClick={() => setIsOpen(false)} style={navLinkStyle}>
                <BarChart2 size={18} color="var(--accent)" />
                {t("reports")}
              </Link>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Sign in to view navigation.</p>
          )}
        </div>

        {/* Preferences */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{t("settings")}</p>
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            style={navLinkStyle}
          >
            <Settings size={18} color="var(--accent)" />
            {t("settings")}
          </Link>
        </div>

        {/* Secret section — only visible after Alt+0 */}
        {secretUnlocked && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(167,139,250,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              ✦ Hidden
            </p>
            <Link
              href="/secret"
              onClick={() => setIsOpen(false)}
              style={{
                ...navLinkStyle,
                background: "linear-gradient(135deg, rgba(124,110,247,0.08), rgba(167,139,250,0.05))",
                borderColor: "rgba(124,110,247,0.3)",
                color: "var(--accent-2)",
              }}
            >
              <Sparkles size={18} color="var(--accent-2)" />
              ???
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
