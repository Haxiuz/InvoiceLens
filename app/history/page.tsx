"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, Trash2, Scissors, ChevronRight, Edit2, TrendingUp, FileText, Users, Calendar, Receipt, FileDown, CheckCircle } from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";
import EyeLoadingScreen from "../components/EyeLoadingScreen";

interface InvoiceRecord {
  id: string;
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  dataJson: string | null;
  createdAt: string;
}

interface ParsedData {
  subtotal?: number | null;
  tax_amount?: number | null;
}

function parseInvoiceData(record: InvoiceRecord): ParsedData {
  try {
    if (record.dataJson) return JSON.parse(record.dataJson);
  } catch {}
  return {};
}

function fmtCurrency(n: number | null | undefined, currency: string | null) {
  if (n == null) return <span style={{ color: "var(--text-3)" }}>—</span>;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }
}

function fmtCurrencyStr(n: number): string {
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }
}

function InsightCard({ icon, label, value, color = "var(--accent)" }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeduping, setIsDeduping] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "date" | "amount">("default");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch invoices: ${res.status} ${text}`);
          }
          return res.json();
        })
        .then(data => {
          setInvoices(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching invoices:", err);
          setLoading(false);
        });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const sortedInvoices = useMemo(() => {
    let sorted = [...invoices];
    if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.invoiceDate || 0).getTime() - new Date(a.invoiceDate || 0).getTime());
    } else if (sortBy === "amount") {
      sorted.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }
    return sorted;
  }, [invoices, sortBy]);

  const totalSum = useMemo(() => sortedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0), [sortedInvoices]);
  const totalVAT = useMemo(() => sortedInvoices.reduce((sum, inv) => {
    const d = parseInvoiceData(inv);
    return sum + (d.tax_amount || 0);
  }, 0), [sortedInvoices]);
  const totalBase = useMemo(() => sortedInvoices.reduce((sum, inv) => {
    const d = parseInvoiceData(inv);
    return sum + (d.subtotal || 0);
  }, 0), [sortedInvoices]);

  const avgAmount = useMemo(() =>
    sortedInvoices.length > 0 ? totalSum / sortedInvoices.length : 0,
    [totalSum, sortedInvoices]);

  const topVendor = useMemo(() => {
    const counts: Record<string, number> = {};
    sortedInvoices.forEach(inv => {
      if (inv.vendorName) counts[inv.vendorName] = (counts[inv.vendorName] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return "—";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [sortedInvoices]);

  const dateRange = useMemo(() => {
    const dates = sortedInvoices
      .map(inv => inv.invoiceDate)
      .filter(Boolean)
      .sort() as string[];
    if (dates.length === 0) return "—";
    if (dates.length === 1) return dates[0];
    return `${dates[0]} → ${dates[dates.length - 1]}`;
  }, [sortedInvoices]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (e: any) {
      alert(`Error deleting invoice: ${e.message}`);
    }
    setLoading(false);
  };

  const handleRemoveDuplicates = async () => {
    if (isDeduping) return;
    if (!confirm("Scan for and auto-delete all exact duplicate invoices?")) return;
    setIsDeduping(true);

    const seen = new Set();
    const duplicates: string[] = [];

    for (const inv of sortedInvoices) {
      const sig = `${inv.vendorName}_${inv.invoiceDate}_${inv.totalAmount}_${inv.invoiceNumber}`;
      if (seen.has(sig)) {
        duplicates.push(inv.id);
      } else {
        seen.add(sig);
      }
    }

    if (duplicates.length === 0) {
      setToastMsg("No duplicate invoices found!");
      setTimeout(() => setToastMsg(""), 4000);
      setIsDeduping(false);
      return;
    }

    let deletedCount = 0;
    const successfulDeletes: string[] = [];

    for (const id of duplicates) {
      try {
        const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
        if (res.ok) {
          deletedCount++;
          successfulDeletes.push(id);
        } else {
          console.error("Failed to delete", id);
        }
      } catch (e) {
        console.error("Failed to delete", id, e);
      }
    }

    setInvoices(prev => prev.filter(inv => !successfulDeletes.includes(inv.id)));
    setIsDeduping(false);

    if (deletedCount > 0) {
      setToastMsg(`Successfully removed ${deletedCount} duplicate invoice(s)!`);
      setTimeout(() => setToastMsg(""), 4000);
    } else {
      setToastMsg("Failed to delete duplicates. Please try again.");
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historical Transactions", 14, 15);
    autoTable(doc, {
      head: [["Date", "Vendor", "Invoice #", "Base Price", "VAT", "Amount"]],
      body: sortedInvoices.map(inv => {
        const d = parseInvoiceData(inv);
        const formatRp = (val: number | null | undefined) => {
          if (val == null) return "—";
          return `Rp ${new Intl.NumberFormat("id-ID").format(val)}`;
        };
        return [
          inv.invoiceDate || "—",
          inv.vendorName || "—",
          inv.invoiceNumber || "—",
          formatRp(d.subtotal),
          formatRp(d.tax_amount),
          formatRp(inv.totalAmount),
        ];
      }),
      startY: 20,
    });
    doc.save("transactions.pdf");
  };

  const exportExcel = () => {
    const data = sortedInvoices.map(inv => {
      const d = parseInvoiceData(inv);
      return {
        Date: inv.invoiceDate || "—",
        Vendor: inv.vendorName || "—",
        "Invoice #": inv.invoiceNumber || "—",
        "Base Price": d.subtotal ?? 0,
        VAT: d.tax_amount ?? 0,
        Amount: inv.totalAmount || 0,
        Currency: "IDR",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  const exportXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Transactions>\n`;
    sortedInvoices.forEach(inv => {
      const d = parseInvoiceData(inv);
      xml += `  <Transaction>\n`;
      xml += `    <Date>${inv.invoiceDate || ""}</Date>\n`;
      xml += `    <Vendor>${inv.vendorName || ""}</Vendor>\n`;
      xml += `    <InvoiceNumber>${inv.invoiceNumber || ""}</InvoiceNumber>\n`;
      xml += `    <BasePrice>${d.subtotal ?? 0}</BasePrice>\n`;
      xml += `    <VAT>${d.tax_amount ?? 0}</VAT>\n`;
      xml += `    <Amount>${inv.totalAmount || 0}</Amount>\n`;
      xml += `    <Currency>IDR</Currency>\n`;
      xml += `  </Transaction>\n`;
    });
    xml += `</Transactions>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.xml";
    a.click();
    URL.revokeObjectURL(url);
  };



  if (loading || status === "loading") {
    return (
      <div style={{ padding: "40px 24px", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <EyeLoadingScreen />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <div style={{ padding: "40px", textAlign: "center" }}>Please log in to view your history.</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

      {/* ── INSIGHT CARDS ── */}
      {sortedInvoices.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
            Overview
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <InsightCard
              icon={<TrendingUp size={16} color="var(--accent)" />}
              label="Total Spend"
              value={fmtCurrencyStr(totalSum)}
              color="var(--accent)"
            />
            <InsightCard
              icon={<Receipt size={16} color="var(--success)" />}
              label="Invoices"
              value={`${sortedInvoices.length} records`}
              color="var(--success)"
            />
            <InsightCard
              icon={<TrendingUp size={16} color="var(--accent-2)" />}
              label="Avg Invoice"
              value={fmtCurrencyStr(avgAmount)}
              color="var(--accent-2)"
            />
            <InsightCard
              icon={<Users size={16} color="var(--warning)" />}
              label="Top Vendor"
              value={topVendor}
              color="var(--warning)"
            />
            <InsightCard
              icon={<FileText size={16} color="var(--danger)" />}
              label="Total VAT Paid"
              value={fmtCurrencyStr(totalVAT)}
              color="var(--danger)"
            />
            <InsightCard
              icon={<Calendar size={16} color="var(--text-2)" />}
              label="Date Range"
              value={dateRange}
              color="var(--text-2)"
            />
          </div>
        </div>
      )}

      {/* ── HEADER + CONTROLS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t("historicalTransactions")}</h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)"
            }}
          >
            <option value="default">{t("sortDefault")}</option>
            <option value="date">{t("sortDate")}</option>
            <option value="amount">{t("sortAmount")}</option>
          </select>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleRemoveDuplicates}
              disabled={isDeduping}
              style={{
                ...btnStyle,
                color: "var(--warning)",
                borderColor: "var(--warning)",
                opacity: isDeduping ? 0.7 : 1,
                cursor: isDeduping ? "not-allowed" : "pointer"
              }}
              onMouseEnter={e => !isDeduping && (e.currentTarget.style.background = "rgba(234,179,8,0.1)")}
              onMouseLeave={e => !isDeduping && (e.currentTarget.style.background = "var(--surface-2)")}
            >
              {isDeduping ? "Deduping..." : <><Scissors size={14} /> {t("autoDedupe")}</>}
            </button>
            <button onClick={exportPDF} style={btnStyle}><Download size={14}/> {t("pdf")}</button>
            <button onClick={exportExcel} style={btnStyle}><Download size={14}/> {t("excel")}</button>
            <button onClick={exportXML} style={btnStyle}><Download size={14}/> {t("xml")}</button>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 750 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={thStyle}>{t("date")}</th>
                <th style={thStyle}>{t("vendor")}</th>
                <th style={thStyle}>{t("invoiceNumber")}</th>
                <th style={{ ...thStyle, textAlign: "right" }}>{t("basePrice")}</th>
                <th style={{ ...thStyle, textAlign: "right" }}>{t("vat")}</th>
                <th style={{ ...thStyle, textAlign: "right" }}>{t("amount")}</th>
                <th style={{ ...thStyle, width: 80, textAlign: "right" }}>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(inv => {
                const d = parseInvoiceData(inv);
                const isHovered = hoveredRow === inv.id;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/history/${inv.id}`)}
                    onMouseEnter={() => setHoveredRow(inv.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      background: isHovered ? "rgba(124,110,247,0.06)" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={tdStyle}>{inv.invoiceDate || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{inv.vendorName || "—"}</td>
                    <td style={{ ...tdStyle, color: "var(--text-2)", fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>{inv.invoiceNumber || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--text-2)" }}>
                      {fmtCurrency(d.subtotal ?? null, inv.currency)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--warning)" }}>
                      {fmtCurrency(d.tax_amount ?? null, inv.currency)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                      {fmtCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        <ChevronRight size={14} style={{ color: isHovered ? "var(--accent)" : "var(--text-3)", transition: "color 0.15s", marginRight: 4 }} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/history/${inv.id}?edit=true`);
                          }}
                          style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", transition: "color 0.2s", padding: "4px" }}
                          onMouseOver={e => e.currentTarget.style.color = "var(--accent)"}
                          onMouseOut={e => e.currentTarget.style.color = "var(--text-3)"}
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, inv.id)}
                          style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", transition: "color 0.2s", padding: "4px" }}
                          onMouseOver={e => e.currentTarget.style.color = "var(--danger)"}
                          onMouseOut={e => e.currentTarget.style.color = "var(--text-3)"}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>
                    {t("noHistory")}
                  </td>
                </tr>
              )}
            </tbody>
            {sortedInvoices.length > 0 && (
              <tfoot>
                <tr style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{t("totalSum")}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "var(--text-2)" }}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalBase)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "var(--warning)" }}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalVAT)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: "var(--accent-2)" }}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalSum)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
        💡 {t("clickRowDetails")}
      </p>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="anim-fade-up" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "var(--surface)", border: "1px solid var(--border-lit)",
          padding: "12px 20px", borderRadius: "var(--radius-md)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10,
          color: "var(--text-1)", fontWeight: 500, fontSize: 14
        }}>
          <CheckCircle size={18} color="var(--success)" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" as const };
const tdStyle = { padding: "12px 16px", color: "var(--text-1)" };
const btnStyle = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 12px", borderRadius: "var(--radius-sm)",
  background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)",
  cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" as const,
};
