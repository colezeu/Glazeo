export default function ShowerPreview2D({ dimensions, glassType, doorType, treatment, includeLed }) {
  const width = parseFloat(dimensions.width) || 0.9;
  const depth = parseFloat(dimensions.depth) || 0.9;
  const height = parseFloat(dimensions.height) || 2.0;

  const W = 340, H = 200;
  const MARGIN = 28;
  // Top-down floor plan
  const scale = Math.min((W * 0.45 - MARGIN) / width, (H - MARGIN * 2) / depth);
  const cabW = width * scale;
  const cabD = depth * scale;
  const x0 = MARGIN + 20;
  const y0 = (H - cabD) / 2;

  // Side elevation
  const scaleH = Math.min((W * 0.4) / width, (H - MARGIN * 2) / height);
  const elW = width * scaleH;
  const elH = height * scaleH;
  const ex0 = W * 0.55;
  const ey0 = (H - elH) / 2;

  const glassAlpha = treatment === "frosted" ? 0.55 : treatment === "nano" ? 0.2 : 0.13;
  const glassStroke = treatment === "frosted" ? "rgba(200,200,220,0.6)" : "rgba(180,220,255,0.5)";
  const glassFill = treatment === "frosted"
    ? `rgba(200,200,220,${glassAlpha})`
    : `rgba(180,220,255,${glassAlpha})`;

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "16px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.7rem", color: "rgba(240,237,232,0.3)", marginBottom: 8, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        <span>Plan · Sus</span>
        <span>Elevație · Față</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>

        {/* ── FLOOR PLAN ── */}
        {/* Floor */}
        <rect x={x0} y={y0} width={cabW} height={cabD}
          fill="rgba(180,220,255,0.06)" stroke="rgba(180,220,255,0.25)" strokeWidth="1.5" />
        {/* Back wall */}
        <rect x={x0} y={y0} width={cabW} height={5} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
        {/* Left wall */}
        <rect x={x0} y={y0} width={5} height={cabD} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
        {/* Door indicator (right side) */}
        {doorType === "swing" && (
          <>
            <rect x={x0 + cabW - 4} y={y0} width={4} height={cabD * 0.55} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
            <path d={`M ${x0 + cabW - 4} ${y0 + cabD * 0.55} A ${cabD * 0.55} ${cabD * 0.55} 0 0 1 ${x0 + cabW - 4 - cabD * 0.55} ${y0}`}
              fill="none" stroke="rgba(200,169,110,0.4)" strokeWidth="1" strokeDasharray="3,3" />
          </>
        )}
        {doorType === "sliding" && (
          <>
            <rect x={x0 + cabW - 4} y={y0} width={4} height={cabD * 0.6} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
            <rect x={x0 + cabW - 4} y={y0 + cabD * 0.05} width={4} height={cabD * 0.5}
              fill="rgba(200,169,110,0.2)" stroke="rgba(200,169,110,0.5)" strokeWidth="1"
              strokeDasharray="2,2" />
          </>
        )}
        {doorType === "fixed" && (
          <rect x={x0 + cabW - 4} y={y0} width={4} height={cabD} fill={glassFill} stroke={glassStroke} strokeWidth="1" />
        )}
        {/* LED ring */}
        {includeLed && (
          <rect x={x0 + 5} y={y0 + 5} width={cabW - 10} height={cabD - 10}
            fill="none" stroke="rgba(255,220,120,0.35)" strokeWidth="2" strokeDasharray="4,3" />
        )}
        {/* Dimension */}
        <text x={x0 + cabW / 2} y={y0 - 8} textAnchor="middle"
          fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dimensions.width || "—"}m</text>
        <text x={x0 - 10} y={y0 + cabD / 2} textAnchor="middle"
          fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans"
          transform={`rotate(-90, ${x0 - 10}, ${y0 + cabD / 2})`}>{dimensions.depth || "—"}m</text>

        {/* ── ELEVATION ── */}
        {/* Glass panels */}
        <rect x={ex0} y={ey0} width={elW} height={elH}
          fill={glassFill} stroke={glassStroke} strokeWidth="1.5" rx="1" />
        {/* Door marker */}
        {doorType !== "fixed" && (
          <line x1={ex0 + elW * 0.6} y1={ey0} x2={ex0 + elW * 0.6} y2={ey0 + elH}
            stroke="rgba(200,169,110,0.5)" strokeWidth="1.5" strokeDasharray="3,3" />
        )}
        {/* Floor */}
        <line x1={ex0 - 8} y1={ey0 + elH} x2={ex0 + elW + 8} y2={ey0 + elH}
          stroke="rgba(200,169,110,0.4)" strokeWidth="2" />
        {/* LED strip */}
        {includeLed && (
          <rect x={ex0} y={ey0 + elH - 6} width={elW} height={4}
            fill="rgba(255,220,120,0.4)" rx="2" />
        )}
        {/* Height dimension */}
        <text x={ex0 + elW + 10} y={ey0 + elH / 2} textAnchor="start"
          fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dimensions.height}m</text>

        {/* Divider */}
        <line x1={W * 0.5} y1={MARGIN} x2={W * 0.5} y2={H - MARGIN}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, flexWrap: "wrap" }}>
        {[
          { color: glassFill, label: treatment === "frosted" ? "Sablat" : "Sticlă" },
          { color: "rgba(200,169,110,0.6)", label: doorType === "sliding" ? "Ușă Culisantă" : doorType === "swing" ? "Ușă Batantă" : "Paravan Fix" },
          includeLed && { color: "rgba(255,220,120,0.7)", label: "LED" }
        ].filter(Boolean).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, border: "1px solid rgba(255,255,255,0.15)" }} />
            <span style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.45)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
