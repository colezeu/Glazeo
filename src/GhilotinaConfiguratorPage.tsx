import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";
import { getUserMultiplier } from "./lib/user";

export default function GhilotinaConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
  const [glass, setGlass] = useState("clar");
  const [manerScoica, setManerScoica] = useState(false);
  const [manerRectangular, setManerRectangular] = useState(false);
  const [vopsireRAL, setVopsireRAL] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
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
        if (parsed.product_type === 'terrace-ghilotina' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.manerScoica) setManerScoica(cfg.manerScoica);
          if (cfg.manerRectangular) setManerRectangular(cfg.manerRectangular);
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
  const st = p.systemTypes?.ghilotina || {};
  const w = parseFloat(dims.width) || 0;
  const h = parseFloat(dims.height) || 0;
  const isValid = w >= (p.minLungimeMM || 1200) / 1000 && h > 0;
  const lungimeM = Math.ceil(w);
  const mpTotal = w * h;
  const threshold = st.heightThreshold || 2.5;
  const config = h <= threshold ? "1+1" : "1+2";

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    const pretSticlaMp = p.glassTypes[glass]?.pricePerSqm || 56;
    const costSticla = mpTotal * pretSticlaMp;
    const pretMl = config === "1+2" ? (st.price1plus2 || 620) : (st.price1plus1 || 480);
    let costSistem = Math.round(lungimeM * pretMl);
    costSistem += (manerScoica ? (p.accessories?.manerScoica?.price || 40) : 0)
                + (manerRectangular ? (p.accessories?.manerRectangular?.price || 80) : 0);
    costSistem += vopsireRAL ? (lungimeM <= 3 ? 120 : lungimeM <= 4 ? 150 : 300) : 0;

    const pretFinal = Math.round((costSticla + costSistem) * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
    setQuote({ area: mpTotal.toFixed(2), glassP: Math.round(costSticla * priceMultiplier), hardwareP: Math.round(costSistem * priceMultiplier), config, subtotal, vat, total });
    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Închidere Ghilotină" config={{ dims, glass }} />
      <ConfigHeader title="Configurator Terase — Ghilotină" quote={quote} />

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
            {h > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", fontSize: "0.8rem", color: "rgba(240,237,232,0.6)" }}>
                Configurație: <strong style={{ color: "#c8a96e" }}>{config}</strong> {config === "1+2" ? "(1 fix + 2 mobile — peste 2.5m)" : "(1 fix + 1 mobil)"}
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="03" label="Accesorii">
            <ToggleOption checked={manerScoica} onChange={(v) => { setManerScoica(v); if (v) setManerRectangular(false); }} label={p.accessories?.manerScoica?.name || "Mâner Scoică"} desc={p.accessories?.manerScoica?.desc} price={`${p.accessories?.manerScoica?.price || 40}€`} />
            <ToggleOption checked={manerRectangular} onChange={(v) => { setManerRectangular(v); if (v) setManerScoica(false); }} label={p.accessories?.manerRectangular?.name || "Mâner Rectangular"} desc={p.accessories?.manerRectangular?.desc} price={`${p.accessories?.manerRectangular?.price || 80}€`} />
            <ToggleOption checked={vopsireRAL} onChange={setVopsireRAL} label="Vopsire Câmp Electrostatic RAL" desc={`Cost fix: ${lungimeM > 0 ? (lungimeM <= 3 ? '120€' : lungimeM <= 4 ? '150€' : '300€') : '120-300€'} + TVA`} price={lungimeM > 0 ? `${lungimeM <= 3 ? '120' : lungimeM <= 4 ? '150' : '300'}€` : '120-300€'} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <svg width="100%" viewBox="0 0 300 200" style={{ background: '#0f1117' }}>
              <rect x={50} y={20} width={200} height={140} fill="rgba(160,200,180,0.1)" stroke="rgba(160,200,180,0.3)" strokeWidth="1.5" />
              <line x1={150} y1={20} x2={150} y2={160} stroke="rgba(200,169,110,0.12)" strokeWidth="1" />
              <rect x={52} y={30} width={96} height={55} fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="1" strokeDasharray="4,2" />
              <line x1={100} y1={30} x2={100} y2={20} stroke="rgba(200,169,110,0.25)" strokeWidth="1" />
              <line x1={100} y1={85} x2={100} y2={160} stroke="rgba(200,169,110,0.25)" strokeWidth="1" />
              <line x1={40} y1={160} x2={260} y2={160} stroke="rgba(200,169,110,0.3)" strokeWidth="2" />
              <text x={150} y={190} textAnchor="middle" fill="rgba(200,169,110,0.45)" fontSize="7" fontFamily="DM Sans">{dims.width || "—"}m × {dims.height || "—"}m · {config}</text>
            </svg>
          </PreviewBox>

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: `Suprafață (${mpTotal.toFixed(1)}m²)`, value: formatPrice(quote.glassP) },
              { label: `Sistem ${quote.config}`, value: formatPrice(quote.hardwareP) },
            ] : []} />

          <button onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>💾 Salvează proiect</button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal productType="terrace-ghilotina" config={{ dims, glass, config, manerScoica, manerRectangular, vopsireRAL }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
