"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { BarChart2, Download, FileText, TrendingUp, Wallet, Users, BookOpen } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

type ReportType = "balance-sheet" | "income-statement" | "cash-flow" | "shareholders-equity" | "notes";

const REPORT_TABS: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: "balance-sheet",       label: "Balance Sheet",                       icon: <Wallet size={15}/> },
  { id: "income-statement",    label: "Income Statement",                    icon: <TrendingUp size={15}/> },
  { id: "cash-flow",           label: "Cash Flow Statement",                 icon: <BarChart2 size={15}/> },
  { id: "shareholders-equity", label: "Statement of Shareholders' Equity",   icon: <Users size={15}/> },
  { id: "notes",               label: "Notes to Financial Statements",        icon: <BookOpen size={15}/> },
];

function fmt(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function parseData(inv: InvoiceRecord) {
  try { if (inv.dataJson) return JSON.parse(inv.dataJson); } catch {}
  return {};
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportType>("balance-sheet");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then(r => r.json())
        .then(data => { setInvoices(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  // ── Only real numbers — no multipliers, no fabricated revenue ──
  const financials = useMemo(() => {
    const totalExpenses   = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
    const totalVAT        = invoices.reduce((s, inv) => { const d = parseData(inv); return s + (d.tax_amount || 0); }, 0);
    const totalBase       = invoices.reduce((s, inv) => { const d = parseData(inv); return s + (d.subtotal   || 0); }, 0);
    const invoiceCount    = invoices.length;
    const avgInvoice      = invoiceCount ? totalExpenses / invoiceCount : 0;

    // Most-used currency across invoices
    const currencies = invoices.map(i => i.currency).filter(Boolean);
    const currency   = currencies.length
      ? [...currencies].sort((a, b) =>
          currencies.filter(c => c === b).length - currencies.filter(c => c === a).length
        )[0] || "USD"
      : "USD";

    // What we can truthfully report:
    //   Accounts Payable  = total owed to vendors (invoice totals)
    //   VAT Payable       = tax component of those invoices
    //   We do NOT have revenue — we only have the expense side
    return {
      totalExpenses, totalVAT, totalBase, invoiceCount, avgInvoice, currency,
    };
  }, [invoices]);

  const f = financials;
  const cur = f.currency;
  const NA = "N/A — no income data";

  // ── Report rows — only factual data ────────────────────────────
  const getReportRows = (): [string, string][] => {
    switch (activeTab) {
      case "balance-sheet": return [
        ["ASSETS", ""],
        ["Cash and Cash Equivalents", NA],
        ["Prepaid Expenses",          NA],
        ["Other Current Assets",      NA],
        ["Total Assets",              NA],
        ["LIABILITIES", ""],
        ["Accounts Payable — Base Cost (excl. VAT)", fmt(f.totalBase, cur)],
        ["VAT Payable",               fmt(f.totalVAT, cur)],
        ["Other Liabilities",         NA],
        ["Total Liabilities (Known)", fmt(f.totalExpenses, cur)],
        ["EQUITY", ""],
        ["Common Stock",              NA],
        ["Retained Earnings",         NA],
        ["Total Equity",              NA],
      ];

      case "income-statement": return [
        ["INCOME (REVENUE)", ""],
        ["Sales / Service Revenue",   NA],
        ["Total Income",              NA],
        ["EXPENSES", ""],
        ["Vendor Invoice Costs (Base, excl. VAT)", fmt(f.totalBase, cur)],
        ["VAT Paid on Purchases",     fmt(f.totalVAT, cur)],
        ["Total Expenses (Base + VAT)", fmt(f.totalExpenses, cur)],
        ["Gross Profit",              NA],
        ["Net Income",                NA],
      ];

      case "cash-flow": return [
        ["OPERATING ACTIVITIES", ""],
        ["Cash Received from Customers",              NA],
        ["Payments to Vendors — Base Cost (excl. VAT)", fmt(-f.totalBase, cur)],
        ["VAT Paid",                                  fmt(-f.totalVAT, cur)],
        ["Total Cash Paid to Vendors (Base + VAT)",   fmt(-f.totalExpenses, cur)],
        ["Net Cash from Operations",                  NA],
        ["INVESTING ACTIVITIES", ""],
        ["Capital Expenditures",                      NA],
        ["Net Cash from Investing",                   NA],
        ["FINANCING ACTIVITIES", ""],
        ["Dividends / Distributions",                 NA],
        ["Net Cash from Financing",                   NA],
        ["NET CHANGE IN CASH",                        NA],
      ];

      case "shareholders-equity": return [
        ["EQUITY COMPONENTS", ""],
        ["Beginning Equity (Period Start)",      NA],
        ["Common Stock Issued",                  NA],
        ["Net Income (Current Period)",          NA],
        ["Dividends Declared",                   NA],
        ["Retained Earnings",                    NA],
        ["Ending Total Equity",                  NA],
      ];

      case "notes": return [
        ["NOTE 1: ACCOUNTING POLICIES", ""],
        ["Basis of Preparation",   "Based on scanned vendor invoices"],
        ["Invoice Classification", "Expense / Accounts Payable — bills paid to vendors"],
        ["VAT Treatment",          "Extracted from invoice; recorded as VAT Payable"],
        ["Revenue Data",           "Not available — this app tracks expenses only"],
        ["NOTE 2: EXPENSE SUMMARY", ""],
        ["Total Invoices Scanned",         String(f.invoiceCount)],
        ["Total Vendor Expenses",          fmt(f.totalExpenses, cur)],
        ["Total Base Cost (pre-VAT)",      fmt(f.totalBase, cur)],
        ["Total VAT Paid",                 fmt(f.totalVAT, cur)],
        ["Average Invoice Value",          fmt(f.avgInvoice, cur)],
        ["Primary Currency",               cur],
        ["NOTE 3: LIMITATIONS", ""],
        ["Revenue / Income",  "Not recorded — add income invoices to enable P&L reporting"],
        ["Asset Values",      "Not recorded — requires asset register"],
        ["Equity",            "Cannot be calculated without revenue data"],
      ];
    }
  };

  const exportReportPDF = () => {
    const doc = new jsPDF();
    const label = REPORT_TABS.find(t => t.id === activeTab)?.label || "";
    doc.setFontSize(16);
    doc.text(`InvoiceLens — ${label}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 24);
    autoTable(doc, {
      head: [["Item", "Amount"]],
      body: getReportRows(),
      startY: 30,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [124, 110, 247] },
    });
    doc.save(`${activeTab}.pdf`);
  };

  const exportReportExcel = () => {
    const label = REPORT_TABS.find(t => t.id === activeTab)?.label || activeTab;
    const rows = getReportRows().map(([item, amount]) => ({ Item: item, Amount: amount }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31));
    XLSX.writeFile(wb, `${activeTab}.xlsx`);
  };

  const exportReportXML = () => {
    const label = REPORT_TABS.find(t => t.id === activeTab)?.label || activeTab;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Report type="${label}" date="${new Date().toISOString()}">\n`;
    getReportRows().forEach(([item, amount]) => {
      const safeItem = item.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const safeAmt  = amount.replace(/&/g,"&amp;");
      xml += `  <Entry><Item>${safeItem}</Item><Amount>${safeAmt}</Amount></Entry>\n`;
    });
    xml += `</Report>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeTab}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading reports…</div>;
  if (status === "unauthenticated") return <div style={{ padding: 40, textAlign: "center" }}>Please sign in to view reports.</div>;

  const rows = getReportRows();
  const activeLabel = REPORT_TABS.find(t => t.id === activeTab)?.label || "";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {/* Page header */}
      <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Financial Reports</h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Based on {f.invoiceCount} invoice{f.invoiceCount !== 1 ? "s" : ""} · Expense tracking only</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportReportPDF}   style={exportBtn}><Download size={14}/> PDF</button>
          <button onClick={exportReportExcel} style={exportBtn}><Download size={14}/> Excel</button>
          <button onClick={exportReportXML}   style={exportBtn}><Download size={14}/> XML</button>
        </div>
      </div>

      {/* KPI cards — only real numbers */}
      <div className="anim-fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total Expenses",    value: fmt(f.totalExpenses, cur), color: "var(--danger)",   real: true },
          { label: "Total VAT Paid",    value: fmt(f.totalVAT, cur),      color: "var(--warning)",  real: true },
          { label: "Pre-Tax Cost",      value: fmt(f.totalBase, cur),     color: "var(--text-1)",   real: true },
          { label: "Avg Invoice",       value: fmt(f.avgInvoice, cur),    color: "var(--text-2)",   real: true },
          { label: "Revenue",           value: "N/A",                     color: "var(--text-3)",   real: false },
          { label: "Net Income",        value: "N/A",                     color: "var(--text-3)",   real: false },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: "var(--surface)", border: `1px solid ${kpi.real ? "var(--border)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)", padding: "16px 18px",
            opacity: kpi.real ? 1 : 0.5,
          }}>
            <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{kpi.label}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {REPORT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              borderRadius: "var(--radius-sm)", border: "1px solid",
              borderColor: activeTab === tab.id ? "var(--border-lit)" : "var(--border)",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, rgba(124,110,247,0.15), rgba(167,139,250,0.08))"
                : "var(--surface-2)",
              color: activeTab === tab.id ? "var(--accent-2)" : "var(--text-2)",
              cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              whiteSpace: "nowrap", transition: "all 0.2s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Report table */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={16} color="var(--accent)" />
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>{activeLabel}</h2>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
            As of {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {rows.map(([item, amount], i) => {
              const isSection = item === item.toUpperCase() && item.length > 3 && amount === "";
              const isNA      = amount === NA;
              const isNeg     = amount.startsWith("-");
              const isBold    = !isNA && (item.toLowerCase().includes("total") || item.toLowerCase().includes("net") || item.toLowerCase().includes("ending"));
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: isSection ? "var(--surface-2)" : "transparent" }}>
                  <td style={{
                    padding: isSection ? "10px 24px" : "12px 24px 12px 36px",
                    color: isSection ? "var(--accent-2)" : "var(--text-1)",
                    fontWeight: isSection ? 700 : isBold ? 700 : 400,
                    fontSize: isSection ? 11 : 14,
                    textTransform: isSection ? "uppercase" : "none",
                    letterSpacing: isSection ? "0.07em" : "normal",
                  }}>{item}</td>
                  <td style={{
                    padding: isSection ? "10px 24px" : "12px 24px",
                    textAlign: "right",
                    color: isNA ? "var(--text-3)" : isNeg ? "var(--danger)" : isBold ? "var(--text-1)" : "var(--text-2)",
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isNA ? "italic" : "normal",
                    fontSize: 13,
                  }}>{amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={exportReportPDF}   style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> PDF</button>
          <button onClick={exportReportExcel} style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> Excel</button>
          <button onClick={exportReportXML}   style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> XML</button>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        ℹ️ This app tracks <strong>vendor invoices (expenses)</strong> only. Fields showing <em>N/A</em> require income/revenue data not yet recorded.
      </p>
    </div>
  );
}

const exportBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: "var(--radius-sm)",
  background: "var(--surface-2)", border: "1px solid var(--border)",
  color: "var(--text-1)", cursor: "pointer", fontSize: 13, fontWeight: 500,
  whiteSpace: "nowrap",
};
