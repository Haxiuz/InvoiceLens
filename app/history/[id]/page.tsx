"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Building2, Hash, CreditCard, Tag, AlertTriangle, Package, Edit2, Save, X } from "lucide-react";
import { useLanguage, Language } from "../../components/LanguageProvider";

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

function fmt(n: number | null | undefined, currency?: string | null): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();

  const [record, setRecord] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
          
          if (searchParams?.get("edit") === "true") {
            let parsed = {};
            try {
              if (data.dataJson) parsed = JSON.parse(data.dataJson);
            } catch {}
            setEditForm({
              vendorName: data.vendorName || "",
              totalAmount: data.totalAmount ?? 0,
              invoiceNumber: data.invoiceNumber || "",
              invoiceDate: data.invoiceDate || "",
              currency: data.currency || "USD",
              ...parsed,
            });
            setIsEditing(true);
          }
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, id, searchParams]);

  const handleEditToggle = () => {
    if (!isEditing && record) {
      let parsed = {};
      try {
        if (record.dataJson) parsed = JSON.parse(record.dataJson);
      } catch {}
      setEditForm({
        vendorName: record.vendorName || "",
        totalAmount: record.totalAmount ?? 0,
        invoiceNumber: record.invoiceNumber || "",
        invoiceDate: record.invoiceDate || "",
        currency: record.currency || "USD",
        ...parsed,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const parsedData = { ...editForm };
      delete parsedData.vendorName;
      delete parsedData.totalAmount;
      delete parsedData.invoiceNumber;
      delete parsedData.invoiceDate;
      delete parsedData.currency;

      const newParsedData = {
        ...parsedData,
        vendor_name: editForm.vendorName,
        invoice_number: editForm.invoiceNumber,
        invoice_date: editForm.invoiceDate,
        grand_total: Number(editForm.totalAmount),
        currency: editForm.currency
      };

      const payload = {
        vendorName: editForm.vendorName,
        totalAmount: Number(editForm.totalAmount),
        invoiceNumber: editForm.invoiceNumber,
        invoiceDate: editForm.invoiceDate,
        currency: editForm.currency,
        dataJson: JSON.stringify(newParsedData),
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      setRecord(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

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
        <button onClick={() => router.back()} style={btnStyle}>{t("backToHistory")}</button>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", textAlign: "center", color: "var(--text-3)" }}>
        {t("invoiceNotFound")}
      </div>
    );
  }

  let parsed: InvoiceData = {};
  try {
    if (record.dataJson) parsed = JSON.parse(record.dataJson);
  } catch {}

  const currency = isEditing ? editForm.currency : (parsed.currency || record.currency || "USD");
  const lineItems: LineItem[] = (isEditing ? editForm.line_items : parsed.line_items) || [];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => router.back()}
          style={btnStyle}
        >
          <ArrowLeft size={15} /> {t("backToHistory")}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>
                <Save size={14}/> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setIsEditing(false)} style={btnStyle}>
                <X size={14}/> Cancel
              </button>
            </>
          ) : (
            <button onClick={handleEditToggle} style={btnStyle}>
              <Edit2 size={14}/> Edit
            </button>
          )}
        </div>
      </div>

      <div className="anim-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          {isEditing ? (
            <input 
              value={editForm.vendorName} 
              onChange={e => setEditForm({...editForm, vendorName: e.target.value})} 
              style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "4px 8px", color: "var(--text-1)", width: "100%" }}
            />
          ) : (
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {record.vendorName || t("unknownVendor")}
            </h1>
          )}
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>
            {t("invoiceSavedOn")} {new Date(record.createdAt).toLocaleDateString(localeMap[language], { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, rgba(124,110,247,0.12), rgba(167,139,250,0.06))",
          border: "1px solid var(--border-lit)",
          borderRadius: "var(--radius-md)",
          padding: "12px 20px",
          textAlign: "right",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{t("totalDue")}</p>
          {isEditing ? (
             <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
               <input value={editForm.currency} onChange={e => setEditForm({...editForm, currency: e.target.value})} style={{ width: 50, fontSize: 16, background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 4px", color: "var(--text-1)", borderRadius: 4 }} />
               <input type="number" value={editForm.totalAmount} onChange={e => setEditForm({...editForm, totalAmount: e.target.value})} style={{ width: 100, fontSize: 16, background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 4px", color: "var(--text-1)", borderRadius: 4 }} />
             </div>
          ) : (
            <p style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {fmt(record.totalAmount, currency)}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Metadata */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
        <h2 style={sectionHeading}><Hash size={14} /> {t("invoiceDetails")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", columnGap: 40, rowGap: 0 }}>
          <MetaRow icon={<Hash size={13}/>} label={t("invoiceNumber")} value={isEditing ? editForm.invoiceNumber : record.invoiceNumber} isEditing={isEditing} onChange={v => setEditForm({...editForm, invoiceNumber: v})} mono />
          <MetaRow icon={<Calendar size={13}/>} label={t("date")} value={isEditing ? editForm.invoiceDate : record.invoiceDate} isEditing={isEditing} onChange={v => setEditForm({...editForm, invoiceDate: v})} />
          <MetaRow icon={<Calendar size={13}/>} label={t("dueDate")} value={isEditing ? editForm.due_date : parsed.due_date} isEditing={isEditing} onChange={v => setEditForm({...editForm, due_date: v})} warn />
          <MetaRow icon={<CreditCard size={13}/>} label={t("paymentTerms")} value={isEditing ? editForm.payment_terms : parsed.payment_terms} isEditing={isEditing} onChange={v => setEditForm({...editForm, payment_terms: v})} />
          <MetaRow icon={<Tag size={13}/>} label={t("currency")} value={currency} isEditing={isEditing} onChange={v => setEditForm({...editForm, currency: v})} />
          <MetaRow icon={<Building2 size={13}/>} label={t("vendorAddress")} value={isEditing ? editForm.vendor_address : parsed.vendor_address} isEditing={isEditing} onChange={v => setEditForm({...editForm, vendor_address: v})} />
        </div>
      </div>

      {/* Line Items — ALWAYS shown, even if empty or 0 */}
      <div className="anim-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}><Package size={14} /> {t("lineItems")}</h2>
        </div>

        {lineItems.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: 13, padding: "8px 0" }}>{t("noLineItems")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    { id: "#", label: "#" },
                    { id: "description", label: t("description") },
                    { id: "qty", label: t("qty") },
                    { id: "unitPrice", label: t("unitPrice") },
                    { id: "total", label: t("total") }
                  ].map(h => (
                    <th key={h.id} style={{
                      padding: "8px 12px 8px 0",
                      textAlign: h.id === "description" || h.id === "#" ? "left" : "right",
                      color: "var(--text-3)", fontWeight: 600, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px 10px 0", color: "var(--text-3)", fontSize: 12, width: 28 }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "var(--text-1)", fontWeight: 500 }}>
                      {isEditing ? (
                        <input value={item.description || ""} onChange={e => {
                          const newItems = [...lineItems];
                          newItems[i].description = e.target.value;
                          setEditForm({ ...editForm, line_items: newItems });
                        }} style={{ width: "100%", ...inputStyle }} />
                      ) : (
                        item.description || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>{t("noDescription")}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", textAlign: "right", color: "var(--text-2)", width: 80 }}>
                      {isEditing ? (
                        <input type="number" value={item.quantity || ""} onChange={e => {
                          const newItems = [...lineItems];
                          newItems[i].quantity = e.target.value ? Number(e.target.value) : null;
                          setEditForm({ ...editForm, line_items: newItems });
                        }} style={{ width: "100%", textAlign: "right", ...inputStyle }} />
                      ) : (
                        item.quantity ?? <span style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", textAlign: "right", color: "var(--text-2)", width: 100 }}>
                      {isEditing ? (
                        <input type="number" value={item.unit_price || ""} onChange={e => {
                          const newItems = [...lineItems];
                          newItems[i].unit_price = e.target.value ? Number(e.target.value) : null;
                          setEditForm({ ...editForm, line_items: newItems });
                        }} style={{ width: "100%", textAlign: "right", ...inputStyle }} />
                      ) : (
                        item.unit_price != null ? fmt(item.unit_price, currency) : <span style={{ color: "var(--text-3)" }}>Rp 0</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: item.total ? "var(--text-1)" : "var(--text-3)", fontWeight: item.total ? 600 : 400, width: 100 }}>
                      {isEditing ? (
                        <input type="number" value={item.total || ""} onChange={e => {
                          const newItems = [...lineItems];
                          newItems[i].total = e.target.value ? Number(e.target.value) : null;
                          setEditForm({ ...editForm, line_items: newItems });
                        }} style={{ width: "100%", textAlign: "right", ...inputStyle }} />
                      ) : (
                        item.total != null ? fmt(item.total, currency) : fmt(0, currency)
                      )}
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
        <h2 style={sectionHeading}>💰 {t("totals")}</h2>
        <TotalRow label={t("subtotal")} value={isEditing ? editForm.subtotal : parsed.subtotal} isEditing={isEditing} onChange={v => setEditForm({...editForm, subtotal: v})} currency={currency} />
        <TotalRow label={t("vatTax")} value={isEditing ? editForm.tax_amount : parsed.tax_amount} isEditing={isEditing} onChange={v => setEditForm({...editForm, tax_amount: v})} currency={currency} accent="var(--warning)" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 4px", marginTop: 8, borderTop: "2px solid var(--border-lit)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t("totalDue")}</span>
          <span style={{ fontWeight: 800, fontSize: 22, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmt(isEditing ? editForm.totalAmount : (parsed.grand_total ?? record.totalAmount), currency)}
          </span>
        </div>
      </div>

      {/* Anomalies */}
      {!isEditing && parsed.anomalies && parsed.anomalies.length > 0 && (
        <div className="anim-fade-up" style={{ background: "var(--warning-bg)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 16 }}>
          <h2 style={{ ...sectionHeading, color: "var(--warning)" }}><AlertTriangle size={14} /> {t("anomaliesDetected")}</h2>
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

function MetaRow({ icon, label, value, mono, warn, isEditing, onChange }: { icon?: React.ReactNode; label: string; value?: string | null; mono?: boolean; warn?: boolean; isEditing?: boolean; onChange?: (val: string) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginTop: 2 }}>
        {icon}{label}
      </span>
      {isEditing && onChange ? (
        <input 
          type="text" 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          style={{ ...inputStyle, width: "100%", maxWidth: 220, textAlign: "right" }}
        />
      ) : (
        <span style={{ color: warn && value ? "var(--warning)" : "var(--text-1)", fontFamily: mono ? "var(--font-mono, monospace)" : undefined, fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>
          {value ?? <span style={{ color: "var(--text-3)" }}>—</span>}
        </span>
      )}
    </div>
  );
}

function TotalRow({ label, value, accent, isEditing, onChange, currency }: { label: string; value: any; accent?: string; isEditing?: boolean; onChange?: (val: any) => void; currency: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-2)", fontSize: 13 }}>{label}</span>
      {isEditing && onChange ? (
        <input 
          type="number" 
          value={value || ""} 
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} 
          style={{ ...inputStyle, width: 120, textAlign: "right" }}
        />
      ) : (
        <span style={{ color: accent || "var(--text-1)", fontWeight: 500, fontSize: 14 }}>{fmt(value ?? null, currency)}</span>
      )}
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--accent-2)", textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
};

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-2)",
  padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500,
  transition: "all 0.2s",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 8px", background: "var(--surface-2)", border: "1px solid var(--border)", 
  borderRadius: "var(--radius-sm)", color: "var(--text-1)", fontSize: 13
};
