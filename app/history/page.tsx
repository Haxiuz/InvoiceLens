"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, Trash2, Scissors, ChevronRight } from "lucide-react";

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

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!confirm("Scan for and auto-delete all exact duplicate invoices?")) return;
    setLoading(true);

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
      alert("No duplicate invoices found!");
      setLoading(false);
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
    setLoading(false);

    if (deletedCount > 0) {
      alert(`Successfully removed ${deletedCount} duplicate invoice(s)!`);
    } else {
      alert("Failed to delete duplicates. Please try again.");
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

  if (status === "loading" || loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading history...</div>;
  }

  if (status === "unauthenticated") {
    return <div style={{ padding: "40px", textAlign: "center" }}>Please log in to view your history.</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Historical Transactions</h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: "8px 12px", borderRadius: "var(--radius-sm)",
              background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)"
            }}
          >
            <option value="default">Sort: Default (Newest First)</option>
            <option value="date">Sort: By Date</option>
            <option value="amount">Sort: By Amount</option>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRemoveDuplicates} style={{ ...btnStyle, background: "rgba(247, 110, 110, 0.1)", color: "var(--danger)", border: "1px solid rgba(247, 110, 110, 0.2)" }}><Scissors size={14}/> Auto-Dedupe</button>
            <button onClick={exportPDF} style={btnStyle}><Download size={14}/> PDF</button>
            <button onClick={exportExcel} style={btnStyle}><Download size={14}/> Excel</button>
            <button onClick={exportXML} style={btnStyle}><Download size={14}/> XML</button>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 750 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Invoice #</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Base Price</th>
                <th style={{ ...thStyle, textAlign: "right" }}>VAT</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                <th style={{ ...thStyle, width: 80, textAlign: "right" }}>Actions</th>
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
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                        <ChevronRight size={14} style={{ color: isHovered ? "var(--accent)" : "var(--text-3)", transition: "color 0.15s" }} />
                        <button
                          onClick={(e) => handleDelete(e, inv.id)}
                          style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", transition: "color var(--t)", padding: "4px" }}
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
                    No historical data found.
                  </td>
                </tr>
              )}
            </tbody>
            {sortedInvoices.length > 0 && (
              <tfoot>
                <tr style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Total Sum:</td>
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
        💡 Click any row to view full invoice details
      </p>
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
