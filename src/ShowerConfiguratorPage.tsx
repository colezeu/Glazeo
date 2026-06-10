import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import { usePersistedConfig } from "./usePersistedConfig.js";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.js";
import ShowerPreview2D from "./ShowerPreview2D";
const TYPE_THUMB = {
  "paravan": "/paravan cu bara.jpg",
  "fix-batant": "/fix-usa-batanta.png",
  "culisant-vedere": "/culisant caruciare la vedere.jpg",
  "culisant-sina": "/culisant carucioare in sina.jpg",
};


// Subtype images per typology
const SUBTYPE_IMG = {
  "paravan-bara": "/paravan cu bara.jpg",
  "paravan-walkin": "/walk in cu bara.jpg",
  "tavan-perete": "/tavan-perete.jpg",
  "tavan-walkin": "/tavan-walkin.jpg",
  "paravan-tavan": null,
  "fix-batant-standard": "/fix-usa-batanta.png",
  "fix-batant-simpla": "/usa-simpla.jpg",
  "fix-batant-1l": "/fix-usa-batanta-1l.png",
  "culisant-vedere-0l": "/culisant caruciare la vedere.jpg",
  "culisant-vedere-1l": "/culisant cu o latura caruciare la vedere.jpg",
  "culisant-vedere-2l": "/culisant 2 laturi caruciare la vedere.jpg",
  "culisant-vedere-colt": "/culisant pe colt caruciare la vedere.jpg",
  "culisant-sina-0l": "/culisant carucioare in sina.jpg",
  "culisant-sina-1l": "/culisant cu o latura carucioare in sina.jpg",
  "culisant-sina-2l": "/culisant cu 2 laturi carucioare in sina.jpg.jpg",
  "culisant-sina-colt": "/culisant pe colt carucioare in sina.jpg",
};

const SUBTYPES = {
  "paravan": [
    { key: "bara-perete", name: "Paravan la perete", subtitle: "1 bucată sticlă", lateral: 0, img: SUBTYPE_IMG["paravan-bara"] },
    { key: "bara-walkin", name: "Paravan walk-in", subtitle: "1 bucată sticlă", lateral: 0, img: SUBTYPE_IMG["paravan-walkin"] },
    { key: "tavan-perete", name: "Până în tavan la perete", subtitle: "1 bucată sticlă", lateral: 0, img: SUBTYPE_IMG["tavan-perete"] },
    { key: "tavan-walkin", name: "Până în tavan walk-in", subtitle: "1 bucată sticlă", lateral: 0, img: SUBTYPE_IMG["tavan-walkin"] },
  ],
  "fix-batant": [
    { key: "standard", name: "Fix + Batant", subtitle: "2 bucăți sticlă", lateral: 0, img: SUBTYPE_IMG["fix-batant-standard"] },
    { key: "simpla", name: "Ușă simplă", subtitle: "1 bucată sticlă", lateral: 0, img: SUBTYPE_IMG["fix-batant-simpla"] },
    { key: "1l", name: "Fix + Batant + 1 latură", subtitle: "3 bucăți sticlă", lateral: 1, img: SUBTYPE_IMG["fix-batant-1l"] },
  ],
  "culisant-vedere": [
    { key: "0l", name: "Fix + Mobil", subtitle: "2 bucăți sticlă", lateral: 0, img: SUBTYPE_IMG["culisant-vedere-0l"] },
    { key: "1l", name: "Fix + Mobil + 1 latură", subtitle: "3 bucăți sticlă", lateral: 1, img: SUBTYPE_IMG["culisant-vedere-1l"] },
    { key: "2l", name: "Fix + Mobil + 2 laturi", subtitle: "4 bucăți sticlă", lateral: 2, img: SUBTYPE_IMG["culisant-vedere-2l"] },
    { key: "colt", name: "Fix + Mobil pe colț", subtitle: "4 bucăți sticlă", lateral: 1, img: SUBTYPE_IMG["culisant-vedere-colt"] },
  ],
  "culisant-sina": [
    { key: "0l", name: "Fix + Mobil", subtitle: "2 bucăți sticlă", lateral: 0, img: SUBTYPE_IMG["culisant-sina-0l"] },
    { key: "1l", name: "Fix + Mobil + 1 latură", subtitle: "3 bucăți sticlă", lateral: 1, img: SUBTYPE_IMG["culisant-sina-1l"] },
    { key: "2l", name: "Fix + Mobil + 2 laturi", subtitle: "4 bucăți sticlă", lateral: 2, img: SUBTYPE_IMG["culisant-sina-2l"] },
    { key: "colt", name: "Fix + Mobil pe colț", subtitle: "4 bucăți sticlă", lateral: 1, img: SUBTYPE_IMG["culisant-sina-colt"] },
  ],
};

const FALLBACK = {
  name: "Cabine Duș", basePrice: 80,
  enclosureTypes: {
    "paravan": { name: "Paravan Fix", price: 0, desc: "Panou fix, prindere perete" },
    "fix-batant": { name: "Fix + Ușă Batantă", price: 200, desc: "Panou fix + ușă batantă 90°" },
    "culisant-vedere": { name: "Culisant — Cărucioare la Vedere", price: 300, desc: "Fix + mobil, glisare pe șină" },
    "culisant-sina": { name: "Culisant — Cărucioare în Șină", price: 380, desc: "Fix + mobil, cărucioare ascunse" }
  },
  glassTypes: { "8mm": { name: "Securit 8mm", pricePerSqm: 130 }, "10mm": { name: "Securit 10mm", pricePerSqm: 170 } },
  glassFinishes: { "clara": { name: "Clară", pricePerSqm: 0 }, "parsol-gri": { name: "Parsol Gri", pricePerSqm: 25 }, "parsol-bronze": { name: "Parsol Bronze", pricePerSqm: 25 }, "satin": { name: "Satinată", pricePerSqm: 25 } },
  treatments: { "enduroshield": { name: "ENDURO-Shield", pricePerSqm: 35 } },
  hardwareFinishes: { "inox-lucios": { name: "Cromat", priceFactor: 1.0 }, "inox-satinat": { name: "Satinat", priceFactor: 0.95 }, "negru-mat": { name: "Negru", priceFactor: 1.10 }, "auriu-lucios": { name: "Auriu Lucios", priceFactor: 1.15 }, "auriu-satinat": { name: "Auriu Satinat", priceFactor: 1.15 } },
  options: { towelBar: { name: "Port Prosop", price: 45 } },
  auto10mm: { heightThreshold: 2.2, widthThreshold: 0.9 }
};

const DEFAULT_CONFIG = { width: "", depth: "", height: "2.0", enclosure: "fix-batant", subtype: "standard", glassType: "8mm", finish: "clara", hardwareFinish: "inox-lucios", inclEnduro: false, inclTowel: false };

export default function ShowerConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [config, setConfig] = usePersistedConfig("shower", DEFAULT_CONFIG);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { width, depth, height, enclosure, subtype, glassType, finish, hardwareFinish, inclEnduro, inclTowel } = config;
  const subtypes = SUBTYPES[enclosure] || [];
  const activeSubtype = subtypes.find(s => s.key === subtype) || subtypes[0] || { key: "standard", lateral: 0 };
  const hasLateral = activeSubtype.lateral > 0;

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
  const h = parseFloat(height) || 0, w = parseFloat(width) || 0, d = hasLateral ? (parseFloat(depth) || 0) : 0;
  const forced10mm = h > auto10mm.heightThreshold || w > auto10mm.widthThreshold;
  const effectiveGlassType = forced10mm ? "10mm" : glassType;
  const isValid = w > 0 && h > 0 && (!hasLateral || d > 0);
  const sides = activeSubtype.lateral;
  const glassArea = sides === 0 ? w * h : sides === 1 ? (w + d) * h : (w + d * 2) * h;

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
    
    // Hardware pricing from Qualmont kits
    let hardwareCost = 0;
    const kit = p.hardwareKits?.[enclosure]?.[subtype];
    const hwPrices = p.hardwarePrices || {};
    const hwFinishMap = p.hardwareFinishes?.[hardwareFinish]?.qualmontFinishes || [];
    if (kit) {
      for (const [code, qty] of kit) {
        const prices = hwPrices[code];
        if (!prices) continue;
        if (prices._fixed !== undefined) {
          hardwareCost += prices._fixed * qty;
        } else {
          // Find best matching finish price
          let bestPrice = 0;
          for (const qf of hwFinishMap) {
            if (prices[qf] !== undefined) { bestPrice = prices[qf]; break; }
          }
          if (bestPrice === 0) {
            // Fallback to first available
            const vals = Object.values(prices);
            if (vals.length > 0) bestPrice = vals[0];
          }
          hardwareCost += bestPrice * qty;
        }
      }
    }
    
    const subtotalRaw = p.basePrice + enclosurePrice + hardwareCost + glassCost + towelCost;
    const pretFinal = Math.round(subtotalRaw * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);
    setQuote({ area: glassArea.toFixed(2), enclosureP: Math.round(enclosurePrice * priceMultiplier), hwP: Math.round(hardwareCost * priceMultiplier), glassP: Math.round(glassCost * priceMultiplier), subs: subtotal, vat, total });
    setCalculating(false);
  };

  // Compute available hardware finishes for current config
  const getAvailableFinishes = () => {
    if (!p?.hardwareKits || !p?.hardwareFinishes || !p?.hardwarePrices) return Object.keys(p?.hardwareFinishes || {});
    const kit = p.hardwareKits[enclosure]?.[subtype];
    if (!kit) return Object.keys(p.hardwareFinishes);
    
    const available = [];
    for (const [finKey, finData] of Object.entries(p.hardwareFinishes)) {
      const qFinishes = finData.qualmontFinishes || [];
      let allAvailable = true;
      for (const [code, qty] of kit) {
        const prices = p.hardwarePrices[code];
        if (!prices || prices._fixed !== undefined) continue; // skip fixed-price items
        const partFinishes = Object.keys(prices);
        const hasMatch = qFinishes.some(qf => partFinishes.includes(qf));
        if (!hasMatch) { allAvailable = false; break; }
      }
      if (allAvailable) available.push(finKey);
    }
    return available.length > 0 ? available : Object.keys(p.hardwareFinishes);
  };
  
  const availableFinishes = getAvailableFinishes();

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Cabina Duș" config={config} />
      <ConfigHeader title="Configurator Cabine Duș" quote={quote} />
      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Tipologie">
            {Object.entries(p.enclosureTypes).map(([k, d]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setConfig(c => ({ ...c, enclosure: k, subtype: SUBTYPES[k]?.[0]?.key || "standard" }))}>
                <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: enclosure === k ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {TYPE_THUMB[k] ? (
                    <img src={TYPE_THUMB[k]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "invert(0.92)" }} />
                  ) : (
                    <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>🚿</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <OptionBtn key={k} selected={enclosure === k} onClick={() => {}} label={d.name} desc={d.desc} price={d.price > 0 ? `+${d.price}€` : "Inclus"} />
                </div>
              </div>
            ))}
          </SectionCard>

          {subtypes.length > 1 && (
            <SectionCard num="02" label="Configurație">
              {enclosure === "paravan" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {["Cu bară stabilizatoare", "Până în tavan"].map((label, gi) => (
                    <div key={gi}>
                      <div style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {subtypes.slice(gi*2, gi*2+2).map(st => (
                          <div key={st.key} onClick={() => setConfig(c => ({ ...c, subtype: st.key }))}
                            style={{ cursor: "pointer", padding: 10, borderRadius: 10, border: subtype === st.key ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)", background: subtype === st.key ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.02)" }}>
                            {st.img && <div style={{ height: 100, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}><img src={st.img} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "invert(0.92)" }} /></div>}
                            <div style={{ fontWeight: 600, fontSize: "0.9rem", textAlign: "center" }}>{st.name}</div>
                            {st.subtitle && <div style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.4)", textAlign: "center", marginTop: 2 }}>{st.subtitle}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {subtypes.map(st => (
                    <div key={st.key} onClick={() => setConfig(c => ({ ...c, subtype: st.key }))}
                      style={{ cursor: "pointer", padding: 10, borderRadius: 10, border: subtype === st.key ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.08)", background: subtype === st.key ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.02)" }}>
                      {st.img && <div style={{ height: 100, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}><img src={st.img} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "invert(0.92)" }} /></div>}
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{st.name}</div>
                      {st.subtitle && <div style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.4)", marginTop: 2 }}>{st.subtitle}</div>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard num={subtypes.length > 1 ? "03" : "02"} label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: hasLateral ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
              <NumberInput label="Lățime (m)" value={width} onChange={v => setConfig(c => ({ ...c, width: v }))} placeholder="0.9" step="0.05" min={0.5} max={2.5} />
              {hasLateral && <NumberInput label="Adâncime (m)" value={depth} onChange={v => setConfig(c => ({ ...c, depth: v }))} placeholder="0.9" step="0.05" min={0.5} max={2.5} />}
              <NumberInput label="Înălțime (m)" value={height} onChange={v => setConfig(c => ({ ...c, height: v }))} placeholder="2.0" step="0.05" min={1.8} max={2.5} />
            </div>
            {forced10mm && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(200,169,110,0.1)", borderRadius: 6, fontSize: "0.85rem", color: "#c8a96e" }}>
                ⚠️ Dimensiunile impun sticlă securizată de <strong>10mm</strong> (H &gt; {auto10mm.heightThreshold}m sau L &gt; {auto10mm.widthThreshold}m)
              </div>
            )}
          </SectionCard>

          <SectionCard num={subtypes.length > 1 ? "04" : "03"} label="Finisaj Sticlă">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(p.glassFinishes || {}).map(([k, d]) => (
                <OptionBtn key={k} selected={finish === k} onClick={() => setConfig(c => ({ ...c, finish: k }))} label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Inclus"} />
              ))}
            </div>
          </SectionCard>

          <SectionCard num={subtypes.length > 1 ? "05" : "04"} label="Finisaj Feronerie">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(p.hardwareFinishes || {}).map(([k, d]) => {
                const isAvailable = availableFinishes.includes(k);
                return (
                  <OptionBtn key={k} selected={hardwareFinish === k} 
                    onClick={() => isAvailable && setConfig(c => ({ ...c, hardwareFinish: k }))} 
                    label={d.name} 
                    desc={isAvailable ? d.desc : "⚠️ Indisponibil pentru această configurație"} 
                    price={isAvailable ? (d.priceFactor !== 1.0 ? `${d.priceFactor > 1 ? '+' : ''}${Math.round(Math.abs(d.priceFactor - 1) * 100)}%` : "Standard") : "—"} 
                  />
                );
              })}
            </div>
          </SectionCard>

          <SectionCard num={subtypes.length > 1 ? "06" : "05"} label="Opțiuni & Accesorii">
            <ToggleOption checked={inclEnduro} onChange={v => setConfig(c => ({ ...c, inclEnduro: v }))} label="ENDURO-Shield" desc="Protecție nano anti-calcar și anti-mizerie" price={`${p.treatments?.enduroshield?.pricePerSqm || 47}€/m²`} />
            <ToggleOption checked={inclTowel} onChange={v => setConfig(c => ({ ...c, inclTowel: v }))} label={p.options?.towelBar?.name || "Port Prosop"} desc={p.options?.towelBar?.desc} price={`${p.options?.towelBar?.price || 60}€`} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ShowerPreview2D
            width={width}
            depth={depth}
            height={height}
            enclosure={enclosure}
            subtype={subtype}
            glassType={effectiveGlassType}
            finish={finish}
            treatment={inclEnduro ? "enduroshield" : undefined}
            hardwareFinish={hardwareFinish}
            hasLateral={hasLateral}
            lateralCount={activeSubtype.lateral}
          />

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață sticlă", value: `${quote.area} m²` },
              { label: "Feronerie", value: `${quote.hwP}€` },
              { label: "Tipologie + sticlă", value: `${quote.glassP + quote.enclosureP}€` },
              priceMultiplier < 1.0 && { label: `Tier (×${priceMultiplier})`, value: `-${Math.round((1-priceMultiplier)*100)}%`, accent: true },
            ] : []}
          />
          <button onClick={() => setShowSaveModal(true)} className="btn-primary w-full mt-3"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, border: "none", color: "#0f1117", fontWeight: 600, cursor: "pointer" }}>
            💾 Salvează proiect
          </button>
        </div>
      </main>
      {showSaveModal && <SaveProjectModal productType="shower" config={config} onClose={() => setShowSaveModal(false)} />}
    </div>
  );
}
