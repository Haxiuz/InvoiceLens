"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { BarChart2, Download, FileText, TrendingUp, Wallet, Users, BookOpen } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useLanguage, Language, TranslationKeys } from "../components/LanguageProvider";

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

const REPORT_TABS: { id: ReportType; icon: React.ReactNode }[] = [
  { id: "balance-sheet",       icon: <Wallet size={15}/> },
  { id: "income-statement",    icon: <TrendingUp size={15}/> },
  { id: "cash-flow",           icon: <BarChart2 size={15}/> },
  { id: "shareholders-equity", icon: <Users size={15}/> },
  { id: "notes",               icon: <BookOpen size={15}/> },
];

const tabKeyMap: Record<ReportType, keyof TranslationKeys> = {
  "balance-sheet": "balanceSheet",
  "income-statement": "incomeStatement",
  "cash-flow": "cashFlowStatement",
  "shareholders-equity": "shareholdersEquity",
  "notes": "notesTitle",
};

const localeMap: Record<Language, string> = {
  en: "en-US",
  id: "id-ID",
  es: "es-ES",
  pt: "pt-PT",
  zh: "zh-CN",
  ru: "ru-RU",
  ar: "ar-EG",
  de: "de-DE",
};

function fmt(n: number, currency = "IDR") {
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
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
  const { t, language } = useLanguage();
  const NA = t("noIncomeData");

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

    // Force currency to IDR
    const currency   = "IDR";

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

  // ── Report rows — only factual data ────────────────────────────
  const getReportRows = (): [string, string][] => {
    switch (activeTab) {
      case "balance-sheet": return [
        [t("assets"), ""],
        [t("cashAndEquivalents"), NA],
        [t("prepaidExpenses"),          NA],
        [t("otherCurrentAssets"),      NA],
        [t("totalAssets"),              NA],
        [t("liabilities"), ""],
        [t("accountsPayableBase"), fmt(f.totalBase, cur)],
        [t("vatPayable"),               fmt(f.totalVAT, cur)],
        [t("otherLiabilities"),         NA],
        [t("totalLiabilities"), fmt(f.totalExpenses, cur)],
        [t("equity"), ""],
        [t("commonStock"),              NA],
        [t("retainedEarnings"),         NA],
        [t("totalEquity"),              NA],
      ];

      case "income-statement": return [
        [t("incomeRevenue"), ""],
        [t("salesRevenue"),   NA],
        [t("totalIncome"),              NA],
        [t("expenses"), ""],
        [t("vendorInvoiceCosts"), fmt(f.totalBase, cur)],
        [t("vatPaidPurchases"),     fmt(f.totalVAT, cur)],
        [t("totalExpensesBaseVat"), fmt(f.totalExpenses, cur)],
        [t("grossProfit"),              NA],
        [t("netIncome"),                NA],
      ];

      case "cash-flow": return [
        [t("operatingActivities"), ""],
        [t("cashReceivedCustomers"),              NA],
        [t("paymentsVendorsBase"), fmt(-f.totalBase, cur)],
        [t("vatPaid"),                                  fmt(-f.totalVAT, cur)],
        [t("totalCashPaidVendors"),   fmt(-f.totalExpenses, cur)],
        [t("netCashOperations"),                  NA],
        [t("investingActivities"), ""],
        [t("capitalExpenditures"),                      NA],
        [t("netCashInvesting"),                   NA],
        [t("financingActivities"), ""],
        [t("dividendsDistributions"),                 NA],
        [t("netCashFinancing"),                   NA],
        [t("netChangeCash"),                        NA],
      ];

      case "shareholders-equity": return [
        [t("equityComponents"), ""],
        [t("beginningEquity"),      NA],
        [t("commonStockIssued"),                  NA],
        [t("netIncomePeriod"),          NA],
        [t("dividendsDeclared"),                   NA],
        [t("retainedEarnings"),                    NA],
        [t("endingTotalEquity"),                  NA],
      ];

      case "notes": return [
        [t("notesPolicies"), ""],
        [t("basisOfPrep"),   t("basisOfPrepVal")],
        [t("invClassification"), t("invClassificationVal")],
        [t("vatTreatment"),          t("vatTreatmentVal")],
        [t("revenueData"),           t("revenueDataVal")],
        [t("notesSummary"), ""],
        [t("totalInvoicesScanned"),         String(f.invoiceCount)],
        [t("totalVendorExpenses"),          fmt(f.totalExpenses, cur)],
        [t("totalBaseCost"),      fmt(f.totalBase, cur)],
        [t("totalVatPaid"),                 fmt(f.totalVAT, cur)],
        [t("avgInvoiceValue"),          fmt(f.avgInvoice, cur)],
        [t("primaryCurrency"),               cur],
        [t("notesLimitations"), ""],
        [t("revenueIncome"),  t("revenueIncomeVal")],
        [t("assetValues"),      t("assetValuesVal")],
        [t("equityLimitation"),            t("equityLimitationVal")],
      ];
    }
  };

  const exportReportPDF = () => {
    const doc = new jsPDF();
    const label = t(tabKeyMap[activeTab]);
    doc.setFontSize(16);
    doc.text(`InvoiceLens — ${label}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`${t("generated")}: ${new Date().toLocaleDateString(localeMap[language])}`, 14, 24);
    autoTable(doc, {
      head: [[t("itemLabel"), t("amountLabel")]],
      body: getReportRows(),
      startY: 30,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [124, 110, 247] },
    });
    doc.save(`${activeTab}.pdf`);
  };

  const exportReportExcel = () => {
    const label = t(tabKeyMap[activeTab]);
    const rows = getReportRows().map(([item, amount]) => ({ [t("itemLabel")]: item, [t("amountLabel")]: amount }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31));
    XLSX.writeFile(wb, `${activeTab}.xlsx`);
  };

  const exportReportXML = () => {
    const label = t(tabKeyMap[activeTab]);
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

  if (status === "loading" || loading) return <div style={{ padding: 40, textAlign: "center" }}>{t("loading")}</div>;
  if (status === "unauthenticated") return <div style={{ padding: 40, textAlign: "center" }}>{t("pleaseSignInProfile")}</div>;

  const rows = getReportRows();
  const activeLabel = t(tabKeyMap[activeTab]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {/* Page header */}
      <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t("financialReports")}</h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              {t("basedOn")} {f.invoiceCount} {f.invoiceCount === 1 ? t("invoiceCountText") : t("invoicesCountText")} · {t("expenseTrackingOnly")}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportReportPDF}   style={exportBtn}><Download size={14}/> PDF</button>
          <button onClick={exportReportExcel} style={exportBtn}><Download size={14}/> Excel</button>
          <button onClick={exportReportXML}   style={exportBtn}><Download size={14}/> XML</button>
        </div>
      </div>

      {/* KPI cards — only real numbers */}
      <div className="anim-fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: t("totalExpenses"),    value: fmt(f.totalExpenses, cur), color: "var(--danger)",   real: true },
          { label: t("totalVatPaid"),    value: fmt(f.totalVAT, cur),      color: "var(--warning)",  real: true },
          { label: t("preTaxCost"),      value: fmt(f.totalBase, cur),     color: "var(--text-1)",   real: true },
          { label: t("avgInvoice"),       value: fmt(f.avgInvoice, cur),    color: "var(--text-2)",   real: true },
          { label: t("revenue"),           value: "N/A",                     color: "var(--text-3)",   real: false },
          { label: t("netIncome"),        value: "N/A",                     color: "var(--text-3)",   real: false },
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
            {tab.icon} {t(tabKeyMap[tab.id])}
          </button>
        ))}
      </div>

      {/* Report table */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={16} color="var(--accent)" />
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>{activeLabel}</h2>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
            {t("asOf")} {new Date().toLocaleDateString(localeMap[language], { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 400 }}>
            <tbody>
              {rows.map(([item, amount], i) => {
                const isSection = item === item.toUpperCase() && item.length > 3 && amount === "";
                const isNA      = amount === NA;
                const isNeg     = amount.startsWith("-");
                const isBold    = !isNA && (item.toLowerCase().includes("total") || item.toLowerCase().includes("net") || item.toLowerCase().includes("ending") || item.toLowerCase().includes("ekuitas akhir") || item.toLowerCase().includes("patrimônio líquido final") || item.toLowerCase().includes("期末"));
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: isSection ? "var(--surface-2)" : "transparent" }}>
                    <td style={{
                      padding: isSection ? "10px 16px" : "12px 16px 12px 24px",
                      color: isSection ? "var(--accent-2)" : "var(--text-1)",
                      fontWeight: isSection ? 700 : isBold ? 700 : 400,
                      fontSize: isSection ? 11 : 14,
                      textTransform: isSection ? "uppercase" : "none",
                      letterSpacing: isSection ? "0.07em" : "normal",
                    }}>{item}</td>
                    <td style={{
                      padding: isSection ? "10px 16px" : "12px 16px",
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
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={exportReportPDF}   style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> PDF</button>
          <button onClick={exportReportExcel} style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> Excel</button>
          <button onClick={exportReportXML}   style={{ ...exportBtn, fontSize: 12 }}><Download size={12}/> XML</button>
        </div>
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        ℹ️ {t("notesDesc")}
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
