import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import { usePersistedConfig } from "./usePersistedConfig.js";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.js";

const FALLBACK = {
  name: "Cabine Duș", basePrice: 80,
  enclosureTypes: {
    "paravan": { name: "Paravan Fix", price: 0, desc: "Panou fix, prindere perete, cu bară stabilizatoare" },
    "fix-batant": { name: "Fix + Ușă Batantă", price: 200, desc: "Panou fix + ușă batantă 90°, balamale perete" },
    "culisant-vedere": { name: "Culisant — Cărucioare la Vedere", price: 300, desc: "Fix + mobil, glisare pe șină, cărucioare vizibile" },
    "culisant-sina": { name: "Culisant — Cărucioare în Șină", price: 380, desc: "Fix + mobil, cărucioare ascunse, soft-close" }
  },
  glassTypes: { "8mm": { name: "Securit 8mm", pricePerSqm: 130 }, "10mm": { name: "Securit 10mm", pricePerSqm: 170 } },
  glassFinishes: { "clara": { name: "Clară", pricePerSqm: 0 }, "parsol-gri": { name: "Parsol Gri", pricePerSqm: 25 }, "parsol-bronze": { name: "Parsol Bronze", pricePerSqm: 25 }, "satin": { name: "Satinată", pricePerSqm: 25 } },
  treatments: { "enduroshield": { name: "ENDURO-Shield", pricePerSqm: 35 } },
  options: { towelBar: { name: "Port Prosop", price: 45 }, manerScoica: { name: "Mâner Scoică", price: 40 }, manerRectangular: { name: "Mâner Rectangular", price: 80 } },
  auto10mm: { heightThreshold: 2.2, widthThreshold: 0.9 }
};

const DEFAULT_CONFIG = { width: "", depth: "", height: "2.0", enclosure: "fix-batant", glassType: "8mm", finish: "clara", inclLateral: false, inclEnduro: false, inclTowel: false, inclManerScoica: false, inclManerRect: false };

export default function ShowerConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [config, setConfig] = usePersistedConfig("shower", DEFAULT_CONFIG);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { width, depth, height, enclosure, glassType, finish, inclLateral, inclEnduro, inclTowel, inclManerScoica, inclManerRect } = config;

  useEffect(() => {
    getUserMultiplier().then(m => setPriceMultiplier(m));
    fetch("/catalog.json").then(r => r.json())
      .then(d => { setProduct(d.products["cabine-dus"]); setVatRate(d.vatRate); })
      .catch(() => setProduct(FALLBACK));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) { try { const p = JSON.parse(saved); if (p.product_type === 'shower' && p.config?.config) setConfig(p.config.config); } catch (e) {} localStorage.removeItem('loadProject'); }
  }, []);

  if (!product) return <PageLoader />;
  const p = product;

  const auto10mm = p.auto10mm || { heightThreshold: 2.2, widthThreshold: 0.9 };
  const h = parseFloat(height) || 0, w = parseFloat(width) || 0, d = inclLateral ? (parseFloat(depth) || 0) : 0;
  const forced10mm = h > auto10mm.heightThreshold || w > auto10mm.widthThreshold;
  const effectiveGlassType = forced10mm ? "10mm" : glassType;
  const isValid = w > 0 && h > 0;
  // Glass area: fara lateral = W×H, cu lateral = (W+D)×H
  const glassArea = inclLateral ? (w + d) * h : w * h;

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    const enclosurePrice = p.enclosureTypes[enclosure]?.price || 0;
    const glassPricePerSqm = p.glassTypes[effectiveGlassType]?.pricePerSqm || 130;
    const finishPricePerSqm = p.glassFinishes?.[finish]?.pricePerSqm || 0;
    const enduroPricePerSqm = inclEnduro ? (p.treatments?.enduroshield?.pricePerSqm || 0) : 0;

    const glassCost = glassArea * (glassPricePerSqm + finishPricePerSqm + enduroPricePerSqm);
    const towelCost = inclTowel ? (p.options?.towelBar?.price || 45) : 0;
    const manerCost = (inclManerScoica ? (p.options?.manerScoica?.price || 40) : 0) + (inclManerRect ? (p.options?.manerRectangular?.price || 80) : 0);

    const subtotalRaw = p.basePrice + enclosurePrice + glassCost + towelCost + manerCost;
    const pretFinal = Math.round(subtotalRaw * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);

    setQuote({ area: glassArea.toFixed(2), enclosureP: Math.round(enclosurePrice * priceMultiplier), glassP: Math.round(glassCost * priceMultiplier), stuffP: Math.round((towelCost+manerCost) * priceMultiplier), subs: subtotal, vat, total, subtotalRaw: Math.round(subtotalRaw) });
    setCalculating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Cabina Duș" config={config} />
      <ConfigHeader title="Configurator Cabine Duș" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Tipologie">
            {Object.entries(p.enclosureTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={enclosure === k} onClick={() => setConfig(c => ({ ...c, enclosure: k }))} label={d.name} desc={d.desc} price={d.price > 0 ? `+${d.price}€` : "Inclus"} />
            ))}
          </SectionCard>

          <SectionCard num="02" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: inclLateral ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
              <NumberInput label="Lățime (m)" value={width} onChange={v => setConfig(c => ({ ...c, width: v }))} placeholder="0.9" step="0.05" min={0.5} max={2.5} />
              {inclLateral && <NumberInput label="Adâncime (m)" value={depth} onChange={v => setConfig(c => ({ ...c, depth: v }))} placeholder="0.9" step="0.05" min={0.5} max={2.5} />}
              <NumberInput label="Înălțime (m)" value={height} onChange={v => setConfig(c => ({ ...c, height: v }))} placeholder="2.0" step="0.05" min={1.8} max={2.5} />
            </div>
            {forced10mm && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(200,169,110,0.1)", borderRadius: 6, fontSize: "0.85rem", color: "#c8a96e" }}>
                ⚠️ Dimensiunile impun sticlă securizată de <strong>10mm</strong> (H &gt; {auto10mm.heightThreshold}m sau L &gt; {auto10mm.widthThreshold}m)
              </div>
            )}
          </SectionCard>

          <SectionCard num="03" label="Finisaj Sticlă">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(p.glassFinishes || {}).map(([k, d]) => (
                <OptionBtn key={k} selected={finish === k} onClick={() => setConfig(c => ({ ...c, finish: k }))} label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Inclus"} />
              ))}
            </div>
          </SectionCard>

          <SectionCard num="04" label="Opțiuni & Accesorii">
            <ToggleOption checked={inclLateral} onChange={v => setConfig(c => ({ ...c, inclLateral: v }))} label="Cu lateral sticlă" desc="Adaugă panou lateral — necesită adâncime" />
            <ToggleOption checked={inclEnduro} onChange={v => setConfig(c => ({ ...c, inclEnduro: v }))} label="ENDURO-Shield" desc="Protecție nano anti-calcar și anti-mizerie" price={`${p.treatments?.enduroshield?.pricePerSqm || 47}€/m²`} />
            <ToggleOption checked={inclTowel} onChange={v => setConfig(c => ({ ...c, inclTowel: v }))} label={p.options?.towelBar?.name || "Port Prosop"} desc={p.options?.towelBar?.desc} price={`${p.options?.towelBar?.price || 60}€`} />
            <ToggleOption checked={inclManerScoica} onChange={v => { setConfig(c => ({ ...c, inclManerScoica: v, inclManerRect: v ? false : c.inclManerRect })) }} label={p.options?.manerScoica?.name || "Mâner Scoică"} desc={p.options?.manerScoica?.desc} price={`${p.options?.manerScoica?.price || 40}€`} />
            <ToggleOption checked={inclManerRect} onChange={v => { setConfig(c => ({ ...c, inclManerRect: v, inclManerScoica: v ? false : c.inclManerScoica })) }} label={p.options?.manerRectangular?.name || "Mâner Rectangular"} desc={p.options?.manerRectangular?.desc} price={`${p.options?.manerRectangular?.price || 80}€`} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <div style={{ textAlign: "center", color: "rgba(240,237,232,0.5)", fontSize: "0.9rem", lineHeight: 1.8 }}>
              {w && h ? `${w} × ${inclLateral ? d : "—"} × ${h}m` : "Completează dimensiunile"}<br />
              <span style={{ color: "#c8a96e" }}>{p.enclosureTypes[enclosure]?.name}</span><br />
              {forced10mm ? "🔒 10mm (obligatoriu)" : `Sticlă ${effectiveGlassType}`} · {p.glassFinishes?.[finish]?.name}
            </div>
          </PreviewBox>

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață sticlă", value: `${quote.area} m²` },
              { label: "Tipologie", value: `${quote.enclosureP}€` },
              { label: "Sticlă + finisaj", value: `+${quote.glassP}€`, accent: true },
              quote.stuffP > 0 && { label: "Accesorii", value: `+${quote.stuffP}€`, accent: true },
              priceMultiplier < 1.0 && { label: `Tier (×${priceMultiplier})`, value: `-${Math.round((1-priceMultiplier)*100)}%`, accent: true },
            ] : []}
          />

          <button onClick={() => setShowSaveModal(true)} className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>
            💾 Salvează proiect
          </button>
        </div>
      </main>

      {showSaveModal && <SaveProjectModal productType="shower" config={config} onClose={() => setShowSaveModal(false)} />}
    </div>
  );
}
