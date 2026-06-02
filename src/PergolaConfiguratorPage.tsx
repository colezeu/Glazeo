import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.jsx";
import { getUserMultiplier } from "./lib/user";

export default function PergolaConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width: "", depth: "", height: "2.50" });
  const [type, setType] = useState("pergola-bioclimatica");
  const [glass, setGlass] = useState("662");
  const [inclLed, setInclLed] = useState(false);
  const [inclMob, setInclMob] = useState(false);
  const [inclPan, setInclPan] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const raw = d.products["pergola-copertina"];
        if (!raw) throw new Error("Pergola data missing");
        setProduct({
          ...raw,
          typeCategories: Object.fromEntries(
            Object.entries(raw.typeCategories).filter(([k]) => k.startsWith("pergola"))
          )
        });
        setVatRate(d.vatRate || 0.19);
      })
      .catch(() => {
        // fallback minim dacă cumva catalogul nu se încarcă
        setProduct({
          name: "Pergolă", basePrice: 300,
          typeCategories: { "pergola-bioclimatica": { name: "Pergolă Bioclimatică", pricePerSqm: 650 } },
          glassTypes: { clear: { name: "Sticlă Clară", pricePerSqm: 0 } },
          options: { led: { pricePerMeter: 55 }, mobilier: { price: 1200 }, "panouri-lat": { pricePerSqm: 0 } }
        });
      });
  }, []);

  if (!product) return <PageLoader />;

  const p = product;
  const isValid = dims.width && dims.depth && parseFloat(dims.width) > 0;
  const showGlass = type === "pergola-sticla";
  const perimeter = 2 * ((parseFloat(dims.width) || 0) + (parseFloat(dims.depth) || 0));
  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const w = parseFloat(dims.width) || 0, d = parseFloat(dims.depth) || 0, area = w * d;
    const typeP = area * (p.typeCategories[type]?.pricePerSqm || 0);
    const glP = showGlass ? area * (p.glassTypes[glass]?.pricePerSqm || 0) : 0;
    const ledP = inclLed ? perimeter * (p.options.led?.pricePerMeter || 0) : 0;
    const mobP = inclMob ? (p.options.mobilier?.price || 0) : 0;
    const panP = inclPan ? area * (p.options["panouri-lat"]?.pricePerSqm || 0) : 0;
    const { subtotal, vat, total } = calcQuote(p.basePrice + typeP + glP + ledP + mobP + panP, vatRate);
    setQuote({ area: area.toFixed(2), typeP: Math.round(typeP), glP: Math.round(glP), ledP: Math.round(ledP), mobP, panP: Math.round(panP), subtotal, vat, total });
    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Pergolă" config={{ width: dims.width, depth: dims.depth, type, glass }} />
      <ConfigHeader title="Configurator Pergole" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} placeholder="3.0 – 7.0" step="0.1" min={3.0} max={7.0} />
              <NumberInput label="Adâncime (m)" value={dims.depth} onChange={v => setDims(d => ({ ...d, depth: v }))} placeholder="3.0 – 6.0" step="0.1" min={3.0} max={6.0} />
            </div>
            <div style={{ marginTop: 12 }}>
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} placeholder="2.50" step="0.05" min={2.20} max={3.00} />
            </div>
          </SectionCard>

          <SectionCard num="02" label="Tip Pergolă">
            {Object.entries(p.typeCategories).map(([k, d]) => (
              <OptionBtn key={k} selected={type === k} onClick={() => setType(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          {showGlass && (
            <SectionCard num="03" label="Tip Sticlă Acoperiș">
              {Object.entries(p.glassTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Inclus"} />
              ))}
            </SectionCard>
          )}

          <SectionCard num={showGlass ? "04" : "03"} label="Opțiuni & Accesorii">
            <ToggleOption checked={inclLed} onChange={setInclLed} label={p.options.led?.name} desc={p.options.led?.desc} price={`${p.options.led?.pricePerMeter}€/m`} />
            <ToggleOption checked={inclMob} onChange={setInclMob} label={p.options.mobilier?.name} desc={p.options.mobilier?.desc} price={`${p.options.mobilier?.price}€`} />
            <ToggleOption checked={inclPan} onChange={setInclPan} label={p.options["panouri-lat"]?.name} desc={p.options["panouri-lat"]?.desc} price={`${p.options["panouri-lat"]?.pricePerSqm}€/m²`} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <div style={{ textAlign: "center", color: "rgba(240,237,232,0.5)", fontSize: "0.9rem" }}>
              {dims.width && dims.depth ? `${dims.width} × ${dims.depth} × ${dims.height || "2.50"} m` : "Completează dimensiunile"}
            </div>
          </PreviewBox>

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Structură", value: `${quote.typeP}€` },
              quote.glP > 0 && { label: "Sticlă", value: `+${quote.glP}€`, accent: true },
              quote.ledP > 0 && { label: "LED", value: `+${quote.ledP}€`, accent: true },
              quote.mobP > 0 && { label: "Mobilier", value: `+${quote.mobP}€`, accent: true },
              quote.panP > 0 && { label: "Panouri lat.", value: `+${quote.panP}€`, accent: true },
            ] : []}
          />
       
          <button
            onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}
          >
            💾 Salvează proiect
          </button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal
          productType="pergola"
          config={config}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
