export default function BalustradePreview3D({
  dimensions,
  glassType,
  glassShape,
  mountingType,
  profileShape,
  skirtOverride,
  includeHandrail,
  includeLed,
}) {
  const length = parseFloat(dimensions.length) || 3;
  const height = parseFloat(dimensions.height) || 0.9;
  const skirt = skirtOverride !== undefined ? skirtOverride : mountingType === "clips" ? 0.35 : 0;
  const panelCount = Math.max(1, Math.ceil(length / 1.1));
  const isRampa = glassShape === "forma";
  const viewBoxWidth = 340;
  const viewBoxHeight = 260;
  const paddingX = 28;
  const baseY = 212;
  const scaleX = (viewBoxWidth - paddingX * 2) / Math.max(length, 1);
  const maxRise = isRampa ? height * 0.35 * panelCount : 0;
  const scaleY = 120 / Math.max(height + skirt + maxRise, 1);
  const panelWidth = length / panelCount;
  const glassTint = glassType === "882mm" ? "rgba(180,220,255,0.34)" : "rgba(180,220,255,0.26)";
  const miniMontantHeight = Math.max(0.11, Math.min(height * 0.196, 0.168));

  const rampOffsetAtX = (x) => {
    if (!isRampa) return 0;
    return (x / Math.max(length, 0.001)) * maxRise;
  };

  const toSvgPoint = (x, y) => ({
    x: paddingX + x * scaleX,
    y: baseY - y * scaleY,
  });

  const glassPanels = Array.from({ length: panelCount }, (_, index) => {
    const x1 = index * panelWidth;
    const x2 = (index + 1) * panelWidth;
    const bottomLeft = skirt + rampOffsetAtX(x1);
    const bottomRight = skirt + rampOffsetAtX(x2);
    const topLeft = bottomLeft + height;
    const topRight = bottomRight + height;
    const p1 = toSvgPoint(x1, bottomLeft);
    const p2 = toSvgPoint(x2, bottomRight);
    const p3 = toSvgPoint(x2, topRight);
    const p4 = toSvgPoint(x1, topLeft);
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  });

  const skirtPanels = skirt > 0 ? Array.from({ length: panelCount }, (_, index) => {
    const x1 = index * panelWidth;
    const x2 = (index + 1) * panelWidth;
    const bottomLeft = rampOffsetAtX(x1);
    const bottomRight = rampOffsetAtX(x2);
    const topLeft = bottomLeft + skirt;
    const topRight = bottomRight + skirt;
    const p1 = toSvgPoint(x1, bottomLeft);
    const p2 = toSvgPoint(x2, bottomRight);
    const p3 = toSvgPoint(x2, topRight);
    const p4 = toSvgPoint(x1, topLeft);
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  }) : [];

  const miniMontants = mountingType === "mini-montanti" ? Array.from({ length: panelCount }, (_, index) => {
    const leftX = index * panelWidth + panelWidth * 0.15;
    const rightX = (index + 1) * panelWidth - panelWidth * 0.15;
    return [leftX, rightX].map((x, offsetIndex) => {
      const bottom = skirt + rampOffsetAtX(x);
      const top = bottom + miniMontantHeight;
      const pBottom = toSvgPoint(x, bottom);
      const pTop = toSvgPoint(x, top);
      return (
        <line
          key={`${index}-${offsetIndex}`}
          x1={pBottom.x}
          y1={pBottom.y}
          x2={pTop.x}
          y2={pTop.y}
          stroke="rgba(200,169,110,0.9)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
    });
  }).flat() : [];

  const buttons = mountingType === "clips" ? Array.from({ length: panelCount }, (_, index) => {
    const leftX = index * panelWidth + panelWidth * 0.18;
    const rightX = index * panelWidth + panelWidth * 0.82;
    const leftBase = rampOffsetAtX(leftX);
    const rightBase = rampOffsetAtX(rightX);
    return [
      { x: leftX, y: leftBase + skirt * 0.28 },
      { x: leftX, y: leftBase + skirt * 0.72 },
      { x: rightX, y: rightBase + skirt * 0.28 },
      { x: rightX, y: rightBase + skirt * 0.72 },
    ].map((point, pointIndex) => {
      const p = toSvgPoint(point.x, point.y);
      return (
        <circle
          key={`${index}-${pointIndex}`}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill="rgba(15,17,23,0.9)"
          stroke="rgba(200,169,110,0.95)"
          strokeWidth="1.5"
        />
      );
    });
  }).flat() : [];

  const embeddedSegments = mountingType === "embedded" ? Array.from({ length: panelCount }, (_, index) => {
    const x1 = index * panelWidth;
    const x2 = (index + 1) * panelWidth;
    const y1 = skirt + rampOffsetAtX(x1);
    const y2 = skirt + rampOffsetAtX(x2);
    const p1 = toSvgPoint(x1, y1);
    const p2 = toSvgPoint(x2, y2);
    const p3 = toSvgPoint(x2, y2 - 0.06);
    const p4 = toSvgPoint(x1, y1 - 0.06);
    return (
      <polygon
        key={index}
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
        fill="rgba(200,169,110,0.85)"
        stroke="rgba(230,200,140,0.55)"
        strokeWidth="1"
      />
    );
  }) : [];

  const handrailSegments = includeHandrail ? Array.from({ length: panelCount }, (_, index) => {
    const x1 = index * panelWidth;
    const x2 = (index + 1) * panelWidth;
    const y1 = skirt + rampOffsetAtX(x1) + height;
    const y2 = skirt + rampOffsetAtX(x2) + height;
    const p1 = toSvgPoint(x1, y1);
    const p2 = toSvgPoint(x2, y2);
    return (
      <line
        key={index}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="rgba(200,169,110,0.95)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    );
  }) : [];

  const ledSegments = includeLed ? Array.from({ length: panelCount }, (_, index) => {
    const x1 = index * panelWidth;
    const x2 = (index + 1) * panelWidth;
    const y1 = skirt + rampOffsetAtX(x1) + 0.01;
    const y2 = skirt + rampOffsetAtX(x2) + 0.01;
    const p1 = toSvgPoint(x1, y1);
    const p2 = toSvgPoint(x2, y2);
    return (
      <line
        key={index}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="rgba(255,220,80,0.95)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  }) : [];

  const profileStroke = mountingType === "profile" ? `Profil ${profileShape || ""}` : mountingType === "embedded" ? "Canal Integrat" : mountingType === "mini-montanti" ? "Mini-Montanți" : `Butoni (${panelCount * 4} buc)`;

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.35)", padding: "10px 0 4px", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Previzualizare 2D · {panelCount} {panelCount === 1 ? "panou" : "panouri"} {isRampa ? "· Rampă" : ""}
      </div>
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={{ width: "100%", display: "block", background: "#0f1117" }}>
        <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="#0f1117" />
        <rect x={paddingX - 10} y={baseY + 3} width={viewBoxWidth - (paddingX - 10) * 2} height="12" rx="4" fill="#1a1d26" />

        {embeddedSegments}
        {skirtPanels.map((points, index) => (
          <polygon key={`skirt-${index}`} points={points} fill="rgba(180,220,255,0.18)" stroke="rgba(180,220,255,0.45)" strokeWidth="1" />
        ))}
        {glassPanels.map((points, index) => (
          <polygon key={`glass-${index}`} points={points} fill={glassTint} stroke="rgba(180,220,255,0.75)" strokeWidth="1.5" />
        ))}
        {miniMontants}
        {buttons}
        {handrailSegments}
        {ledSegments}
      </svg>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "8px 12px 12px", flexWrap: "wrap" }}>
        {[
          { color: "rgba(180,220,255,0.6)", label: "Sticlă" },
          { color: "rgba(200,169,110,0.85)", label: profileStroke },
          skirt > 0 && { color: "rgba(180,220,255,0.25)", label: skirt === 0.35 ? "Fustă 350mm" : "Fustă 100mm" },
          includeHandrail && { color: "rgba(200,169,110,0.95)", label: "Mână curentă" },
          includeLed && { color: "rgba(255,220,80,0.95)", label: "LED" },
        ].filter(Boolean).map((item, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, border: "1px solid rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.4)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
