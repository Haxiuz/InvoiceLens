"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { X, Send, Loader2 } from "lucide-react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = useState("");
  
  const isLoading = status === "streaming" || status === "submitted";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Some newer AI SDK versions expect an object, others might accept string or event.
    // Try passing the message object.
    sendMessage({ role: "user", parts: [{ type: "text", text: input }], id: Date.now().toString() });
    setInput("");
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .markdown-body p {
          margin: 0 0 8px 0;
        }
        .markdown-body p:last-child {
          margin: 0;
        }
        .markdown-body ul, .markdown-body ol {
          margin: 0 0 8px 0;
          padding-left: 20px;
        }
        .markdown-body strong {
          color: inherit;
          font-weight: 600;
        }
      `}</style>
      
      {/* Backdrop for mobile */}
      <div 
        onClick={onClose}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 9999,
          display: "block",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 400,
          background: "rgba(12, 12, 20, 0.98)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-10px 0 40px rgba(0,0,0,0.8)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 8 }}>
            🤖 Financial Assistant
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-3)", marginTop: 40, padding: 20, background: "var(--surface-2)", borderRadius: 16 }}>
              <p style={{ margin: "0 0 10px 0" }}>👋 I am your AI Financial Assistant.</p>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Ask me about your specific invoices, spending habits, or general economic questions. (I cannot answer non-financial topics!)</p>
            </div>
          )}
          
          {messages.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              className="markdown-body"
              style={{
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: 16,
                background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
                color: m.role === "user" ? "#fff" : "var(--text-1)",
                borderBottomRightRadius: m.role === "user" ? 4 : 16,
                borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {m.parts && m.parts.map((part, index) => {
                if (part.type === "text") {
                  return <ReactMarkdown key={index}>{part.text}</ReactMarkdown>;
                }
                return null;
              })}
            </div>
          </div>
        ))}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "12px 16px", borderRadius: 16, background: "var(--surface-2)", color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12 }}>Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--surface)" }}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a financial question..."
            style={{
              flex: 1,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "12px 20px",
              color: "var(--text-1)",
              outline: "none",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !input.trim() ? 0.5 : 1,
              flexShrink: 0,
              transition: "opacity 0.2s"
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
