"use client";

import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Moon, Sun, Zap, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatSecretSub = (text: string) => {
    const parts = text.split(/(Alt|9)/g);
    return parts.map((part, index) => {
      if (part === "Alt" || part === "9") {
        return (
          <kbd key={index} style={{ background: "var(--surface-3)", padding: "2px 8px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {part}
          </kbd>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <SettingsIcon size={28} color="var(--accent)" />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t("settings")}</h1>
      </div>

      <div style={{ display: "grid", gap: 24, maxWidth: 600 }}>
        
        {/* Theme Toggle */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px", background: "var(--surface)", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {theme === "dark" ? <Moon size={20} color="var(--accent-2)" /> : <Sun size={20} color="var(--warning)" />}
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", display: "block" }}>{t("appearance")}</span>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{t("appearanceSub")}</span>
            </div>
          </div>
          
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              width: 52, height: 28, borderRadius: 14,
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.3s"
            }}
          >
            <div style={{
              position: "absolute", top: 2, left: theme === "dark" ? 2 : 26,
              width: 22, height: 22, borderRadius: "50%",
              background: "var(--accent-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              color: theme === "dark" ? "#000" : "#fff",
            }} />
          </button>
        </div>

        {/* Secret Feature */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 16,
          padding: "20px", background: "linear-gradient(135deg, rgba(124,110,247,0.05), rgba(167,139,250,0.05))", 
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--border-lit)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "rgba(124,110,247,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Zap size={20} color="var(--accent)" />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", display: "block", marginBottom: 6 }}>{t("secretFeature")}</span>
            <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
              {formatSecretSub(t("secretFeatureSub"))}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
