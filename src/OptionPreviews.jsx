import { useState } from "react";

/**
 * Card opțiune cu preview vizual inline
 * Afișează un indicator colorat + label + descriere + preț
 * Stilizat pentru configuratoarele Glass Associates
 */
export function OptionCard({ selected, onClick, label, desc, price, colorSwatch, icon }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: selected ? "1.5px solid rgba(200,169,110,0.6)" : "1px solid rgba(255,255,255,0.07)",
        background: selected ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 6,
      }}
    >
      {/* Color swatch / icon */}
      {colorSwatch && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: colorSwatch,
          border: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }} />
      )}

      {/* Radio indicator */}
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: selected ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.2)",
        background: selected ? "#c8a96e" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0f1117" }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: selected ? "#c8a96e" : "#f0ede8" }}>{label}</div>
        {desc && <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.4)", marginTop: 2 }}>{desc}</div>}
      </div>

      {/* Price */}
      {price && (
        <div style={{
          fontSize: "0.82rem", fontWeight: 600,
          color: selected ? "#c8a96e" : "rgba(240,237,232,0.5)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {price}
        </div>
      )}
    </div>
  );
}

/**
 * Mini preview SVG pentru tipuri de sticlă
 */
export function GlassPreviewSVG({ type, size = 60 }) {
  const configs = {
    clear:    { fill: "rgba(180,220,255,0.15)", stroke: "rgba(180,220,255,0.4)", label: "Clar" },
    frosted:  { fill: "rgba(200,200,220,0.35)", stroke: "rgba(200,200,220,0.6)", label: "Sablat" },
    nano:     { fill: "rgba(100,200,255,0.2)",  stroke: "rgba(100,200,255,0.5)",  label: "Nano" },
    "662mm":  { fill: "rgba(180,220,255,0.2)",  stroke: "rgba(180,220,255,0.5)",  label: "6.6.2" },
    "882mm":  { fill: "rgba(180,220,255,0.25)", stroke: "rgba(180,220,255,0.55)", label: "8.8.2" },
    "8mm":    { fill: "rgba(180,220,255,0.15)", stroke: "rgba(180,220,255,0.4)",  label: "8mm" },
    "10mm":   { fill: "rgba(180,220,255,0.2)",  stroke: "rgba(180,220,255,0.5)",  label: "10mm" },
  };

  const cfg = configs[type] || configs.clear;

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        <rect x="8" y="5" width="44" height="50" rx="3" fill={cfg.fill} stroke={cfg.stroke} strokeWidth="1.5" />
        {/* Reflection line */}
        <line x1="14" y1="12" x2="30" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1="14" y1="16" x2="24" y2="16" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
      <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.35)", marginTop: 2 }}>{cfg.label}</div>
    </div>
  );
}

/**
 * Mini preview SVG pentru tipuri de mâner
 */
export function HandrailPreviewSVG({ type, size = 60 }) {
  const configs = {
    none:           { label: "Fără" },
    handrail:       { label: "Ø42mm", color: "rgba(200,169,110,0.8)" },
    "handrail-slim": { label: "Slim", color: "rgba(200,169,110,0.6)" },
  };

  const cfg = configs[type] || configs.none;

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        {type !== "none" && (
          <>
            {/* Handrail bar */}
            <rect x="5" y="26" width="50" height="8" rx="4" fill={cfg.color} opacity="0.8" />
            {/* Supports */}
            <rect x="12" y="34" width="3" height="18" rx="1" fill="rgba(200,169,110,0.4)" />
            <rect x="45" y="34" width="3" height="18" rx="1" fill="rgba(200,169,110,0.4)" />
          </>
        )}
        {type === "none" && (
          <text x="30" y="32" textAnchor="middle" fill="rgba(240,237,232,0.2)" fontSize="10">—</text>
        )}
      </svg>
      <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.35)", marginTop: 2 }}>{cfg.label}</div>
    </div>
  );
}

/**
 * Mini preview SVG pentru feronerie / montare
 */
export function HardwarePreviewSVG({ type, size = 60 }) {
  const configs = {
    butoni:           { label: "Butoni",    color: "rgba(200,169,110,0.9)" },
    "mini-montanti":  { label: "Mini-M.",   color: "rgba(200,169,110,0.7)" },
    "profil-pardoseala": { label: "Profil", color: "rgba(200,169,110,0.5)" },
  };

  const cfg = configs[type] || configs.butoni;

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        {/* Glass panel hint */}
        <rect x="20" y="8" width="20" height="44" rx="2" fill="rgba(180,220,255,0.1)" stroke="rgba(180,220,255,0.2)" strokeWidth="1" />
        {type === "butoni" && (
          <>
            <circle cx="25" cy="18" r="4" fill="none" stroke={cfg.color} strokeWidth="1.5" />
            <circle cx="35" cy="18" r="4" fill="none" stroke={cfg.color} strokeWidth="1.5" />
            <circle cx="25" cy="42" r="4" fill="none" stroke={cfg.color} strokeWidth="1.5" />
            <circle cx="35" cy="42" r="4" fill="none" stroke={cfg.color} strokeWidth="1.5" />
          </>
        )}
        {type === "mini-montanti" && (
          <>
            <rect x="16" y="14" width="4" height="32" rx="2" fill={cfg.color} opacity="0.7" />
            <rect x="40" y="14" width="4" height="32" rx="2" fill={cfg.color} opacity="0.7" />
          </>
        )}
        {type === "profil-pardoseala" && (
          <rect x="14" y="48" width="32" height="6" rx="1" fill={cfg.color} opacity="0.6" />
        )}
      </svg>
      <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.35)", marginTop: 2 }}>{cfg.label}</div>
    </div>
  );
}
