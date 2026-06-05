export default function ShowerPreview2D({
  width,
  depth,
  height,
  enclosure,
  subtype,
  glassType,
  finish,
  treatment,
  hasLateral,
  lateralCount = 0,
}) {
  const w = parseFloat(width) || 0.9;
  const h = parseFloat(height) || 2.0;
  const d = hasLateral ? (parseFloat(depth) || 0.9) : 0;

  const VW = 340, VH = 240;
  const MARGIN = 24;
  const isParavan = enclosure === "paravan";
  const isFixBatant = enclosure === "fix-batant";
  const isCulisant = enclosure?.startsWith("culisant");
  const hasBar = subtype?.includes("bara");
  const isTavan = subtype?.includes("tavan");
  const isPerete = subtype?.includes("perete");
  const isWalkin = subtype?.includes("walkin");

  // Scale: fit height in VH-2*MARGIN
  const maxDrawH = VH - MARGIN * 2;
  const maxDrawW = VW - MARGIN * 2;
  const scaleH = maxDrawH / Math.max(h, 0.5);
  const scaleW = maxDrawW / Math.max(isParavan ? w * 1.2 : w * 1.5, 0.5);
  const scale = Math.min(scaleH, scaleW);

  const panelW = w * scale;
  const panelH = h * scale;
  const floorY = VH - MARGIN;
  const topY = floorY - panelH;

  // Center the drawing
  const totalW = isFixBatant ? panelW * 1.2 : isCulisant ? panelW * 1.5 : panelW;
  const x0 = MARGIN + (maxDrawW - totalW) / 2;

  // Glass appearance
  const isFrosted = finish === "satin";
  const glassFill = isFrosted
    ? "rgba(200,200,220,0.25)"
    : "rgba(180,220,255,0.18)";
  const glassStroke = isFrosted
    ? "rgba(200,200,220,0.6)"
    : "rgba(180,220,255,0.55)";
  const gold = "rgba(200,169,110,0.85)";
  const goldFaint = "rgba(200,169,110,0.35)";

  // Bar height (waist level, ~1m from floor)
  const barY = floorY - 1.0 * scale;

  // Draw glass panel helper
  const GlassPanel = ({ x, y, wd, ht, strokeW = 1.5, rx = 1 }) => (
    <rect x={x} y={y} width={wd} height={ht} fill={glassFill} stroke={glassStroke} strokeWidth={strokeW} rx={rx} />
  );

  // Label
  const Label = ({ x, y, text, anchor = "middle", size = 8 }) => (
    <text x={x} y={y} textAnchor={anchor} fill="rgba(200,169,110,0.6)" fontSize={size} fontFamily="DM Sans, sans-serif">{text}</text>
  );

  // Dimension line with arrows
  const DimLine = ({ x1, y1, x2, y2, label, vert = false }) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const offset = 14;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={goldFaint} strokeWidth="0.5" />
        <line x1={x1} y1={vert ? y1 - 4 : y1} x2={x1} y2={vert ? y1 + 4 : y1} stroke={goldFaint} strokeWidth="0.5" />
        <line x1={x2} y1={vert ? y2 - 4 : y2} x2={x2} y2={vert ? y2 + 4 : y2} stroke={goldFaint} strokeWidth="0.5" />
        {vert ? (
          <>
            <line x1={x1 - offset} y1={y1} x2={x1 - offset} y2={y2} stroke={goldFaint} strokeWidth="0.5" />
            <Label x={x1 - offset - 4} y={my + 3} text={label} anchor="end" />
          </>
        ) : (
          <>
            <line x1={x1} y1={y1 + offset} x2={x2} y2={y2 + offset} stroke={goldFaint} strokeWidth="0.5" />
            <Label x={mx} y={y1 + offset + 11} text={label} />
          </>
        )}
      </g>
    );
  };

  // Wall segment
  const Wall = ({ x, y, hgt, side = "left" }) => (
    <rect
      x={side === "left" ? x - 12 : x}
      y={y - 4}
      width={14}
      height={hgt + 4}
      fill="rgba(255,255,255,0.06)"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="0.5"
      rx="2"
    />
  );

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.35)", padding: "10px 0 4px", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Previzualizare 2D · Eleva{"\u021b"}ie Fa{"\u021b"}ă
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", display: "block", background: "#0f1117" }}>
        <rect x="0" y="0" width={VW} height={VH} fill="#0f1117" />

        {/* Floor */}
        <rect x={x0 - 20} y={floorY + 2} width={totalW + 40} height="6" rx="3" fill="#1a1d26" />
        <line x1={x0 - 16} y1={floorY} x2={x0 + totalW + 16} y2={floorY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* === PARAVAN === */}
        {isParavan && (
          <>
            {/* Wall for perete */}
            {isPerete && <Wall x={x0} y={topY} hgt={panelH} side="left" />}

            {/* Glass panel */}
            <GlassPanel x={x0 + (isPerete ? 2 : 0)} y={topY} wd={panelW} ht={panelH} />

            {/* Bară stabilizatoare — ca profil metalic */}
            {hasBar && (
              <g>
                <rect x={x0 - 6} y={barY - 4} width={panelW + 12} height="8" rx="3"
                  fill="rgba(200,169,110,0.18)" stroke={gold} strokeWidth="1.2" />
                <line x1={x0 - 4} y1={barY} x2={x0 + panelW + 4} y2={barY}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              </g>
            )}

            {/* Tavan: top line to indicate ceiling mount */}
            {isTavan && (
              <line x1={x0 - 10} y1={topY} x2={x0 + panelW + 10} y2={topY}
                stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            )}

            {/* Walk-in: subtle floor indicator on both sides */}
            {isWalkin && (
              <rect x={x0 - 6} y={floorY - 4} width={panelW + 12} height="4" rx="1"
                fill="rgba(200,169,110,0.1)" />
            )}

            {/* Height dimension */}
            <DimLine x1={x0 + panelW + 16} y1={topY} x2={x0 + panelW + 16} y2={floorY} label={`${h}m`} vert />

            {/* Width dimension */}
            <DimLine x1={x0} y1={floorY} x2={x0 + panelW} y2={floorY} label={`${w}m`} />
          </>
        )}

        {/* === FIX + BATANT === */}
        {isFixBatant && (
          <>
            {/* Walls on both sides */}
            <Wall x={x0} y={topY} hgt={panelH} side="left" />
            <Wall x={x0 + totalW} y={topY} hgt={panelH} side="right" />

            {/* Fixed panel (left ~40%) */}
            <GlassPanel x={x0 + 2} y={topY} wd={panelW * 0.4} ht={panelH} />
            {/* Door panel (right ~60%) */}
            <GlassPanel x={x0 + panelW * 0.4 + 4} y={topY} wd={panelW * 0.55} ht={panelH} />

            {/* Hinge indicator */}
            <line x1={x0 + panelW * 0.4 + 4} y1={topY + 8} x2={x0 + panelW * 0.4 + 4} y2={floorY - 8}
              stroke={gold} strokeWidth="1.5" strokeDasharray="2,2" />

            {/* Door handle */}
            <rect x={x0 + panelW * 0.85} y={barY - 4} width="3" height="20" rx="1.5" fill={gold} />

            {/* Ceiling */}
            <line x1={x0 - 4} y1={topY} x2={x0 + totalW + 4} y2={topY}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            <DimLine x1={x0 + totalW + 16} y1={topY} x2={x0 + totalW + 16} y2={floorY} label={`${h}m`} vert />
            <DimLine x1={x0} y1={floorY} x2={x0 + totalW} y2={floorY} label={`${w}m`} />
          </>
        )}

        {/* === CULISANT (both types) === */}
        {isCulisant && (
          <>
            {/* Walls */}
            <Wall x={x0} y={topY} hgt={panelH} side="left" />
            <Wall x={x0 + totalW} y={topY} hgt={panelH} side="right" />

            {/* Back fixed panel (darker) */}
            <GlassPanel x={x0 + 2} y={topY} wd={panelW * 0.68} ht={panelH} />
            {/* Front sliding panel (lighter, offset right) */}
            <rect x={x0 + panelW * 0.3} y={topY + 3} width={panelW * 0.48} height={panelH - 6}
              fill="rgba(180,220,255,0.28)" stroke="rgba(180,220,255,0.7)" strokeWidth="1.5" rx="1" />

            {/* Sliding arrow */}
            <line x1={x0 + panelW * 0.3} y1={topY - 10} x2={x0 + panelW * 0.78} y2={topY - 10}
              stroke={goldFaint} strokeWidth="1" markerEnd="url(#arrowGold)" />
            <polygon points={`${x0 + panelW * 0.78},${topY - 10} ${x0 + panelW * 0.78 - 5},${topY - 13} ${x0 + panelW * 0.78 - 5},${topY - 7}`}
              fill={goldFaint} />

            {/* Rollers at top */}
            {!enclosure?.includes("sina") && (
              <>
                <circle cx={x0 + panelW * 0.1} cy={topY + 3} r="2.5" fill={gold} />
                <circle cx={x0 + panelW * 0.65} cy={topY + 3} r="2.5" fill={gold} />
              </>
            )}

            {/* Handle on sliding panel */}
            <rect x={x0 + panelW * 0.5} y={barY - 4} width="3" height="18" rx="1.5" fill={gold} />

            {/* Ceiling */}
            <line x1={x0 - 4} y1={topY} x2={x0 + totalW + 4} y2={topY}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            <DimLine x1={x0 + totalW + 16} y1={topY} x2={x0 + totalW + 16} y2={floorY} label={`${h}m`} vert />
            <DimLine x1={x0} y1={floorY} x2={x0 + totalW} y2={floorY} label={`${w}m`} />
          </>
        )}

        {/* Arrow marker def */}
        <defs>
          <marker id="arrowGold" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <polygon points="0,0 10,5 0,10" fill={goldFaint} />
          </marker>
        </defs>
      </svg>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "8px 12px 12px", flexWrap: "wrap" }}>
        {[
          { color: glassFill, label: isFrosted ? "Sablat" : glassType === "10mm" ? "Sticlă 10mm" : "Sticlă 8mm" },
          isParavan && hasBar && { color: gold, label: "Bară stabilizatoare" },
          isParavan && isTavan && { color: "rgba(255,255,255,0.2)", label: "Până în tavan" },
          isParavan && isWalkin && { color: "rgba(200,169,110,0.2)", label: "Walk-in" },
          isParavan && isPerete && { color: "rgba(255,255,255,0.15)", label: "Montare perete" },
          isFixBatant && { color: gold, label: "Fix + Ușă Batantă" },
          isCulisant && { color: gold, label: enclosure?.includes("sina") ? "Culisant în Șină" : "Culisant la Vedere" },
          hasLateral && { color: "rgba(180,220,255,0.25)", label: `${lateralCount} latură${lateralCount > 1 ? "i" : ""} sticlă` },
          treatment === "enduroshield" && { color: "rgba(180,220,255,0.15)", label: "ENDURO-Shield" },
        ].filter(Boolean).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, border: "1px solid rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.4)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
