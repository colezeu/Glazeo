import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";

export default function TerraceConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
  const [systemType, setSystemType] = useState("multitrack");
  const [glass, setGlass] = useState("clar");
  const [nrCanate, setNrCanate] = useState(3);
  const [deschidereMijloc, setDeschidereMijloc] = useState(false);
  const [sineNeintrerupte, setSineNeintrerupte] = useState(false);
  const [manerScoica, setManerScoica] = useState(false);
  const [manerRectangular, setManerRectangular] = useState(false);
  const [incuietoare, setIncuietoare] = useState(false);
  const [profileLaterale, setProfileLaterale] = useState(false);
  const [vopsireRAL, setVopsireRAL] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const p = d.products["inchidere-terasa"];
        if (!p) throw new Error("Terrace data missing");
        setProduct(p);
        setVatRate(d.vatRate || p.vatRate || 0.21);
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) return <ErrorBanner message="Nu s-a putut încărca catalogul." onRetry={() => window.location.reload()} onBack />;
  if (!product) return <PageLoader />;

  const p = product;
  const st = p.systemTypes?.[systemType] || {};
  const w = parseFloat(dims.width) || 0;
  const h = parseFloat(dims.height) || 0;
  const isValid = w >= (p.minLungimeMM || 1200) / 1000 && h > 0;
  const lungimeM = Math.ceil(w);
  const inaltimeM = Math.ceil(h);
  const mpTotal = w * h;
  const isMultitrack = systemType === "multitrack";
  const isGhilotina = systemType === "ghilotina";
  const ghilotinaConfig = isGhilotina ? (h <= (st.heightThreshold || 2.5) ? "1+1" : "1+2") : null;

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    const pretSticlaMp = p.glassTypes[glass]?.pricePerSqm || 56;
    const costSticla = mpTotal * pretSticlaMp;
    let costSistem = 0;

    if (isMultitrack) {
      // === MULTITRACK ===
      const costSistemBaza = lungimeM * (st.systemPricePerMeter || 145);
      const esteMijloc = deschidereMijloc;
      const nrSineExtra = (!esteMijloc && nrCanate > 3) ? nrCanate - 3 : 0;
      const pretSinaExtra = st.sinaExtraPricePerMeter || 39;
      const costSineExtra = nrSineExtra * lungimeM * pretSinaExtra;
      const pretProfilLat = st.profilLateralPricePerMeter || 39;
      const costProfileLaterale = profileLaterale ? inaltimeM * pretProfilLat : 0;
      const costIncuietoareVal = incuietoare ? (p.accessories?.incuietoare?.price || 207) : 0;
      const costManere = (manerScoica ? (p.accessories?.manerScoica?.price || 40) : 0)
                       + (manerRectangular ? (p.accessories?.manerRectangular?.price || 80) : 0);
      const costRAL = vopsireRAL ? (lungimeM <= 3 ? 120 : 150) : 0;
      const costFeronerie = costSistemBaza + costSineExtra + costProfileLaterale + costIncuietoareVal + costManere + costRAL;
      const factorSine = sineNeintrerupte ? (st.sineMajorareFactor || 1.35) : 1.0;
      costSistem = Math.round(costFeronerie * factorSine);

      const pretFinal = Math.round(costSticla + costSistem);
      const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
      setQuote({
        area: mpTotal.toFixed(2), glassP: Math.round(costSticla), hardwareP: costSistem,
        canate: nrCanate, sineExtra: nrSineExtra, subtotal, vat, total
      });
    } else if (systemType === "frameless") {
      // === FRAMELESS ===
      costSistem = Math.round(lungimeM * (st.systemPricePerMeter || 350));
      const costManere = (manerScoica ? (p.accessories?.manerScoica?.price || 40) : 0)
                       + (manerRectangular ? (p.accessories?.manerRectangular?.price || 80) : 0);
      const costRAL = vopsireRAL ? (lungimeM <= 3 ? 120 : 150) : 0;
      costSistem += costManere + costRAL;

      const pretFinal = Math.round(costSticla + costSistem);
      const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
      setQuote({
        area: mpTotal.toFixed(2), glassP: Math.round(costSticla), hardwareP: costSistem,
        subtotal, vat, total
      });
    } else if (isGhilotina) {
      // === GHILOTINĂ ===
      const pretMl = ghilotinaConfig === "1+2" ? (st.price1plus2 || 620) : (st.price1plus1 || 480);
      costSistem = Math.round(lungimeM * pretMl);
      const costManere = (manerScoica ? (p.accessories?.manerScoica?.price || 40) : 0)
                       + (manerRectangular ? (p.accessories?.manerRectangular?.price || 80) : 0);
      const costRAL = vopsireRAL ? (lungimeM <= 3 ? 120 : 150) : 0;
      costSistem += costManere + costRAL;

      const pretFinal = Math.round(costSticla + costSistem);
      const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
      setQuote({
        area: mpTotal.toFixed(2), glassP: Math.round(costSticla), hardwareP: costSistem,
        ghilotinaConfig, subtotal, vat, total
      });
    }

    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Închidere Mobilă Terasă" config={{ dims, systemType, glass, nrCanate }} />
      <ConfigHeader title="Configurator Terase & Balcoane" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tipologie sistem */}
          <SectionCard num="01" label="Tipologie Sistem">
            {p.systemTypes && Object.entries(p.systemTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={systemType === k} onClick={() => { setSystemType(k); setQuote(null); }}
                label={d.name} desc={d.desc}
                price={k === "multitrack" ? `${d.systemPricePerMeter}€/ml` : k === "frameless" ? `${d.systemPricePerMeter}€/ml` : `${d.price1plus1}-${d.price1plus2}€/ml`} />
            ))}
          </SectionCard>

          <SectionCard num="02" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lungime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} placeholder="Ex: 4.0" step="0.1" min={1.2} />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} placeholder="Ex: 2.4" step="0.1" />
            </div>
            {w > 0 && w < (p.minLungimeMM || 1200) / 1000 && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Lungimea minimă este {(p.minLungimeMM || 1200) / 1000}m
              </div>
            )}
            {isGhilotina && h > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", fontSize: "0.8rem", color: "rgba(240,237,232,0.6)" }}>
                Configurație: <strong style={{ color: "#c8a96e" }}>{ghilotinaConfig}</strong> {ghilotinaConfig === "1+2" ? "(1 fix + 2 mobile — peste 2.5m)" : "(1 fix + 1 mobil)"}
              </div>
            )}
          </SectionCard>

          <SectionCard num="03" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          {/* Multitrack specific */}
          {isMultitrack && (
            <SectionCard num="04" label="Număr Canate & Deschidere">
              <SelectInput label="Număr canate culisante" value={nrCanate} onChange={v => setNrCanate(Number(v))}
                options={[2,3,4,5,6,7,8].map(n => ({ value: n, label: `${n} canate` }))} />
              <ToggleOption checked={deschidereMijloc} onChange={setDeschidereMijloc} label="Deschidere la mijloc" desc="Canatele se întâlnesc la mijloc — fără șine suplimentare" />
              <ToggleOption checked={sineNeintrerupte} onChange={setSineNeintrerupte} label="Șine neîntrerupte" desc="Feronerie majorată cu 35% pentru șine continue" />
            </SectionCard>
          )}

          {/* Frameless & Ghilotină specific */}
          {!isMultitrack && (
            <SectionCard num="04" label="Specificații">
              <p style={{ fontSize: "0.82rem", color: "rgba(240,237,232,0.4)", lineHeight: 1.7 }}>
                {systemType === "frameless"
                  ? "Panouri full-glass fără rame vizibile. Prinderi punctuale din inox, design minimalist. Ideal pentru terase premium."
                  : "Sistem cu contragreutate pentru ridicare verticală. Ghidaje laterale din aluminiu, mecanism silentios. Configurație automată după înălțime."}
              </p>
            </SectionCard>
          )}

          <SectionCard num={isMultitrack ? "05" : "05"} label="Accesorii">
            {isMultitrack && (
              <ToggleOption checked={profileLaterale} onChange={setProfileLaterale} label={p.systemPrices?.profilLateral?.name || "Profile laterale"} desc={p.systemPrices?.profilLateral?.desc} price={`${p.systemPrices?.profilLateral?.pricePerMeter || 39}€/m`} />
            )}
            {isMultitrack && (
              <ToggleOption checked={incuietoare} onChange={setIncuietoare} label={p.accessories?.incuietoare?.name || "Încuietoare"} desc={p.accessories?.incuietoare?.desc} price={`${p.accessories?.incuietoare?.price || 207}€`} />
            )}
            <ToggleOption checked={manerScoica} onChange={(v) => { setManerScoica(v); if (v) setManerRectangular(false); }} label={p.accessories?.manerScoica?.name || "Mâner Scoică"} desc={p.accessories?.manerScoica?.desc} price={`${p.accessories?.manerScoica?.price || 40}€`} />
            <ToggleOption checked={manerRectangular} onChange={(v) => { setManerRectangular(v); if (v) setManerScoica(false); }} label={p.accessories?.manerRectangular?.name || "Mâner Rectangular"} desc={p.accessories?.manerRectangular?.desc} price={`${p.accessories?.manerRectangular?.price || 80}€`} />
            <ToggleOption checked={vopsireRAL} onChange={setVopsireRAL} label="Vopsire Câmp Electrostatic RAL" desc={`Cost fix per sistem: ${lungimeM > 0 ? (lungimeM <= 3 ? '120€' : '150€') : '120-150€'} + TVA`} price={lungimeM > 0 ? `${lungimeM <= 3 ? '120' : '150'}€` : '120-150€'} />
            <div className="option-preview-grid" style={{ marginTop: 8 }}>
              <div className={`option-preview-item ${manerScoica ? "selected" : ""}`} onClick={() => { setManerScoica(!manerScoica); if (!manerScoica) setManerRectangular(false); }} title="Mâner Scoică">
                <img src="/maner-scoica.png" alt="Mâner Scoică" style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
                <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>Scoică</div>
              </div>
              <div className={`option-preview-item ${manerRectangular ? "selected" : ""}`} onClick={() => { setManerRectangular(!manerRectangular); if (!manerRectangular) setManerScoica(false); }} title="Mâner Rectangular">
                <img src="/maner-rectangular.png" alt="Mâner Rectangular" style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
                <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>Rectangular</div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <TerracePreview w={w} h={h} nrCanate={isMultitrack ? nrCanate : 3} glass={glass} systemType={systemType} />
          </PreviewBox>

          {(manerScoica || manerRectangular) && (
            <div className="glass-card" style={{ borderRadius: 20, padding: "20px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", marginBottom: 16 }}>Detaliu mâner</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                {manerScoica && (
                  <div style={{ textAlign: "center" }}>
                    <img src="/maner-scoica.png" alt="Mâner Scoică" style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }} />
                    <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginTop: 6 }}>Mâner Scoică — {p.accessories?.manerScoica?.price || 40}€</div>
                  </div>
                )}
                {manerRectangular && (
                  <div style={{ textAlign: "center" }}>
                    <img src="/maner-rectangular.png" alt="Mâner Rectangular" style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }} />
                    <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginTop: 6 }}>Mâner Rectangular — {p.accessories?.manerRectangular?.price || 80}€</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <QuoteSidebar
            quote={quote}
            isFormValid={isValid}
            calculating={calculating}
            onCalculate={calculate}
            onReset={() => setQuote(null)}
            onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: `Suprafață (${mpTotal.toFixed(1)}m²)`, value: formatPrice(quote.glassP) },
              { label: `Sistem ${systemType}`, value: formatPrice(quote.hardwareP) },
              isMultitrack && quote.canate && { label: `${quote.canate} canate`, value: "" },
              isMultitrack && quote.sineExtra > 0 && { label: `Șine extra (${quote.sineExtra})`, value: "inclus", accent: true },
              isMultitrack && sineNeintrerupte && { label: "Șine neîntrerupte", value: "+35%", accent: true },
              isGhilotina && quote.ghilotinaConfig && { label: `Config. ${quote.ghilotinaConfig}`, value: "", accent: true },
            ].filter(Boolean) : []}
          />

          <button onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>
            💾 Salvează proiect
          </button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal productType="terrace"
          config={{ dims, systemType, glass, nrCanate, deschidereMijloc, sineNeintrerupte, manerScoica, manerRectangular, incuietoare, profileLaterale, vopsireRAL }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}

/** SVG preview */
function TerracePreview({ w, h, nrCanate, glass, systemType }: { w: number; h: number; nrCanate: number; glass: string; systemType: string }) {
  const W = 300, H = 170, M = 16;
  const realW = w || 4, realH = h || 2.4;
  const sc = Math.min((W - M * 2) / realW, (H - M * 2) / realH);
  const gW = realW * sc, gH = realH * sc;
  const x0 = (W - gW) / 2, y0 = H - M - gH;
  const glassColors: Record<string, { fill: string; stroke: string }> = {
    clar:   { fill: 'rgba(160,200,180,0.15)', stroke: 'rgba(160,200,180,0.4)' },
    bronze: { fill: 'rgba(140,100,60,0.2)',   stroke: 'rgba(140,100,60,0.5)' },
    gri:    { fill: 'rgba(160,160,160,0.18)',  stroke: 'rgba(160,160,160,0.45)' },
    satin:  { fill: 'rgba(200,200,210,0.25)', stroke: 'rgba(200,200,210,0.5)' },
  };
  const gc = glassColors[glass] || glassColors.clar;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#0f1117' }}>
      <line x1={x0 - 8} y1={y0 + gH} x2={x0 + gW + 8} y2={y0 + gH} stroke="rgba(200,169,110,0.35)" strokeWidth="2" />

      {systemType === "multitrack" && (
        <>
          <line x1={x0} y1={y0 - 5} x2={x0 + gW} y2={y0 - 5} stroke="rgba(200,169,110,0.5)" strokeWidth="3" strokeLinecap="round" />
          {Array.from({ length: Math.min(nrCanate, 8) }, (_, i) => {
            const pw = gW / nrCanate;
            return (
              <g key={i}>
                <rect x={x0 + i * pw + 1} y={y0} width={pw - 2} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.2" />
                {i < 3 && <line x1={x0 + i * pw + pw * 0.5} y1={y0 - 4} x2={x0 + i * pw + pw * 0.5} y2={y0 + gH + 2} stroke="rgba(200,169,110,0.15)" strokeWidth="1" />}
              </g>
            );
          })}
        </>
      )}

      {systemType === "frameless" && (
        <>
          <rect x={x0} y={y0} width={gW} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.5" />
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1={x0 + gW * p} y1={y0} x2={x0 + gW * p} y2={y0 + gH} stroke="rgba(200,169,110,0.12)" strokeWidth="0.8" />
          ))}
          {[[x0, y0 + gH * 0.3], [x0 + gW, y0 + gH * 0.3], [x0, y0 + gH * 0.7], [x0 + gW, y0 + gH * 0.7]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={2.5} fill="none" stroke="rgba(200,169,110,0.5)" strokeWidth="1" />
          ))}
        </>
      )}

      {systemType === "ghilotina" && (
        <>
          <rect x={x0} y={y0} width={gW} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.5" />
          <line x1={x0 + gW/2} y1={y0} x2={x0 + gW/2} y2={y0 + gH} stroke="rgba(200,169,110,0.15)" strokeWidth="1" />
          <rect x={x0 + 2} y={y0 + gH * 0.1} width={gW/2 - 4} height={gH * 0.35} fill="none" stroke="rgba(200,169,110,0.35)" strokeWidth="1" strokeDasharray="4,2" />
          <line x1={x0 + gW/4} y1={y0 + gH * 0.1} x2={x0 + gW/4} y2={y0} stroke="rgba(200,169,110,0.3)" strokeWidth="1" />
          <line x1={x0 + gW/4} y1={y0 + gH * 0.45} x2={x0 + gW/4} y2={y0 + gH} stroke="rgba(200,169,110,0.3)" strokeWidth="1" />
        </>
      )}

      <text x={x0 + gW / 2} y={H - 4} textAnchor="middle" fill="rgba(200,169,110,0.5)" fontSize="7" fontFamily="DM Sans">
        {realW.toFixed(1)}m × {realH.toFixed(1)}m · {systemType}
      </text>
    </svg>
  );
}
