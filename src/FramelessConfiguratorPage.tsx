import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";

export default function FramelessConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
  const [glass, setGlass] = useState("clar");
  const [incuietoare, setIncuietoare] = useState(false);
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
    let costSistem = Math.round(lungimeM * (st.systemPricePerMeter || 350));
    costSistem += incuietoare ? (p.accessories?.incuietoare?.price || 207) : 0;
    costSistem += vopsireRAL ? (lungimeM <= 3 ? 120 : lungimeM <= 4 ? 150 : 300) : 0;

    const pretFinal = Math.round(costSticla + costSistem);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
    setQuote({ area: mpTotal.toFixed(2), glassP: Math.round(costSticla), hardwareP: costSistem, subtotal, vat, total });
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
            <svg width="100%" viewBox="0 0 300 170" style={{ background: '#0f1117' }}>
              <rect x={30} y={20} width={240} height={120} fill="rgba(160,200,180,0.12)" stroke="rgba(160,200,180,0.35)" strokeWidth="1.5" />
              {[0.25, 0.5, 0.75].map(p => <line key={p} x1={30 + 240 * p} y1={20} x2={30 + 240 * p} y2={140} stroke="rgba(200,169,110,0.1)" strokeWidth="0.8" />)}
              {[[30, 50], [270, 50], [30, 110], [270, 110]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={3} fill="none" stroke="rgba(200,169,110,0.4)" strokeWidth="1" />)}
              <line x1={20} y1={140} x2={280} y2={140} stroke="rgba(200,169,110,0.3)" strokeWidth="2" />
              <text x={150} y={162} textAnchor="middle" fill="rgba(200,169,110,0.45)" fontSize="7" fontFamily="DM Sans">{dims.width || "—"}m × {dims.height || "—"}m</text>
            </svg>
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
