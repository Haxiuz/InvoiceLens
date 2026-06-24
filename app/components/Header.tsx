"use client";

import { useTheme } from "next-themes";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Menu, LogIn, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useLanguage } from "./LanguageProvider";
import LogoIcon from "./LogoIcon";
import { Language } from "@/lib/translation";

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const langNames: Record<Language, { label: string; flag: string }> = {
    en: { label: "English", flag: "🇺🇸" },
    id: { label: "Bahasa Indonesia", flag: "🇮🇩" },
    es: { label: "Español", flag: "🇪🇸" },
    pt: { label: "Português", flag: "🇵🇹" },
    zh: { label: "中文", flag: "🇨🇳" },
    ru: { label: "Русский", flag: "🇷🇺" },
    ar: { label: "العربية", flag: "🇸🇦" },
    de: { label: "Deutsch", flag: "🇩🇪" },
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-2)",
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--border-lit)";
          e.currentTarget.style.color = "var(--text-1)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-2)";
        }}
      >
        <span style={{ fontSize: 14 }}>{langNames[language]?.flag}</span>
        <span style={{ textTransform: "uppercase" }}>{language}</span>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
          />
          <div
            style={{
              position: "absolute",
              right: language === "ar" ? undefined : 0,
              left: language === "ar" ? 0 : undefined,
              top: "calc(100% + 6px)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 160,
              zIndex: 999,
              animation: "fadeIn 0.15s ease-out",
            }}
          >
            {(Object.keys(langNames) as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: language === lang ? "var(--surface-3)" : "transparent",
                  color: language === lang ? "var(--accent-2)" : "var(--text-2)",
                  fontSize: 13,
                  fontWeight: language === lang ? 600 : 400,
                  textAlign: language === "ar" ? "right" : "left",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--surface-2)";
                  e.currentTarget.style.color = "var(--text-1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = language === lang ? "var(--surface-3)" : "transparent";
                  e.currentTarget.style.color = language === lang ? "var(--accent-2)" : "var(--text-2)";
                }}
              >
                <span>{langNames[lang].flag}</span>
                <span>{langNames[lang].label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <header className="anim-fade-in" style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--header-bg, rgba(12,12,20,0.85))",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 32px",
      paddingTop: "env(safe-area-inset-top)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "transparent", border: "none", color: "var(--text-1)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 6, borderRadius: "var(--radius-sm)", transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          
          <Link href={session ? "/home" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon size={36} />
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
              Invoice<span style={{ color: "var(--accent-2)" }}>Lens</span>
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Auth */}
          {session ? (
            <HeaderUserArea session={session} />
          ) : (
            <button
              onClick={() => signIn("google")}
              style={{
                background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                color: "var(--text-1)", padding: "6px 12px", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontWeight: 500
              }}
            >
              <LogIn size={14} /> {t("signIn")}
            </button>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

function HeaderUserArea({ session }: { session: any }) {
  const { t } = useLanguage();
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customNickname, setCustomNickname] = useState<string | null>(null);

  useEffect(() => {
    const avatar = localStorage.getItem("profileAvatar");
    const nickname = localStorage.getItem("profileNickname");
    setCustomAvatar(avatar);
    setCustomNickname(nickname);

    const handleUpdate = () => {
      setCustomAvatar(localStorage.getItem("profileAvatar"));
      setCustomNickname(localStorage.getItem("profileNickname"));
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("profileUpdated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("profileUpdated", handleUpdate);
    };
  }, []);

  const avatarSrc = customAvatar || session?.user?.image;
  const displayName = customNickname || session?.user?.name || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border)", objectFit: "cover" }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#fff",
        }}>
          {initials}
        </div>
      )}
      {customNickname && (
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{customNickname}</span>
      )}
      <button
        onClick={() => signOut()}
        style={{
          background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          color: "var(--text-2)", padding: "6px 12px", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}
      >
        <LogOut size={14} /> {t("logout")}
      </button>
    </div>
  );
}
