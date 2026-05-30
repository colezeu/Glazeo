import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";
import { getUserMultiplier } from "./lib/user";

export default function FramelessConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
  const [glass, setGlass] = useState("clar");
  const [incuietoare, setIncuietoare] = useState(false);
  const [vopsireRAL, setVopsireRAL] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
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

  // Restore saved project from Dashboard
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'terrace-frameless' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.incuietoare) setIncuietoare(cfg.incuietoare);
          if (cfg.vopsireRAL) setVopsireRAL(cfg.vopsireRAL);
        }
      } catch (e) {}
      localStorage.removeItem('loadProject');
    }
  }, []);

  // Load B2B price tier
  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  if (loadError) return <ErrorBanner message="Nu s-a putut încărca catalogul." onRetry={() => window.location.reload()} onBack />;
  if (!product) return <PageLoader />;

  const p = product;
  const st = p.systemTypes?.frameless || {};
  const w = parseFloat(dims.width) || 0;
  const h = parseFloat(dims.height) || 0;
  const isValid = w >= (p.minLungimeMM || 1200) / 1000 && h > 0 && h <= 3;
  const lungimeM = Math.ceil(w);
  const mpTotal = w * h;

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    const pretSticlaMp = p.glassTypes[glass]?.pricePerSqm || 56;
    const costSticla = mpTotal * pretSticlaMp;
    let costSistem = Math.round(lungimeM * (st.systemPricePerMeter || 175));
    costSistem += incuietoare ? (p.accessories?.incuietoare?.price || 207) : 0;
    costSistem += vopsireRAL ? (lungimeM <= 3 ? 120 : lungimeM <= 4 ? 150 : 300) : 0;

    const pretFinal = Math.round((costSticla + costSistem) * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
    setQuote({ area: mpTotal.toFixed(2), glassP: Math.round(costSticla * priceMultiplier), hardwareP: Math.round(costSistem * priceMultiplier), subtotal, vat, total });
    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Închidere Frameless" config={{ dims, glass }} />
      <ConfigHeader title="Configurator Terase — Frameless" quote={quote} />

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
            {h > 3 && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Înălțimea maximă este 3m (actual: {h.toFixed(1)}m)
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="03" label="Accesorii">
            <ToggleOption checked={incuietoare} onChange={setIncuietoare} label={p.accessories?.incuietoare?.name || "Încuietoare"} desc={p.accessories?.incuietoare?.desc} price={`${p.accessories?.incuietoare?.price || 207}€`} />
            <ToggleOption checked={vopsireRAL} onChange={setVopsireRAL} label="Vopsire Câmp Electrostatic RAL" desc={`Cost fix: ${lungimeM > 0 ? (lungimeM <= 3 ? '120€' : lungimeM <= 4 ? '150€' : '300€') : '120-300€'} + TVA`} price={lungimeM > 0 ? `${lungimeM <= 3 ? '120' : lungimeM <= 4 ? '150' : '300'}€` : '120-300€'} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <FramelessPreview w={w} h={h} glass={glass} />
          </PreviewBox>

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: `Suprafață (${mpTotal.toFixed(1)}m²)`, value: formatPrice(quote.glassP) },
              { label: "Sistem frameless", value: formatPrice(quote.hardwareP) },
            ] : []} />

          <button onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>💾 Salvează proiect</button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal productType="terrace-frameless" config={{ dims, glass, incuietoare, vopsireRAL }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}

function FramelessPreview({ w, h, glass }: { w: number; h: number; glass: string }) {
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
      <line x1={x0 - 8} y1={y0 + gH + 6} x2={x0 + gW + 8} y2={y0 + gH + 6} stroke="rgba(200,169,110,0.35)" strokeWidth="2" />
      <rect x={x0} y={y0 + gH - 2} width={gW} height={8} rx="2" fill="rgba(200,169,110,0.25)" stroke="rgba(200,169,110,0.5)" strokeWidth="1" />
      <line x1={x0} y1={y0 - 5} x2={x0 + gW} y2={y0 - 5} stroke="rgba(200,169,110,0.5)" strokeWidth="3" strokeLinecap="round" />
      <rect x={x0 + 1} y={y0} width={gW - 2} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.5" />
      <line x1={x0 + gW * 0.33} y1={y0} x2={x0 + gW * 0.33} y2={y0 + gH} stroke="rgba(200,169,110,0.1)" strokeWidth="0.8" />
      <line x1={x0 + gW * 0.66} y1={y0} x2={x0 + gW * 0.66} y2={y0 + gH} stroke="rgba(200,169,110,0.1)" strokeWidth="0.8" />
      <text x={x0 + gW / 2} y={H - 4} textAnchor="middle" fill="rgba(200,169,110,0.5)" fontSize="7" fontFamily="DM Sans">
        {realW.toFixed(1)}m × {realH.toFixed(1)}m
      </text>
    </svg>
  );
}
