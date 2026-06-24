"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, ScanLine, History, Shield } from "lucide-react";

export default function LandingPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/home");
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading" || sessionStatus === "authenticated") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-3)" }}>Loading…</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* BG gradient */}
      <div aria-hidden style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 600, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,110,247,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", position: "relative", zIndex: 1, width: "100%" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(124,110,247,0.1)", border: "1px solid rgba(124,110,247,0.25)",
              padding: "4px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--accent-2)",
            }}>
              <Zap size={12} /> AI-Powered Invoice Scanner
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.04em", marginBottom: 20,
            background: "linear-gradient(135deg, var(--text-1) 30%, var(--accent-2) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Scan Any Invoice,<br />Instantly.
          </h1>
          <p style={{ color: "var(--text-2)", maxWidth: 520, margin: "0 auto 36px", fontSize: 17, lineHeight: 1.75 }}>
            Upload an invoice image, PDF, Excel, Word, or XML file — Gemini Vision AI reads, parses,
            and structures every field automatically.
          </p>
          <button
            onClick={() => signIn("google")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 32px", borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
              border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 8px 32px var(--accent-glow)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px var(--accent-glow)"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { icon: <ScanLine size={22} color="var(--accent)" />, title: "Multi-format Scanning", desc: "Images, PDFs, Excel, Word, XML — all supported" },
            { icon: <Zap size={22} color="var(--accent-2)" />, title: "Instant AI Extraction", desc: "Gemini Vision AI reads and structures every field automatically" },
            { icon: <History size={22} color="var(--success)" />, title: "Transaction History", desc: "All scanned invoices stored, searchable, and exportable" },
            { icon: <Shield size={22} color="var(--warning)" />, title: "Anomaly Detection", desc: "Flags missing data, mismatches, and potential invoice errors" },
          ].map((f, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "20px",
            }}>
              <div style={{ marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--text-1)" }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
