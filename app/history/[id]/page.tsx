"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Building2, Hash, CreditCard, Tag, AlertTriangle, Package } from "lucide-react";

interface LineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

interface InvoiceData {
  vendor_name?: string | null;
  vendor_address?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  payment_terms?: string | null;
  line_items?: LineItem[];
  subtotal?: number | null;
  tax_amount?: number | null;
  grand_total?: number | null;
  currency?: string | null;
  anomalies?: string[];
}

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

function fmt(n: number | null | undefined, currency?: string | null): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(n);
  } catch {
    return `${currency || "USD"} ${n.toFixed(2)}`;
  }
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [record, setRecord] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetch(`/api/invoices/${id}`)
        .then(async res => {
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          return res.json();
        })
        .then((data: InvoiceRecord) => {
          setRecord(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, id]);

  if (status === "loading" || loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          {[60, 80, 50, 90, 70].map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ height: 14, width: "25%" }} />
              <div className="skeleton" style={{ height: 14, width: `${w * 0.4}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--danger)", marginBottom: 16 }}>⚠️ {error}</p>
        <button onClick={() => router.back()} style={backBtnStyle}>← Go Back</button>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", textAlign: "center", color: "var(--text-3)" }}>
        Invoice not found.
      </div>
    );
  }

  let parsed: InvoiceData = {};
  try {
    if (record.dataJson) parsed = JSON.parse(record.dataJson);
  } catch {}

  const currency = parsed.currency || record.currency || "USD";
  const lineItems: LineItem[] = parsed.line_items || [];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={backBtnStyle}
        >
          <ArrowLeft size={15} /> Back to History
        </button>
      </div>

      <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {record.vendorName || "Unknown Vendor"}
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>
            Invoice saved on {new Date(record.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, rgba(124,110,247,0.12), rgba(167,139,250,0.06))",
          border: "1px solid var(--border-lit)",
          borderRadius: "var(--radius-md)",
          padding: "12px 20px",
          textAlign: "right",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total Due</p>
          <p style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmt(record.totalAmount, currency)}
          </p>
        </div>
      </div>

      {/* Invoice Metadata */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
        <h2 style={sectionHeading}><Hash size={14} /> Invoice Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0 }}>
          <MetaRow icon={<Hash size={13}/>} label="Invoice #" value={record.invoiceNumber} mono />
          <MetaRow icon={<Calendar size={13}/>} label="Invoice Date" value={record.invoiceDate} />
          <MetaRow icon={<Calendar size={13}/>} label="Due Date" value={parsed.due_date} warn />
          <MetaRow icon={<CreditCard size={13}/>} label="Payment Terms" value={parsed.payment_terms} />
          <MetaRow icon={<Tag size={13}/>} label="Currency" value={currency} />
          <MetaRow icon={<Building2 size={13}/>} label="Vendor Address" value={parsed.vendor_address} />
        </div>
      </div>

      {/* Line Items — ALWAYS shown, even if empty or 0 */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
        <h2 style={sectionHeading}><Package size={14} /> Line Items</h2>

        {lineItems.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: 13, padding: "8px 0" }}>No line items were extracted from this invoice.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#", "Description", "Qty", "Unit Price", "Total"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px 8px 0",
                      textAlign: h === "Description" || h === "#" ? "left" : "right",
                      color: "var(--text-3)", fontWeight: 600, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px 10px 0", color: "var(--text-3)", fontSize: 12, width: 28 }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "var(--text-1)", fontWeight: 500 }}>
                      {item.description || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>No description</span>}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", textAlign: "right", color: "var(--text-2)" }}>
                      {item.quantity ?? <span style={{ color: "var(--text-3)" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", textAlign: "right", color: "var(--text-2)" }}>
                      {item.unit_price != null ? fmt(item.unit_price, currency) : <span style={{ color: "var(--text-3)" }}>IDR 0</span>}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: item.total ? "var(--text-1)" : "var(--text-3)", fontWeight: item.total ? 600 : 400 }}>
                      {item.total != null ? fmt(item.total, currency) : fmt(0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="anim-fade-up" style={{ background: "linear-gradient(135deg, rgba(124,110,247,0.08) 0%, var(--surface) 100%)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
        <h2 style={sectionHeading}>💰 Totals</h2>
        <TotalRow label="Subtotal (Base Price)" value={fmt(parsed.subtotal ?? null, currency)} />
        <TotalRow label="VAT / Tax" value={fmt(parsed.tax_amount ?? null, currency)} accent="var(--warning)" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 4px", marginTop: 8, borderTop: "2px solid var(--border-lit)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Total Due</span>
          <span style={{ fontWeight: 800, fontSize: 22, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmt(parsed.grand_total ?? record.totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Anomalies */}
      {parsed.anomalies && parsed.anomalies.length > 0 && (
        <div className="anim-fade-up" style={{ background: "var(--warning-bg)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
          <h2 style={{ ...sectionHeading, color: "var(--warning)" }}><AlertTriangle size={14} /> Anomalies Detected</h2>
          {parsed.anomalies.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", marginBottom: 6, background: "rgba(251,191,36,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(251,191,36,0.15)" }}>
              <span style={{ color: "var(--warning)", flexShrink: 0 }}>!</span>
              <span style={{ color: "var(--text-2)", fontSize: 13 }}>{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, label, value, mono, warn }: { icon?: React.ReactNode; label: string; value?: string | null; mono?: boolean; warn?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {icon}{label}
      </span>
      <span style={{ color: warn && value ? "var(--warning)" : "var(--text-1)", fontFamily: mono ? "var(--font-mono, monospace)" : undefined, fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>
        {value ?? <span style={{ color: "var(--text-3)" }}>—</span>}
      </span>
    </div>
  );
}

function TotalRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-2)", fontSize: 13 }}>{label}</span>
      <span style={{ color: accent || "var(--text-1)", fontWeight: 500, fontSize: 14 }}>{value}</span>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--accent-2)", textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
};

const backBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-2)",
  padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500,
  transition: "all 0.2s",
};
