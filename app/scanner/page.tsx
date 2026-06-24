"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, FolderOpen, Camera, Search, Building2,
  ClipboardList, Package, DollarSign, AlertTriangle, Frown, Save,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "../components/LanguageProvider";

/* ─── Types ─────────────────────────────────────────────── */
interface LineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

interface InvoiceData {
  vendor_name: string | null;
  vendor_address: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  payment_terms: string | null;
  line_items: LineItem[];
  subtotal: number | null;
  tax_amount: number | null;
  grand_total: number | null;
  currency: string | null;
  anomalies: string[];
}

type AppState = "idle" | "loading" | "done" | "error" | "camera";

/* ─── Helpers ───────────────────────────────────────────── */
function fmt(n: number | null, currency = "IDR"): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  } catch {
    return `Rp ${n.toLocaleString("id-ID")}`;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; res(result.split(",")[1]); };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as ArrayBuffer);
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsText(file);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls" || file.type.includes("spreadsheet") || file.type.includes("excel")) {
    const buf = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: "array" });
    const rows: string[] = [];
    wb.SheetNames.forEach(name => { const ws = wb.Sheets[name]; rows.push(`[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(ws)}`); });
    return rows.join("\n\n");
  }
  if (ext === "xml" || file.type === "application/xml" || file.type === "text/xml") {
    return await readFileAsText(file);
  }
  if (ext === "docx" || file.type.includes("wordprocessingml") || file.type.includes("msword")) {
    const buf = await readFileAsArrayBuffer(file);
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  return "";
}

const TEXT_BASED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel", "application/xml", "text/xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const TEXT_BASED_EXTS = ["xlsx", "xls", "xml", "docx", "doc"];

function isTextBasedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_BASED_TYPES.includes(file.type) || TEXT_BASED_EXTS.includes(ext);
}

function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

/* ─── Sub-components ────────────────────────────────────── */
function Badge({ color, children }: { color: "success" | "warning" | "danger" | "neutral"; children: React.ReactNode }) {
  const styles = {
    success: { background: "var(--success-bg)", color: "var(--success)", border: "1px solid rgba(52,211,153,0.25)" },
    warning: { background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid rgba(251,191,36,0.25)" },
    danger:  { background: "var(--danger-bg)",  color: "var(--danger)",  border: "1px solid rgba(248,113,113,0.25)" },
    neutral: { background: "var(--surface-3)",  color: "var(--text-2)",  border: "1px solid var(--border)" },
  };
  return <span style={{ ...styles[color], padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, display: "inline-block", whiteSpace: "nowrap" as const }}>{children}</span>;
}

function Card({ children, className = "", style = {}, delay = 0 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number;
}) {
  return (
    <div className={`anim-fade-up ${className}`} style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
      padding: "24px", boxShadow: "var(--shadow-sm)", animationDelay: `${delay}s`, overflow: "hidden", minWidth: 0, ...style,
    }}>
      {children}
    </div>
  );
}

function FieldRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text-1)", fontFamily: mono ? "var(--font-mono, monospace)" : undefined, fontSize: 13, textAlign: "right", minWidth: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}>
        {value ?? <span style={{ color: "var(--text-3)" }}>—</span>}
      </span>
    </div>
  );
}

/* ─── Main Scanner Component ─────────────────────────────── */
export default function ScannerPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState]       = useState<AppState>("idle");
  const [data, setData]         = useState<InvoiceData | null>(null);
  const [error, setError]       = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef            = useRef<HTMLInputElement>(null);
  const cameraInputRef          = useRef<HTMLInputElement>(null);
  const dropRef                 = useRef<HTMLDivElement>(null);
  const videoRef                = useRef<HTMLVideoElement>(null);
  const streamRef               = useRef<MediaStream | null>(null);

  // Redirect unauthenticated users to landing
  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace("/");
  }, [sessionStatus, router]);

  // Progress bar simulation
  useEffect(() => {
    if (state !== "loading") { setProgress(0); return; }
    setProgress(10);
    const t1 = setTimeout(() => setProgress(40), 600);
    const t2 = setTimeout(() => setProgress(70), 1500);
    const t3 = setTimeout(() => setProgress(88), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [state]);

  const handleFile = useCallback(async (f: File) => {
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const textBased = isTextBasedFile(f);
    const allowed = [...imageTypes, ...TEXT_BASED_TYPES];
    const allowedExts = ["jpg", "jpeg", "png", "webp", "heic", "pdf", ...TEXT_BASED_EXTS];

    if (!allowed.includes(f.type) && !allowedExts.includes(ext)) {
      setError("Unsupported file type. Please upload JPG, PNG, WebP, HEIC, PDF, XLSX, XML, or DOCX.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) { setError("File must be under 20 MB."); return; }
    setError(""); setData(null); setFileText(null); setState("idle");

    if (textBased) {
      try {
        const extracted = await extractTextFromFile(f);
        setFile(f); setPreview(null); setFileText(extracted);
      } catch { setError("Failed to read file. Make sure it is a valid Excel, XML, or Word document."); }
      return;
    }

    let processed = f;
    if (f.type.startsWith("image/")) {
      try { processed = await compressImage(f); } catch { processed = f; }
    }
    setFile(processed);
    setPreview(URL.createObjectURL(processed));
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleExtract = async () => {
    if (!file) { setError("Please upload an invoice file first."); return; }
    setState("loading"); setError("");
    try {
      const body = fileText !== null ? { text: fileText } : { base64: await fileToBase64(file), mimeType: file.type };
      const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as { error?: string }).error || `Server error ${res.status}`); }
      const result = await res.json() as InvoiceData;
      setData(result); setProgress(100);
      setTimeout(() => setState("done"), 300);
    } catch (e) { setState("error"); setError(e instanceof Error ? e.message : "Unknown error occurred"); }
  };

  const reset = () => { setFile(null); setPreview(null); setData(null); setFileText(null); setState("idle"); setError(""); };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream; setState("camera");
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      if (cameraInputRef.current) cameraInputRef.current.click();
      else setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setState("idle"); };

  const capturePhoto = () => {
    const video = videoRef.current; if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => { if (blob) { handleFile(new File([blob], "scanned-invoice.jpg", { type: "image/jpeg" })); stopCamera(); } }, "image/jpeg", 0.95);
      }
    } catch { setError("Failed to capture photo."); stopCamera(); }
  };

  const handleSave = async () => {
    if (!data) return;
    try {
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || errData.details || res.statusText); }
      alert("Invoice saved to history!");
    } catch (err: any) { alert(`Failed to save invoice: ${err.message}`); }
  };

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated") {
    return <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "var(--text-3)" }}>Loading…</div></main>;
  }

  return (
    <main style={{ minHeight: "100vh", padding: "0 0 80px" }}>
      <div aria-hidden style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(124,110,247,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 0", position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><Badge color="neutral">{t("aiPoweredOcr")}</Badge></div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 14, background: "linear-gradient(135deg, var(--text-1) 30%, var(--accent-2) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t("scanAnyInvoice")}
          </h1>
          <p style={{ color: "var(--text-2)", maxWidth: 500, margin: "0 auto", fontSize: 15, lineHeight: 1.7 }}>{t("heroSub")}</p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 20, alignItems: "start" }} className="scan-grid">

          {/* LEFT: Upload */}
          <div className="anim-fade-up d-3" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Drop Zone */}
            <div ref={dropRef} id="drop-zone" onClick={() => !file && fileInputRef.current?.click()}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              style={{ border: `2px dashed ${dragging ? "var(--accent)" : file ? "var(--border-lit)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", background: dragging ? "rgba(124,110,247,0.06)" : "var(--surface)", minHeight: file ? "auto" : 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: file ? "default" : "pointer", transition: "all var(--t)", boxShadow: dragging ? "var(--shadow-glow)" : "none", overflow: "hidden", position: "relative" }}>
              {!file ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div className="anim-float" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={44} strokeWidth={1.2} color="var(--accent-2)" />
                  </div>
                  <p style={{ fontWeight: 600, color: "var(--text-1)", marginBottom: 6, fontSize: 15 }}>{t("dropInvoiceHere")}</p>
                  <p style={{ color: "var(--text-3)", fontSize: 12 }}>{t("orClickToBrowse")}</p>
                  <p style={{ color: "var(--text-3)", fontSize: 11, marginTop: 12 }}>JPG · PNG · WebP · HEIC · PDF · XLSX · XML · DOCX</p>
                </div>
              ) : (
                <div style={{ width: "100%", position: "relative" }}>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Invoice preview" style={{ width: "100%", display: "block", maxHeight: 360, objectFit: "contain", borderRadius: "var(--radius-lg)" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12 }}>
                      <FileText size={52} strokeWidth={1.2} color="var(--accent-2)" />
                      <p style={{ fontWeight: 600, color: "var(--text-1)", fontSize: 14 }}>{file.name}</p>
                      <p style={{ fontSize: 12, color: "var(--success)" }}>✓ Text extracted — ready to scan</p>
                    </div>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: preview ? "linear-gradient(to top, rgba(12,12,20,0.75) 0%, transparent 50%)" : "transparent", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "flex-end", padding: 16 }}>
                    <div style={{ flex: 1 }}>
                      {preview && <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{file.name}</p>}
                      {preview && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{(file.size / 1024).toFixed(0)} KB · {file.name.split(".").pop()?.toUpperCase()}</p>}
                    </div>
                    <button id="remove-image-btn" onClick={e => { e.stopPropagation(); reset(); }}
                      style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--danger)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {t("remove")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input ref={fileInputRef} id="file-input" type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.xlsx,.xls,.xml,.docx,.doc"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              style={{ display: "none" }} />
            <input ref={cameraInputRef} id="camera-fallback-input" type="file"
              accept="image/*" capture="environment"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              style={{ display: "none" }} />

            {!file && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { id: "browse-btn", icon: <FolderOpen size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />, label: t("browse"), action: () => fileInputRef.current?.click() },
                  { id: "camera-btn", icon: <Camera size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />, label: t("takePhoto"), action: startCamera },
                ].map(btn => (
                  <button key={btn.id} id={btn.id} onClick={btn.action}
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-2)", padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all var(--t)", width: "100%" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-lit)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}>
                    {btn.icon}{btn.label}
                  </button>
                ))}
              </div>
            )}

            {error && <div className="anim-scale-in" style={{ background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "var(--danger)", fontSize: 13 }}>⚠️ {error}</div>}

            {state === "loading" && (
              <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
              </div>
            )}

            {file && (
              <button id="extract-btn" onClick={handleExtract} disabled={state === "loading"}
                style={{ background: state === "loading" ? "var(--surface-2)" : "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)", border: "none", borderRadius: "var(--radius-md)", color: state === "loading" ? "var(--text-2)" : "#fff", padding: "14px 0", fontSize: 14, fontWeight: 600, cursor: state === "loading" ? "not-allowed" : "pointer", width: "100%", boxShadow: state === "loading" ? "none" : "0 4px 20px var(--accent-glow)", transition: "all var(--t)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {state === "loading" ? (
                  <><span style={{ display: "inline-block", width: 15, height: 15, border: "2px solid var(--text-3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />{t("scanning")}</>
                ) : (
                  <><Search size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />{t("extractInvoiceData")}</>
                )}
              </button>
            )}

            {/* Tips */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{t("tipsTitle")}</p>
              {[t("tip1"), t("tip2"), t("tip3"), t("tip4")].map((tipText, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--success)", flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "var(--text-2)", fontSize: 12 }}>{tipText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {state === "idle" && !data && (
              <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center", gap: 16, background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                <FileText size={44} strokeWidth={1.2} color="var(--accent-2)" style={{ opacity: 0.8, marginBottom: 4 }} />
                <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>{t("placeholderResult")}</p>
              </div>
            )}
            {state === "error" && !data && (
              <div className="anim-scale-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minHeight: 300, justifyContent: "center", textAlign: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 40 }}>
                <Frown size={44} strokeWidth={1.2} color="var(--danger)" style={{ marginBottom: 4 }} />
                <p style={{ color: "var(--danger)", fontWeight: 600 }}>{t("extractionFailed")}</p>
                <p style={{ color: "var(--text-3)", fontSize: 13, maxWidth: 320 }}>{error}</p>
                <button id="retry-btn" onClick={reset} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-2)", padding: "9px 24px", cursor: "pointer", fontSize: 13 }}>{t("tryAgain")}</button>
              </div>
            )}

            {state === "done" && data && (
              <>
                <div className="anim-fade-in" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Badge color="success">✅ {t("extractionComplete")}</Badge>
                  <button id="scan-another-btn" onClick={reset} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-2)", padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>+ {t("scanAnother")}</button>
                  <button id="save-history-btn" onClick={handleSave} style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-1)", padding: "5px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Save size={13} /> {t("saveToHistory")}</button>
                </div>

                <Card delay={0.04} style={{ borderColor: "var(--border-lit)", boxShadow: "var(--shadow-glow)" }}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><Building2 size={14} /> {t("vendor")}</h2>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>{data.vendor_name ?? <span style={{ color: "var(--text-3)" }}>—</span>}</div>
                  {data.vendor_address && <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{data.vendor_address}</div>}
                </Card>

                <Card delay={0.08}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><ClipboardList size={14} /> {t("invoiceDetails")}</h2>
                  <FieldRow label={t("invoiceNumber")} value={data.invoice_number} mono />
                  <FieldRow label={t("date")} value={data.invoice_date} />
                  <FieldRow label={t("totalDue")} value={data.due_date ? <span style={{ color: "var(--warning)", fontWeight: 600 }}>{data.due_date}</span> : null} />
                  <FieldRow label="Payment Terms" value={data.payment_terms} />
                  <FieldRow label="Currency" value={data.currency ? <Badge color="neutral">{data.currency}</Badge> : null} />
                </Card>

                {data.line_items && data.line_items.length > 0 && (
                  <Card delay={0.12}>
                    <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><Package size={14} /> {t("lineItems")}</h2>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {["Description", "Qty", "Unit Price", "Total"].map((h, i) => (
                            <th key={i} style={{ padding: "6px 0", textAlign: i === 0 ? "left" : "right", color: "var(--text-3)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", paddingRight: i !== 0 ? 0 : 12 }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>{data.line_items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px 10px 0", color: "var(--text-1)" }}>{item.description}</td>
                            <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text-2)" }}>{item.quantity ?? "—"}</td>
                            <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text-2)" }}>{fmt(item.unit_price, data.currency ?? "IDR")}</td>
                            <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text-1)", fontWeight: 600 }}>{fmt(item.total, data.currency ?? "IDR")}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </Card>
                )}

                <Card delay={0.16} style={{ background: "linear-gradient(135deg, rgba(124,110,247,0.08) 0%, var(--surface) 100%)" }}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><DollarSign size={14} /> {t("totals")}</h2>
                  <FieldRow label={t("subtotal")} value={fmt(data.subtotal, data.currency ?? "IDR")} />
                  <FieldRow label={t("vatTax")} value={fmt(data.tax_amount, data.currency ?? "IDR")} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 4px", marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-1)" }}>{t("totalDue")}</span>
                    <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {fmt(data.grand_total, data.currency ?? "IDR")}
                    </span>
                  </div>
                </Card>

                {data.anomalies && data.anomalies.length > 0 && (
                  <Card delay={0.20} style={{ borderColor: "rgba(251,191,36,0.25)" }}>
                    <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {t("anomaliesDetected")}</h2>
                    {data.anomalies.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", marginBottom: 6, background: "var(--warning-bg)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(251,191,36,0.15)" }}>
                        <span style={{ color: "var(--warning)", flexShrink: 0 }}>!</span>
                        <span style={{ color: "var(--text-2)", fontSize: 13 }}>{a}</span>
                      </div>
                    ))}
                  </Card>
                )}

                <details style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <summary style={{ padding: "12px 16px", cursor: "pointer", fontSize: 12, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", userSelect: "none", listStyle: "none" }}>{"{ }"} {t("rawJsonOutput")}</summary>
                  <pre style={{ padding: "0 16px 16px", margin: 0, fontSize: 11, color: "var(--text-2)", overflowX: "auto", fontFamily: "var(--font-mono, monospace)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Camera modal */}
      {state === "camera" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2000px rgba(0,0,0,0.5)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "85%", height: "65%", position: "relative", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ position: "absolute", top: -2, left: -2, width: 40, height: 40, borderTop: "4px solid #fff", borderLeft: "4px solid #fff", borderRadius: "10px 0 0 0" }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 40, height: 40, borderTop: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 10px 0 0" }} />
              <div style={{ position: "absolute", bottom: -2, left: -2, width: 40, height: 40, borderBottom: "4px solid #fff", borderLeft: "4px solid #fff", borderRadius: "0 0 0 10px" }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 40, height: 40, borderBottom: "4px solid #fff", borderRight: "4px solid #fff", borderRadius: "0 0 10px 0" }} />
              <div className="anim-fade-in" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t("alignInvoice")}</div>
            </div>
          </div>
          <div className="anim-fade-up" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", zIndex: 2 }}>
            <button onClick={stopCamera} style={{ color: "#fff", background: "none", border: "none", fontSize: 16, fontWeight: 500, padding: 10, cursor: "pointer" }}>{t("cancel")}</button>
            <button onClick={capturePhoto} style={{ width: 72, height: 72, borderRadius: "50%", background: "none", border: "4px solid #fff", padding: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", transition: "transform 0.1s" }}
                onPointerDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                onPointerUp={e => (e.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
            </button>
            <div style={{ width: 68 }} />
          </div>
        </div>
      )}
    </main>
  );
}
