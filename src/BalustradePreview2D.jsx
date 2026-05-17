import { useEffect, useRef } from "react";

export default function BalustradePreview3D({ dimensions, glassType, glassShape, mountingType, profileShape, skirtOverride, includeHandrail, includeLed }) {
  const canvasRef = useRef(null);

  const length = parseFloat(dimensions.length) || 3;
  const height = parseFloat(dimensions.height) || 0.9;
  const skirt = skirtOverride !== undefined ? skirtOverride
    : mountingType === "clips" ? 0.35
    : (mountingType === "profile" && profileShape === "V") ? 0.10
    : 0;
  const hasSkirt = skirt > 0;
  const panelCount = Math.max(1, Math.ceil(length / 1.1));
  const pW = length / panelCount;
  const isRampa = glassShape === "forma";
  const stepH = isRampa ? height * 0.35 : 0; // cat urca fiecare panou

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, W, H);

    const totalH = height + skirt;
    const angleY = 0.5;
    const angleX = 0.2;

    const project = (x, y, z) => {
      const cx = x - length / 2;
      const cy = y - totalH / 2;
      const cz = z;
      const rx = cx * Math.cos(angleY) + cz * Math.sin(angleY);
      const rz = -cx * Math.sin(angleY) + cz * Math.cos(angleY);
      const ry = cy * Math.cos(angleX) - rz * Math.sin(angleX);
      const rz2 = cy * Math.sin(angleX) + rz * Math.cos(angleX);
      const dist = 6;
      const sc = dist / (dist + rz2);
      const zoom = Math.max(30, 90 - length * 8);
      return [W / 2 + rx * sc * zoom, H / 2 - ry * sc * zoom];
    };

    const face = (pts, fill, stroke, sw = 1, dash = []) => {
      if (!pts || pts.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      pts.slice(1).forEach(p => ctx.lineTo(...p));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
    };

    const box = (x, y, z, w, h, d, cTop, cFront, cSide, stroke) => {
      face([project(x,y,z), project(x+w,y,z), project(x+w,y+h,z), project(x,y+h,z)], cFront, stroke, 0.8);
      face([project(x,y+h,z), project(x+w,y+h,z), project(x+w,y+h,z+d), project(x,y+h,z+d)], cTop, stroke, 0.8);
      face([project(x+w,y,z), project(x+w,y,z+d), project(x+w,y+h,z+d), project(x+w,y+h,z)], cSide, stroke, 0.8);
    };

    const inox = "rgba(200,169,110,0.9)";
    const inoxTop = "rgba(220,190,130,0.9)";
    const inoxSide = "rgba(160,130,80,0.9)";
    const inoxStroke = "rgba(230,200,140,0.6)";
    const glassAlpha = glassType === "extraclar" ? 0.22 : glassType === "10mm" ? 0.28 : 0.35;
    const glassFront = `rgba(180,220,255,${glassAlpha})`;
    const glassTop = `rgba(180,220,255,${glassAlpha * 0.6})`;
    const glassSide = `rgba(180,220,255,${glassAlpha * 0.4})`;
    const glassStroke = "rgba(180,220,255,0.6)";

    // Pardoseala
    face([
      project(-0.2, 0, -0.1), project(length + 0.2, 0, -0.1),
      project(length + 0.2, 0, 0.15), project(-0.2, 0, 0.15)
    ], "#1a1d26", "rgba(200,169,110,0.2)", 0.5);

    // ═══════════════════════════════════════════════════════════
    // FUSTA (skirt) — urmează rampa dacă e cazul
    // ═══════════════════════════════════════════════════════════
    if (hasSkirt) {
      for (let i = 0; i < panelCount; i++) {
        // Fusta urca la fel ca panourile
        const yBottomLeft  = isRampa ? i * stepH : 0;
        const yBottomRight = isRampa ? (i + 1) * stepH : 0;
        const yTopLeft     = yBottomLeft + skirt;
        const yTopRight    = yBottomRight + skirt;

        // Fata fustei - paralelogram inclinat
        face([
          project(i * pW + 0.01, yBottomLeft,  -0.005),
          project(i * pW + pW - 0.01, yBottomRight, -0.005),
          project(i * pW + pW - 0.01, yTopRight,    -0.005),
          project(i * pW + 0.01, yTopLeft,     -0.005),
        ], glassFront, glassStroke, 1);

        // Top fustei
        face([
          project(i * pW + 0.01, yTopLeft,  -0.005),
          project(i * pW + pW - 0.01, yTopRight, -0.005),
          project(i * pW + pW - 0.01, yTopRight,  0.005),
          project(i * pW + 0.01, yTopLeft,   0.005),
        ], glassTop, glassStroke, 0.5);

        // Linie punctata delimitare fusta/panou
        const p1 = project(i * pW + 0.01, yTopLeft, 0);
        const p2 = project(i * pW + pW - 0.01, yTopRight, 0);
        ctx.beginPath();
        ctx.moveTo(...p1); ctx.lineTo(...p2);
        ctx.strokeStyle = "rgba(180,220,255,0.8)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label fusta
      if (isRampa) {
        // Label la mijlocul ultimului panou de fusta
        const midX = length * 0.7;
        const midY = (panelCount - 1) * stepH + skirt / 2;
        const [lx, ly] = project(midX, midY, 0);
        ctx.fillStyle = "rgba(200,169,110,0.6)";
        ctx.font = "9px DM Sans";
        ctx.fillText(skirt === 0.35 ? "350mm" : "100mm", lx + 6, ly);
      } else {
        const mid = project(length * 0.85, skirt / 2, 0);
        ctx.fillStyle = "rgba(200,169,110,0.6)";
        ctx.font = "9px DM Sans";
        ctx.fillText(skirt === 0.35 ? "350mm" : "100mm", mid[0] + 6, mid[1]);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PANOURI STICLA
    // ═══════════════════════════════════════════════════════════
    for (let i = 0; i < panelCount; i++) {
      if (isRampa) {
        // Fiecare panou urca - stanga mai jos, dreapta mai sus
        const yBottomLeft  = skirt + i * stepH;
        const yBottomRight = skirt + (i + 1) * stepH;
        const yTopLeft     = yBottomLeft + height;
        const yTopRight    = yBottomRight + height;

        // Dreptunghi punctat - suprafata platita (dreptunghi maxim)
        face([
          project(i * pW + 0.01, skirt, -0.005),
          project(i * pW + pW - 0.01, skirt, -0.005),
          project(i * pW + pW - 0.01, yTopRight, -0.005),
          project(i * pW + 0.01, yTopRight, -0.005),
        ], null, "rgba(180,220,255,0.2)", 0.8, [4, 3]);

        // Panou real - paralelogram inclinat
        face([
          project(i * pW + 0.01, yBottomLeft,  -0.005),
          project(i * pW + pW - 0.01, yBottomRight, -0.005),
          project(i * pW + pW - 0.01, yTopRight,    -0.005),
          project(i * pW + 0.01, yTopLeft,     -0.005),
        ], glassFront, glassStroke, 1.5);

        // Muchia superioara
        face([
          project(i * pW + 0.01, yTopLeft,  -0.005),
          project(i * pW + pW - 0.01, yTopRight, -0.005),
          project(i * pW + pW - 0.01, yTopRight,  0.005),
          project(i * pW + 0.01, yTopLeft,   0.005),
        ], glassTop, glassStroke, 0.5);

        // Muchia inferioara inclinata
        face([
          project(i * pW + 0.01, yBottomLeft,  -0.005),
          project(i * pW + pW - 0.01, yBottomRight, -0.005),
          project(i * pW + pW - 0.01, yBottomRight,  0.005),
          project(i * pW + 0.01, yBottomLeft,   0.005),
        ], glassTop, glassStroke, 0.5);

      } else {
        box(i * pW + 0.01, 0, -0.005, pW - 0.02, totalH, 0.01, glassTop, glassFront, glassSide, glassStroke);
      }
    }

    // Separatori panouri
    for (let i = 1; i < panelCount; i++) {
      const sepY = isRampa ? skirt + i * stepH : 0;
      box(i * pW - 0.008, sepY, -0.01, 0.016, totalH - sepY, 0.02,
        "rgba(150,190,210,0.5)", "rgba(150,190,210,0.4)", "rgba(120,160,180,0.4)", "rgba(180,220,255,0.3)");
    }

    // ═══════════════════════════════════════════════════════════
    // BUTONI INOX — urmează rampa
    // ═══════════════════════════════════════════════════════════
    if (mountingType === "clips") {
      for (let i = 0; i < panelCount; i++) {
        const yBaseLeft  = isRampa ? i * stepH : 0;
        const yBaseRight = isRampa ? (i + 1) * stepH : 0;
        const xLeft  = i * pW + pW * 0.18;
        const xRight = i * pW + pW * 0.82;

        // 2 butoni pe fiecare parte, urcand odata cu rampa
        [
          { x: xLeft,  y: yBaseLeft  + skirt * 0.28 },
          { x: xLeft,  y: yBaseLeft  + skirt * 0.72 },
          { x: xRight, y: yBaseRight + skirt * 0.28 },
          { x: xRight, y: yBaseRight + skirt * 0.72 },
        ].forEach(pos => {
          const [cx, cy] = project(pos.x, pos.y, 0.012);
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200,169,110,0.2)"; ctx.fill();
          ctx.strokeStyle = inox; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = inox; ctx.fill();
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // MINI-MONTANTI — urmează rampa
    // ═══════════════════════════════════════════════════════════
    if (mountingType === "mini-montanti") {
      for (let i = 0; i < panelCount; i++) {
        const x1 = i * pW + pW * 0.15;
        const x2 = (i + 1) * pW - pW * 0.15;

        // Montant stanga
        const yBaseLeft = isRampa ? i * stepH : 0;
        const montH1 = isRampa ? skirt + height : totalH;
        box(x1 - 0.025, yBaseLeft, -0.02, 0.05, montH1, 0.04, inoxTop, inox, inoxSide, inoxStroke);

        // Montant dreapta
        const yBaseRight = isRampa ? (i + 1) * stepH : 0;
        const montH2 = isRampa ? skirt + height : totalH;
        box(x2 - 0.025, yBaseRight, -0.02, 0.05, montH2, 0.04, inoxTop, inox, inoxSide, inoxStroke);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PROFILE (U / L / V) — urmează rampa
    // ═══════════════════════════════════════════════════════════════════
    if (mountingType === "profile") {
      if (profileShape === "U") {
        // Baza U — urmează rampa
        if (isRampa) {
          // Desenam U ca o serie de segmente
          for (let i = 0; i < panelCount; i++) {
            const yBaseLeft  = i * stepH;
            const yBaseRight = (i + 1) * stepH;
            const yTop = yBaseLeft + skirt + height;

            // Segment baza
            box(i * pW, yBaseLeft, -0.03, pW, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
            // Perete stanga segment
            box(i * pW, yBaseLeft, -0.03, 0.018, yTop - yBaseLeft, 0.06, inoxTop, inox, inoxSide, inoxStroke);
            // Perete dreapta segment
            box(i * pW + pW - 0.018, yBaseRight, -0.03, 0.018, yTop - yBaseRight, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          }
        } else {
          box(-0.02, -0.07, -0.03, length + 0.04, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          box(-0.02, -0.07, -0.03, 0.018, 0.13, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          box(length + 0.002, -0.07, -0.03, 0.018, 0.13, 0.06, inoxTop, inox, inoxSide, inoxStroke);
        }
      }
      if (profileShape === "L") {
        if (isRampa) {
          for (let i = 0; i < panelCount; i++) {
            const yBaseLeft = i * stepH;
            const yTop = yBaseLeft + skirt + height;
            box(i * pW, yBaseLeft, -0.03, pW, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
            box(i * pW, yBaseLeft, -0.03, 0.018, yTop - yBaseLeft, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          }
        } else {
          box(-0.02, -0.07, -0.03, length + 0.04, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          box(-0.02, -0.07, -0.03, 0.018, 0.13, 0.06, inoxTop, inox, inoxSide, inoxStroke);
        }
      }
      if (profileShape === "V") {
        if (isRampa) {
          for (let i = 0; i < panelCount; i++) {
            const yBaseLeft  = i * stepH;
            const yBaseRight = (i + 1) * stepH;
            const yTopLeft  = yBaseLeft + skirt + height;
            const yTopRight = yBaseRight + skirt + height;
            // Baza
            box(i * pW, yBaseLeft, -0.03, pW, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
            // Perete stanga
            box(i * pW, yBaseLeft, -0.03, 0.018, yTopLeft - yBaseLeft, 0.06, inoxTop, inox, inoxSide, inoxStroke);
            // Perete dreapta
            box(i * pW + pW - 0.018, yBaseRight, -0.03, 0.018, yTopRight - yBaseRight, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          }
        } else {
          box(-0.02, -0.07, -0.03, length + 0.04, 0.04, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          box(-0.02, -0.07, -0.03, 0.018, skirt + 0.07, 0.06, inoxTop, inox, inoxSide, inoxStroke);
          box(length + 0.002, -0.07, -0.03, 0.018, skirt + 0.07, 0.06, inoxTop, inox, inoxSide, inoxStroke);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CANAL INTEGRAT (embedded) — urmează rampa
    // ═══════════════════════════════════════════════════════════
    if (mountingType === "embedded") {
      if (isRampa) {
        for (let i = 0; i < panelCount; i++) {
          const yBaseLeft = i * stepH;
          box(i * pW, yBaseLeft - 0.06, -0.02, pW, 0.06, 0.04, inoxTop, inox, inoxSide, inoxStroke);
        }
      } else {
        box(-0.03, -0.06, -0.02, length + 0.06, 0.06, 0.04, inoxTop, inox, inoxSide, inoxStroke);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // MANA CURENTA — urmează rampa
    // ═══════════════════════════════════════════════════════════
    if (includeHandrail) {
      if (isRampa) {
        // Mana curenta urca in trepte
        for (let i = 0; i < panelCount; i++) {
          const yBase = skirt + i * stepH + height;
          box(i * pW - 0.08, yBase, -0.022, pW + 0.16, 0.04, 0.044, inoxTop, inox, inoxSide, inoxStroke);
        }
      } else {
        box(-0.08, totalH, -0.022, length + 0.16, 0.04, 0.044, inoxTop, inox, inoxSide, inoxStroke);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // LED — urmează rampa
    // ═══════════════════════════════════════════════════════════
    if (includeLed) {
      if (isRampa) {
        for (let i = 0; i < panelCount; i++) {
          const yBase = skirt + i * stepH + 0.01;
          box(i * pW, yBase, 0.006, pW, 0.012, 0.008,
            "rgba(255,220,80,0.9)", "rgba(255,220,80,0.8)", "rgba(255,200,50,0.7)", "rgba(255,240,100,0.9)");
        }
      } else {
        box(0, skirt + 0.01, 0.006, length, 0.012, 0.008,
          "rgba(255,220,80,0.9)", "rgba(255,220,80,0.8)", "rgba(255,200,50,0.7)", "rgba(255,240,100,0.9)");
      }
    }

  }, [length, height, glassType, glassShape, mountingType, profileShape, skirt, includeHandrail, includeLed, isRampa, panelCount, stepH, hasSkirt, totalH]);

  const skirtLabel = skirt === 0.35 ? "Fustă 350mm" : skirt === 0.10 ? "Fustă 100mm" : null;

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.35)", padding: "10px 0 4px", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Previzualizare 3D · {panelCount} {panelCount === 1 ? "panou" : "panouri"} {isRampa ? "· Rampă" : ""}
      </div>
      <canvas ref={canvasRef} width={340} height={260} style={{ width: "100%", display: "block" }} />
      <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "8px 12px 12px", flexWrap: "wrap" }}>
        {[
          { color: "rgba(180,220,255,0.6)", label: "Sticlă" },
          mountingType === "clips"         && { color: "rgba(200,169,110,0.8)", label: `Butoni (${panelCount * 4} buc)` },
          mountingType === "mini-montanti" && { color: "rgba(200,169,110,0.8)", label: "Mini-Montanți" },
          mountingType === "profile"       && { color: "rgba(200,169,110,0.8)", label: `Profil ${profileShape || ""}` },
          mountingType === "embedded"      && { color: "rgba(200,169,110,0.8)", label: "Canal Integrat" },
          hasSkirt && skirtLabel           && { color: "rgba(180,220,255,0.25)", label: skirtLabel },
          includeHandrail                  && { color: "rgba(200,169,110,0.9)", label: "Mână curentă" },
          includeLed                       && { color: "rgba(255,220,80,0.8)",  label: "LED" },
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
