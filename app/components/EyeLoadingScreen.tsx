import React, { useEffect, useState } from 'react';

export default function EyeLoadingScreen({ text, showProgress, progress, pageName }: { text?: string, showProgress?: boolean, progress?: number, pageName?: string }) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d >= 3 ? 1 : d + 1);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', width: '100%', flex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes eyeSpin {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(360deg) scale(1.1); }
          25% { transform: rotate(360deg) scale(1); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}} />
      
      {pageName && (
        <div style={{
          border: '2px solid #b30000',
          padding: '16px 80px',
          marginBottom: 32,
          color: '#ff1a1a',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          background: 'rgba(179, 0, 0, 0.05)',
          boxShadow: '0 0 20px rgba(179, 0, 0, 0.1)',
        }}>
          {pageName}
        </div>
      )}

      <div style={{
        width: 250, height: 250, 
        animation: 'eyeSpin 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {/* A beautiful glowing eye SVG */}
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <defs>
            <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M50 25 C20 25 5 50 5 50 C5 50 20 75 50 75 C80 75 95 50 95 50 C95 50 80 25 50 25 Z" 
                fill="none" stroke="url(#eyeGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
          <circle cx="50" cy="50" r="14" fill="url(#eyeGradient)" filter="url(#glow)"/>
          <circle cx="53" cy="47" r="4" fill="#fff" opacity="0.8"/>
        </svg>
      </div>
      <div style={{ marginTop: 24, fontSize: 20, fontWeight: 600, color: 'var(--accent-2)', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ display: 'flex' }}>
          {text || "LOADING"}
          {!showProgress && (
            <span style={{ display: 'inline-block', width: '24px', textAlign: 'left' }}>
              {'.'.repeat(dots)}
            </span>
          )}
        </div>
        {showProgress && progress !== undefined && (
          <div style={{ marginTop: 16, width: 200, height: 4, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-2))", transition: "width 0.3s ease-out" }} />
          </div>
        )}
      </div>
    </div>
  );
}
