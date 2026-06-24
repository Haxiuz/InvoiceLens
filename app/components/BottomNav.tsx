"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BarChart2, User } from "lucide-react";

import { useSession } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/home",    label: "Home",    icon: Home },
  { href: "/history", label: "History", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(12,12,20,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        zIndex: 80,
        paddingTop: 4,
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              flex: 1,
              padding: "8px 0",
              textDecoration: "none",
              color: active ? "var(--accent-2)" : "var(--text-3)",
              transition: "color 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {active && (
                <div style={{
                  position: "absolute",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(124,110,247,0.12)",
                }} />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              letterSpacing: "0.02em",
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
