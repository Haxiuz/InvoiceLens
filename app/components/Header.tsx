"use client";

import { useTheme } from "next-themes";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Menu, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
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
          
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            {/* Boxy Logo */}
            <div style={{
              width: 36, height: 36, borderRadius: 4, // Boxy look (smaller border radius)
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px var(--accent-glow)", fontSize: 18, fontWeight: "bold", color: "#fff"
            }}>IL</div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
              Invoice<span style={{ color: "var(--accent-2)" }}>Lens</span>
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
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
              <LogIn size={14} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

function HeaderUserArea({ session }: { session: any }) {
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
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}
