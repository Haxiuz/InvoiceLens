"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { User, Image as ImageIcon, Type, Camera, Check, RotateCcw } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedNickname = localStorage.getItem("profileNickname") || "";
    const savedAvatar = localStorage.getItem("profileAvatar") || "";
    const savedBg = localStorage.getItem("profileBg") || "";
    setNickname(savedNickname);
    setAvatarUrl(savedAvatar);
    setBgUrl(savedBg);
    if (savedAvatar) setAvatarPreview(savedAvatar);
    if (savedBg) setBgPreview(savedBg);
  }, []);

  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleBgFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBgPreview(result);
      setBgUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (nickname.trim()) localStorage.setItem("profileNickname", nickname.trim());
    else localStorage.removeItem("profileNickname");

    if (avatarUrl) localStorage.setItem("profileAvatar", avatarUrl);
    else localStorage.removeItem("profileAvatar");

    if (bgUrl) localStorage.setItem("profileBg", bgUrl);
    else localStorage.removeItem("profileBg");

    // Apply background immediately
    if (bgUrl) {
      document.body.style.backgroundImage = `url(${bgUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundPosition = "center";
    } else {
      document.body.style.backgroundImage = "";
    }

    // Notify header
    window.dispatchEvent(new Event("profileUpdated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (!confirm("Reset all profile customizations?")) return;
    localStorage.removeItem("profileNickname");
    localStorage.removeItem("profileAvatar");
    localStorage.removeItem("profileBg");
    setNickname("");
    setAvatarUrl("");
    setBgUrl("");
    setAvatarPreview(null);
    setBgPreview(null);
    document.body.style.backgroundImage = "";
    window.dispatchEvent(new Event("profileUpdated"));
  };

  if (status === "loading") return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (status === "unauthenticated") return <div style={{ padding: 40, textAlign: "center" }}>Please sign in to access your profile.</div>;

  const displayName = nickname || session?.user?.name || "User";
  const displayAvatar = avatarPreview || session?.user?.image;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
      {/* Page header */}
      <div className="anim-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <User size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Profile</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Customize your personal appearance</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 300px)", gap: 24, alignItems: "start" }}>

        {/* Left: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Nickname */}
          <div className="anim-fade-up" style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWrapStyle}><Type size={16} color="var(--accent)" /></div>
              <div>
                <h2 style={sectionTitle}>Custom Nickname</h2>
                <p style={sectionSub}>Replaces your name in the header</p>
              </div>
            </div>
            <input
              id="nickname-input"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={session?.user?.name || "Enter a nickname…"}
              maxLength={30}
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{nickname.length}/30 characters</p>
          </div>

          {/* Avatar */}
          <div className="anim-fade-up" style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWrapStyle}><Camera size={16} color="var(--accent)" /></div>
              <div>
                <h2 style={sectionTitle}>Profile Picture</h2>
                <p style={sectionSub}>Upload an image or paste a URL</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={uploadBtnStyle}
              >
                📁 Upload Image
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); }}
              />
            </div>
            <input
              id="avatar-url-input"
              type="url"
              value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
              onChange={e => {
                setAvatarUrl(e.target.value);
                setAvatarPreview(e.target.value || null);
              }}
              placeholder="Or paste an image URL…"
              style={inputStyle}
            />
            {avatarPreview && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarPreview} alt="Avatar preview" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-lit)" }} onError={() => setAvatarPreview(null)} />
                <div>
                  <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>✓ Preview looks good</p>
                  <button onClick={() => { setAvatarPreview(null); setAvatarUrl(""); }} style={{ fontSize: 11, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                </div>
              </div>
            )}
          </div>

          {/* Background */}
          <div className="anim-fade-up" style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWrapStyle}><ImageIcon size={16} color="var(--accent)" /></div>
              <div>
                <h2 style={sectionTitle}>Background Image</h2>
                <p style={sectionSub}>Set a custom full-page background</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button onClick={() => bgInputRef.current?.click()} style={uploadBtnStyle}>
                📁 Upload Image
              </button>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleBgFile(f); }}
              />
            </div>
            <input
              id="bg-url-input"
              type="url"
              value={bgUrl.startsWith("data:") ? "" : bgUrl}
              onChange={e => {
                setBgUrl(e.target.value);
                setBgPreview(e.target.value || null);
              }}
              placeholder="Or paste an image URL…"
              style={inputStyle}
            />
            {bgPreview && (
              <div style={{ marginTop: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bgPreview} alt="Background preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }} onError={() => setBgPreview(null)} />
                <button onClick={() => { setBgPreview(null); setBgUrl(""); }} style={{ fontSize: 11, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}>Remove background</button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              id="save-profile-btn"
              onClick={handleSave}
              style={{
                flex: 1, padding: "13px 0", borderRadius: "var(--radius-md)",
                background: saved ? "var(--success)" : "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.3s",
              }}
            >
              {saved ? <><Check size={16}/> Saved!</> : "💾 Save Changes"}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "13px 18px", borderRadius: "var(--radius-md)",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                color: "var(--text-2)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RotateCcw size={14}/> Reset
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="anim-fade-up" style={{ position: "sticky", top: 80 }}>
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>Live Preview</p>

            {/* Avatar preview */}
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={displayName}
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--border-lit)", boxShadow: "0 0 24px var(--accent-glow)" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700, color: "#fff",
                  boxShadow: "0 0 24px var(--accent-glow)",
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{displayName}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>{session?.user?.email}</p>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>Header preview:</p>
              <div style={{ background: "rgba(12,12,20,0.9)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>Invoice<span style={{ color: "var(--accent-2)" }}>Lens</span></span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} onError={() => {}} />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {nickname && <span style={{ fontSize: 11, color: "var(--text-2)" }}>{nickname}</span>}
                </div>
              </div>
            </div>
          </div>

          {bgPreview && (
            <div style={{ ...cardStyle, marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Background Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bgPreview} alt="bg" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: "var(--radius-md)", opacity: 0.8 }} onError={() => setBgPreview(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)",
};

const iconWrapStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", background: "rgba(124,110,247,0.1)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 2,
};

const sectionSub: React.CSSProperties = {
  fontSize: 12, color: "var(--text-3)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-1)",
  fontSize: 13, outline: "none",
};

const uploadBtnStyle: React.CSSProperties = {
  padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-1)", cursor: "pointer",
  fontSize: 13, fontWeight: 500,
};
