// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.tsx";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.js";

const FALLBACK = {
  name: "Uși Culisante",
  basePrice: 200,
  typologies: {
    "cu-sina": {
      name: "Cu șină",
      mountTypes: {
        perete: { name: "Prindere pe Perete", pricePerUnit: 0, desc: "Șină montată pe perete" },
        tavan:  { name: "Prindere pe Tavan",  pricePerUnit: 107, desc: "Șină ascunsă în tavan" }
      },
      panelTypes: {
        "panou-fix": { name: "Cu Panou Fix",  pricePerUnit: 0,   desc: "Panou lateral fix + ușă culisantă" },
        "fara-fix":  { name: "Fără Panou Fix", pricePerUnit: 0,   desc: "Doar ușă culisantă" },
        "buzunar":   { name: "Cu Buzunar",      pricePerUnit: 373, desc: "Ușa dispare în perete" }
      },
      glassTypes: {
        "10mm-clara":       { name: "Securit 10mm Clară",       pricePerSqm: 69.33,  desc: "Sticlă securizată transparentă" },
        "10mm-parsol-gri":  { name: "Securit 10mm Parsol Gri",   pricePerSqm: 109.33, desc: "Cu folie Parsol gri" },
        "10mm-parsol-bronze": { name: "Securit 10mm Parsol Bronze", pricePerSqm: 109.33, desc: "Cu folie Parsol bronze" },
        "10mm-satin":       { name: "Securit 10mm Satinată",     pricePerSqm: 99.33,  desc: "Satinată (privacy)" }
      },
      options: {
        manere:      { name: "Mânere Inox",    price: 127, desc: "Mâner îngropat sau aplicat" },
        incuietoare: { name: "Încuietoare",     price: 200, desc: "Cilindru sau magnetic" },
        caroiaj:     { name: "Profile Caroiaj", pricePerSqm: 47, desc: "Grilaj decorativ" }
      }
    },
    "industrial": {
      name: "Industrial",
      mountTypes: {
        perete: { name: "Prindere pe Perete", pricePerUnit: 0, desc: "Șină montată pe perete" },
        tavan:  { name: "Prindere pe Tavan",  pricePerUnit: 107, desc: "Șină ascunsă în tavan" }
      },
      panelTypes: null,
      glassTypes: {
        "10mm-clara":       { name: "Securit 10mm Clară",       pricePerSqm: 69.33,  desc: "Sticlă securizată transparentă" },
        "10mm-parsol-gri":  { name: "Securit 10mm Parsol Gri",   pricePerSqm: 109.33, desc: "Cu folie Parsol gri" },
        "10mm-parsol-bronze": { name: "Securit 10mm Parsol Bronze", pricePerSqm: 109.33, desc: "Cu folie Parsol bronze" },
        "10mm-satin":       { name: "Securit 10mm Satinată",     pricePerSqm: 99.33,  desc: "Satinată (privacy)" }
      },
      options: {
        manere:      { name: "Mânere Inox",    price: 127, desc: "Mâner îngropat sau aplicat" },
        incuietoare: { name: "Încuietoare",     price: 200, desc: "Cilindru sau magnetic" },
        caroiaj:     { name: "Profile Caroiaj", pricePerSqm: 47, desc: "Grilaj decorativ" }
      }
    },
    "magica": {
      name: "Usă Magică (fără șină)",
      mountTypes: {
        perete: { name: "Prindere pe Perete", pricePerUnit: 0, desc: "Fără șină, prindere directă pe perete" }
      },
      panelTypes: null,
      glassTypes: {
        "10mm-clara":       { name: "Securit 10mm Clară",       pricePerSqm: 69.33,  desc: "Sticlă securizată transparentă" },
        "10mm-parsol-gri":  { name: "Securit 10mm Parsol Gri",   pricePerSqm: 109.33, desc: "Cu folie Parsol gri" },
        "10mm-parsol-bronze": { name: "Securit 10mm Parsol Bronze", pricePerSqm: 109.33, desc: "Cu folie Parsol bronze" },
        "10mm-satin":       { name: "Securit 10mm Satinată",     pricePerSqm: 99.33,  desc: "Satinată (privacy)" }
      },
      options: {
        manere:      { name: "Mânere Inox",    price: 127, desc: "Mâner îngropat sau aplicat" },
        incuietoare: { name: "Încuietoare",     price: 200, desc: "Cilindru sau magnetic" },
        caroiaj:     { name: "Profile Caroiaj", pricePerSqm: 47, desc: "Grilaj decorativ" }
      }
    }
  }
};

/* ─── Preview SVG ─── */
function SlidingDoorPreview({ dims, typology, mount, panel, glass }) {
  const w = parseFloat(dims.width) || 1.2, h = parseFloat(dims.height) || 2.1;
  const isMagica = typology === "magica";
  const isIndustrial = typology === "industrial";
  const hasPanel = panel && panel !== "fara-fix";
  const totalW = hasPanel ? w * 2 : panel === "buzunar" ? w * 1.1 : w;
  const W = 308, H = 200, M = 16;
  const sc = Math.min((W - M * 2) / totalW, (H - M * 2) / h);
  const dW = w * sc, dH = h * sc, fW = hasPanel ? w * sc : 0;
  const x0 = panel === "buzunar" ? W / 2 - dW / 2 : (W - (dW + fW + 8)) / 2;
  const y0 = (H - dH) / 2;
  const isSatin = glass === "10mm-satin";
  const isParsol = glass === "10mm-parsol-gri" || glass === "10mm-parsol-bronze";
  const glF = isSatin ? "rgba(200,200,220,0.28)" : isParsol ? "rgba(160,140,100,0.2)" : "rgba(180,220,255,0.1)";
  const glS = isSatin ? "rgba(200,200,220,0.5)" : isParsol ? "rgba(160,140,100,0.5)" : "rgba(180,220,255,0.45)";

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* track / rail */}
      {!isMagica && mount !== "tavan" && (
        <rect x={x0 - 4} y={y0 - 5} width={dW + fW + 16} height={5} fill="rgba(200,169,110,0.4)" rx="2" />
      )}
      {!isMagica && mount === "tavan" && (
        <rect x={x0 - 4} y={y0 - 8} width={dW + fW + 16} height={4} fill="rgba(200,169,110,0.2)" rx="2" strokeDasharray="3,2" stroke="rgba(200,169,110,0.5)" strokeWidth="1" />
      )}
      {/* floor line */}
      {!isMagica && (
        <line x1={x0 - 10} y1={y0 + dH} x2={x0 + dW + fW + 18} y2={y0 + dH} stroke="rgba(200,169,110,0.35)" strokeWidth="2" />
      )}
      {/* fixed panel */}
      {hasPanel && panel === "panou-fix" && (
        <rect x={x0} y={y0} width={fW} height={dH} fill={glF} stroke="rgba(200,169,110,0.3)" strokeWidth="1.5" />
      )}
      {/* sliding door */}
      {panel === "buzunar" ? (
        <>
          <rect x={x0} y={y0} width={dW * 0.3} height={dH} fill="rgba(200,169,110,0.05)" stroke="rgba(200,169,110,0.25)" strokeWidth="1.5" strokeDasharray="4,3" />
          <rect x={x0 + dW * 0.3} y={y0} width={dW * 0.7} height={dH} fill={glF} stroke={glS} strokeWidth="1.5" />
          <text x={x0 + dW * 0.15} y={y0 + dH / 2} textAnchor="middle" fill="rgba(200,169,110,0.35)" fontSize="7" fontFamily="DM Sans" transform={`rotate(-90,${x0 + dW * 0.15},${y0 + dH / 2})`}>în perete</text>
        </>
      ) : (
        <rect x={x0 + (hasPanel && panel === "panou-fix" ? fW + 8 : 0)} y={y0} width={dW} height={dH} fill={glF} stroke={glS} strokeWidth="1.5" />
      )}
      {/* handle */}
      <rect x={x0 + (hasPanel && panel === "panou-fix" ? fW + 14 : 6)} y={y0 + dH / 2 - 20} width={4} height={40} rx="2" fill="rgba(200,169,110,0.7)" />
      {/* label */}
      <text x={W / 2} y={H - 6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">
        {dims.width}m × {dims.height}m · {isMagica ? "Magică" : isIndustrial ? "Industrial" : "Cu șină"}
      </text>
    </svg>
  );
}

/* ─── Main Page ─── */
export default function SlidingDoorConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);

  // Step 1: Typology
  const [typology, setTypology] = useState("cu-sina");
  // Step 2: Mount
  const [mount, setMount] = useState("perete");
  // Step 3: Panel (only for cu-sina)
  const [panel, setPanel] = useState("fara-fix");
  // Step 4: Glass
  const [glass, setGlass] = useState("10mm-clara");
  // Step 5: Options
  const [inclManere, setInclManere] = useState(false);
  const [inclInc, setInclInc] = useState(false);
  const [inclCar, setInclCar] = useState(false);
  // Dims
  const [dims, setDims] = useState({ width: "1.2", height: "2.1" });
  // Quote
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.json())
      .then(d => { setProduct(d.products["usi-culisante"]); setVatRate(d.vatRate); })
      .catch(() => setProduct(FALLBACK));
  }, []);

  // Reset mount when typology changes (magica only has perete)
  useEffect(() => {
    if (product) {
      const ty = product.typologies[typology];
      if (ty) {
        const firstMount = Object.keys(ty.mountTypes)[0];
        setMount(firstMount);
        if (ty.panelTypes) {
          setPanel(Object.keys(ty.panelTypes)[0]);
        }
      }
    }
  }, [typology, product]);

  const p = product;
  const ty = p?.typologies?.[typology];
  const isValid = dims.width && dims.height;

  const calculate = async () => {
    if (!p || !ty) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const w = parseFloat(dims.width) || 0, h = parseFloat(dims.height) || 0;
    const area = w * h * (panel === "panou-fix" ? 2 : 1);
    const mountP = ty.mountTypes[mount].pricePerUnit;
    const panelP = ty.panelTypes ? (ty.panelTypes[panel]?.pricePerUnit || 0) : 0;
    const glP = area * ty.glassTypes[glass].pricePerSqm;
    const manP = inclManere ? ty.options.manere.price : 0;
    const incP = inclInc ? ty.options.incuietoare.price : 0;
    const carP = inclCar ? area * ty.options.caroiaj.pricePerSqm : 0;
    const { subtotal, vat, total } = calcQuote(p.basePrice + mountP + panelP + glP + manP + incP + carP, vatRate);
    setQuote({ area: area.toFixed(2), mountP, panelP, glP: Math.round(glP), manP, incP, carP: Math.round(carP), subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const glassLabel = (key) => {
    const g = ty.glassTypes[key];
    return g ? g.name.replace("Securit 10mm ", "") : key;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Ușă Culisantă" config={{ dims, typology, mount, panel, glass, inclManere, inclInc, inclCar }} />
      <ConfigHeader title="Configurator Uși Culisante" quote={quote} />
      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Step 1: Typology */}
          <SectionCard num="01" label="Tipologie">
            {Object.entries(p.typologies).map(([k, t]) => (
              <OptionBtn key={k} selected={typology === k} onClick={() => setTypology(k)} label={t.name} center />
            ))}
          </SectionCard>

          {/* Step 2: Mount */}
          <SectionCard num="02" label="Sistem Prindere">
            {Object.entries(ty.mountTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={mount === k} onClick={() => setMount(k)} label={d.name} desc={d.desc} price={d.pricePerUnit > 0 ? `+${d.pricePerUnit}€` : "Standard"} />
            ))}
          </SectionCard>

          {/* Step 3: Panel (only for cu-sina) */}
          {ty.panelTypes && (
            <SectionCard num="03" label="Configurație Panouri">
              {Object.entries(ty.panelTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={panel === k} onClick={() => setPanel(k)} label={d.name} desc={d.desc} price={d.pricePerUnit > 0 ? `+${d.pricePerUnit}€` : "Standard"} />
              ))}
            </SectionCard>
          )}

          {/* Step 4: Glass */}
          <SectionCard num={ty.panelTypes ? "04" : "03"} label="Sticlă 10mm">
            {Object.entries(ty.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          {/* Step 5: Options */}
          <SectionCard num={ty.panelTypes ? "05" : "04"} label="Accesorii">
            <ToggleOption checked={inclManere} onChange={setInclManere} label={ty.options.manere.name} desc={ty.options.manere.desc} price={`${ty.options.manere.price}€`} />
            <ToggleOption checked={inclInc} onChange={setInclInc} label={ty.options.incuietoare.name} desc={ty.options.incuietoare.desc} price={`${ty.options.incuietoare.price}€`} />
            <ToggleOption checked={inclCar} onChange={setInclCar} label={ty.options.caroiaj.name} desc={ty.options.caroiaj.desc} price={`${ty.options.caroiaj.pricePerSqm}€/m²`} />
          </SectionCard>

          {/* Step 6: Dimensions */}
          <SectionCard num={ty.panelTypes ? "06" : "05"} label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime ușă (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} step="0.05" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} step="0.05" />
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox>
            <SlidingDoorPreview dims={dims} typology={typology} mount={mount} panel={panel} glass={glass} />
          </PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Tipologie", value: ty.name },
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Sticlă", value: `${quote.glP}€` },
              quote.mountP > 0 && { label: "Prindere", value: `+${quote.mountP}€`, accent: true },
              quote.panelP > 0 && { label: "Buzunar", value: `+${quote.panelP}€`, accent: true },
              quote.manP > 0 && { label: "Mânere", value: `+${quote.manP}€`, accent: true },
              quote.incP > 0 && { label: "Încuietoare", value: `+${quote.incP}€`, accent: true },
              quote.carP > 0 && { label: "Caroiaj", value: `+${quote.carP}€`, accent: true },
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
          productType="sliding"
          config={{ dims, typology, mount, panel, glass, inclManere, inclInc, inclCar }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
