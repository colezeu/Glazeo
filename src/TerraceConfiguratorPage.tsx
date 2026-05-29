import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";

export default function TerraceConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
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
  const w = parseFloat(dims.width) || 0;
  const h = parseFloat(dims.height) || 0;
  const isValid = w >= (p.minLungimeMM || 1200) / 1000 && h > 0;
  const lungimeM = Math.ceil(w);
  const inaltimeM = Math.ceil(h);
  const mpTotal = w * h;

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    // Glass cost
    const pretSticlaMp = p.glassTypes[glass]?.pricePerSqm || 56;
    const costSticla = mpTotal * pretSticlaMp;

    // Base system — per linear meter of length
    const costSistemBaza = lungimeM * (p.systemPrices?.sistemBaza?.pricePerMeter || 109);

    // Extra rails — only if NOT middle opening and panels > 3
    const esteMijloc = deschidereMijloc;
    const nrSineExtra = (!esteMijloc && nrCanate > 3) ? nrCanate - 3 : 0;
    const pretSinaExtra = p.systemPrices?.sinaExtra?.pricePerMeter || 29;
    const costSineExtra = nrSineExtra * lungimeM * pretSinaExtra;

    // Side profiles
    const pretProfilLat = p.systemPrices?.profilLateral?.pricePerMeter || 29;
    const costProfileLaterale = profileLaterale ? inaltimeM * pretProfilLat : 0;

    // Security lock
    const costIncuietoare = incuietoare ? (p.accessories?.incuietoare?.price || 155) : 0;

    // Handles
    const costManere = (manerScoica ? (p.accessories?.manerScoica?.price || 30) : 0)
                     + (manerRectangular ? (p.accessories?.manerRectangular?.price || 60) : 0);

    // RAL painting — per system flat cost
    const costRAL = vopsireRAL ? (lungimeM <= 3 ? 120 : 150) : 0;

    // Total hardware
    const costFeronerie = costSistemBaza + costSineExtra + costProfileLaterale + costIncuietoare + costManere + costRAL;
    const factorSine = sineNeintrerupte ? (p.systemPrices?.sineMajorare?.factor || 1.35) : 1.0;
    const costFeronerieAjustat = Math.round(costFeronerie * factorSine);

    const pretFinal = Math.round(costSticla + costFeronerieAjustat);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);

    setQuote({
      area: mpTotal.toFixed(2),
      glassP: Math.round(costSticla),
      hardwareP: costFeronerieAjustat,
      canate: nrCanate,
      sineExtra: nrSineExtra,
      subtotal, vat, total
    });
    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Închidere Mobilă Terasă" config={{ dims, glass, nrCanate }} />
      <ConfigHeader title="Configurator Terase & Balcoane" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lungime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} placeholder="Ex: 4.0" step="0.1" min={1.2} />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} placeholder="Ex: 2.4" step="0.1" />
            </div>
            {w > 0 && w < (p.minLungimeMM || 1200) / 1000 && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Lungimea minimă este {(p.minLungimeMM || 1200) / 1000}m
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="03" label="Număr Canate & Deschidere">
            <SelectInput label="Număr canate culisante" value={nrCanate} onChange={v => setNrCanate(Number(v))}
              options={[2,3,4,5,6,7,8].map(n => ({ value: n, label: `${n} canate` }))} />
            <ToggleOption checked={deschidereMijloc} onChange={setDeschidereMijloc} label="Deschidere la mijloc" desc="Canatele se întâlnesc la mijloc — fără șine suplimentare" />
            <ToggleOption checked={sineNeintrerupte} onChange={setSineNeintrerupte} label="Șine neîntrerupte" desc="Feronerie majorată cu 35% pentru șine continue" />
          </SectionCard>

          <SectionCard num="04" label="Accesorii">
            <ToggleOption checked={profileLaterale} onChange={setProfileLaterale} label={p.systemPrices?.profilLateral?.name || "Profile laterale"} desc={p.systemPrices?.profilLateral?.desc} price={`${p.systemPrices?.profilLateral?.pricePerMeter || 29}€/m`} />
            <ToggleOption checked={incuietoare} onChange={setIncuietoare} label={p.accessories?.incuietoare?.name || "Încuietoare"} desc={p.accessories?.incuietoare?.desc} price={`${p.accessories?.incuietoare?.price || 155}€`} />
            <ToggleOption checked={manerScoica} onChange={setManerScoica} label={p.accessories?.manerScoica?.name || "Mâner Scoică"} desc={p.accessories?.manerScoica?.desc} price={`${p.accessories?.manerScoica?.price || 30}€`} />
            <ToggleOption checked={manerRectangular} onChange={setManerRectangular} label={p.accessories?.manerRectangular?.name || "Mâner Rectangular"} desc={p.accessories?.manerRectangular?.desc} price={`${p.accessories?.manerRectangular?.price || 60}€`} />
            <ToggleOption checked={vopsireRAL} onChange={setVopsireRAL} label="Vopsire Câmp Electrostatic RAL" desc={`Cost fix per sistem: ${lungimeM > 0 ? (lungimeM <= 3 ? '120€' : '150€') : '120-150€'} + TVA`} price={lungimeM > 0 ? `${lungimeM <= 3 ? '120' : '150'}€` : '120-150€'} />
            {/* Handle preview images */}
            <div className="option-preview-grid" style={{ marginTop: 8 }}>
              <div className={`option-preview-item ${manerScoica ? "selected" : ""}`} onClick={() => setManerScoica(!manerScoica)} title="Mâner Scoică">
                <img src="/maner-scoica.png" alt="Mâner Scoică" style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
                <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>Scoică</div>
              </div>
              <div className={`option-preview-item ${manerRectangular ? "selected" : ""}`} onClick={() => setManerRectangular(!manerRectangular)} title="Mâner Rectangular">
                <img src="/maner-rectangular.png" alt="Mâner Rectangular" style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
                <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>Rectangular</div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <TerracePreview w={w} h={h} nrCanate={nrCanate} glass={glass} />
          </PreviewBox>

          <QuoteSidebar
            quote={quote}
            isFormValid={isValid}
            calculating={calculating}
            onCalculate={calculate}
            onReset={() => setQuote(null)}
            onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: `Suprafață (${mpTotal.toFixed(1)}m²)`, value: formatPrice(quote.glassP) },
              { label: `Feronerie (${quote.canate} canate)`, value: formatPrice(quote.hardwareP) },
              quote.sineExtra > 0 && { label: `Șine extra (${quote.sineExtra})`, value: "inclus", accent: true },
              sineNeintrerupte && { label: "Șine neîntrerupte", value: "+35%", accent: true },
            ] : []}
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
          config={{ dims, glass, nrCanate, deschidereMijloc, sineNeintrerupte, manerScoica, manerRectangular, incuietoare, profileLaterale, vopsireRAL }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}

/** SVG preview scaled after real dimensions */
function TerracePreview({ w, h, nrCanate, glass }: { w: number; h: number; nrCanate: number; glass: string }) {
  const W = 300, H = 170, M = 16;
  const realW = w || 4, realH = h || 2.4;
  const sc = Math.min((W - M * 2) / realW, (H - M * 2) / realH);
  const gW = realW * sc, gH = realH * sc;
  const x0 = (W - gW) / 2, y0 = H - M - gH;
  const pw = gW / nrCanate;
  const glassColors: Record<string, { fill: string; stroke: string }> = {
    clar:   { fill: 'rgba(160,200,180,0.15)', stroke: 'rgba(160,200,180,0.4)' },
    bronze: { fill: 'rgba(140,100,60,0.2)',   stroke: 'rgba(140,100,60,0.5)' },
    gri:    { fill: 'rgba(160,160,160,0.18)',  stroke: 'rgba(160,160,160,0.45)' },
    satin:  { fill: 'rgba(200,200,210,0.25)', stroke: 'rgba(200,200,210,0.5)' },
  };
  const gc = glassColors[glass] || glassColors.clar;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#0f1117' }}>
      {/* Ground line */}
      <line x1={x0 - 8} y1={y0 + gH} x2={x0 + gW + 8} y2={y0 + gH} stroke="rgba(200,169,110,0.35)" strokeWidth="2" />
      {/* Top rail */}
      <line x1={x0} y1={y0 - 5} x2={x0 + gW} y2={y0 - 5} stroke="rgba(200,169,110,0.5)" strokeWidth="3" strokeLinecap="round" />
      {/* Panels */}
      {Array.from({ length: nrCanate }, (_, i) => (
        <g key={i}>
          <rect x={x0 + i * pw + 1} y={y0} width={pw - 2} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.2" />
          {/* Rail guides */}
          {i < 3 && <line x1={x0 + i * pw + pw * 0.5} y1={y0 - 4} x2={x0 + i * pw + pw * 0.5} y2={y0 + gH + 2} stroke="rgba(200,169,110,0.15)" strokeWidth="1" />}
        </g>
      ))}
      {/* Labels */}
      <text x={x0 + gW / 2} y={H - 4} textAnchor="middle" fill="rgba(200,169,110,0.5)" fontSize="7" fontFamily="DM Sans">
        {realW.toFixed(1)}m × {realH.toFixed(1)}m · {nrCanate} canate
      </text>
    </svg>
  );
}
