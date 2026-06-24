"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  Clock, CheckCircle, Activity, ArrowRight,
  PieChart, Building2
} from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";
import EyeLoadingScreen from "../components/EyeLoadingScreen";

interface InvoiceData {
  id: string;
  vendorName: string | null;
  invoiceDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  createdAt: string;
}

function fmt(n: number | null, currency = "IDR"): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }
}

function StatCard({ title, value, sub, icon, trend }: { title: string, value: string, sub: string, icon: React.ReactNode, trend?: "up" | "down" }) {
  return (
    <div className="anim-fade-up" style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: "24px",
      display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-3)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
        <div style={{ padding: 8, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", color: "var(--accent-2)" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)" }}>
        {trend === "up" && <TrendingUp size={14} color="var(--success)" />}
        {trend === "down" && <TrendingDown size={14} color="var(--danger)" />}
        <span style={{ color: trend === "up" ? "var(--success)" : trend === "down" ? "var(--danger)" : "inherit" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customNickname, setCustomNickname] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    setCustomNickname(localStorage.getItem("profileNickname"));
    const handleStorageChange = () => {
      setCustomNickname(localStorage.getItem("profileNickname"));
    };
    window.addEventListener("profileUpdated", handleStorageChange);
    return () => window.removeEventListener("profileUpdated", handleStorageChange);
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/invoices")
      .then(r => r.json())
      .then((data: InvoiceData[]) => {
        setInvoices(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionStatus]);

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated" || loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EyeLoadingScreen pageName="DASHBOARD" />
      </main>
    );
  }

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalSpent = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const avgSpent = totalInvoices > 0 ? totalSpent / totalInvoices : 0;
  
  // Recent invoices
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Top vendor
  const vendorCounts: Record<string, number> = {};
  invoices.forEach(i => {
    if (i.vendorName) {
      vendorCounts[i.vendorName] = (vendorCounts[i.vendorName] || 0) + 1;
    }
  });
  let topVendor = "—";
  let maxCount = 0;
  for (const [v, c] of Object.entries(vendorCounts)) {
    if (c > maxCount) { maxCount = c; topVendor = v; }
  }

  const displayName = customNickname || session?.user?.name?.split(" ")[0] || "User";

  return (
    <main style={{ minHeight: "100vh", padding: "40px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-1)", marginBottom: 8 }}>
            Welcome back, {displayName}
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>
            Here's what's happening with your invoices today.
          </p>
        </div>
        <Link href="/scanner" style={{
          background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
          color: "#fff", padding: "12px 24px", borderRadius: "var(--radius-md)",
          fontWeight: 600, fontSize: 14, textDecoration: "none",
          display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px var(--accent-glow)",
          transition: "transform 0.15s",
        }}>
          <FileText size={16} /> Scan New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard 
          title="Total Spent" 
          value={fmt(totalSpent)} 
          sub="Across all scanned invoices" 
          icon={<DollarSign size={20} />} 
          trend="up" 
        />
        <StatCard 
          title="Total Invoices" 
          value={totalInvoices.toString()} 
          sub="Processed by AI" 
          icon={<CheckCircle size={20} />} 
        />
        <StatCard 
          title="Avg. Invoice Value" 
          value={fmt(avgSpent)} 
          sub="Average spending per invoice" 
          icon={<PieChart size={20} />} 
        />
        <StatCard 
          title="Top Vendor" 
          value={topVendor} 
          sub={`${maxCount} invoices scanned`} 
          icon={<Building2 size={20} />} 
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        {/* Recent Invoices */}
        <div style={{ flex: "1 1 min(100%, 450px)", minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color="var(--accent-2)" /> Recent Scans
            </h2>
            <Link href="/history" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>
              No invoices scanned yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", transition: "background 0.2s" }} className="hover-bg-surface-2">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", flexShrink: 0 }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-1)", fontSize: 14, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.vendorName || "Unknown Vendor"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--text-1)", marginLeft: 8, whiteSpace: "nowrap" }}>
                    {fmt(inv.totalAmount, inv.currency || "IDR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ flex: "1 1 250px", minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 20 }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/scanner" style={{ display: "block", padding: 16, background: "var(--surface-2)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--text-1)", fontWeight: 600, fontSize: 14, border: "1px solid transparent", transition: "border 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-lit)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}><FileText size={16} color="var(--accent)" /> Scan new document</span>
            </Link>
            <Link href="/history" style={{ display: "block", padding: 16, background: "var(--surface-2)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--text-1)", fontWeight: 600, fontSize: 14, border: "1px solid transparent", transition: "border 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-lit)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Clock size={16} color="var(--accent-2)" /> View history</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
