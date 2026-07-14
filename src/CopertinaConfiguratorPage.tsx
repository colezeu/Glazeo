// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.jsx";
import { getUserMultiplier } from "./lib/user";
import { useAutoSave } from "./useAutoSave";
import ResumeBanner from "./components/ResumeBanner";
import { clearSavedConfig } from "./usePersistedConfig";

const FALLBACK = {
  name: "Copertină", basePrice: 0,
  typeCategories: {
    "copertina-tiranti":   { name: "Copertină cu Tiranți",            kitPrice: 70,  desc: "Kit tirant 70€+TVA, max 4m×2m" },
    "copertina-fara-1.2": { name: "Copertină fără Tiranți (max 1.2m)", pricePerMeter: 209, desc: "Consolă fără suport, până la 1.2m" },
    "copertina-fara-1.5": { name: "Copertină fără Tiranți (max 1.5m)", pricePerMeter: 340, desc: "Consolă ranforsată fără suport, până la 1.5m" },
  },
  glassTypes: {
    "882": { name: "Sticlă Laminată 882 Clar (17mm)", pricePerSqm: 131, desc: "Standard exterior, rezistență ridicată" },
  },
  options: {
    led:      { name: "Iluminare LED", price: 333, desc: "Bandă LED 3000K în profil" },
    degivrare:{ name: "Degivrare",     pricePerSqm: 590, desc: "Rezistențe în sticlă, anti-îngheț" },
  }
};

function CopertinaPreview({ dims, type, glass, inclLed }) {
  const imgMap = {
    "copertina-tiranti": "/copertina-tiranti.png",
    "copertina-fara-1.2": "/copertina-fara-1.2.png",
    "copertina-fara-1.5": "/copertina-fara-1.5.png",
  };
  const imgSrc = imgMap[type];

  if (imgSrc) {
    return (
      <div style={{ width: "100%", aspectRatio: "16/10", overflow: "hidden", borderRadius: 12, background: "#000" }}>
        <img src={imgSrc} alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", filter: "invert(1)" }} />
      </div>
    );
  }

  const w = parseFloat(dims.width)||4, d = parseFloat(dims.depth)||2;
  const W = 308, H = 180, M = 24;
  const sc = Math.min((W*0.55-M)/w, (H-M*2)/d);
  const gW = w*sc, gD = d*sc, x0=(W-gW)/2, y0=(H-gD)/2;
  const glFill = glass==="solar"?"rgba(80,160,100,0.12)":"rgba(180,220,255,0.1)";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x={x0} y={y0} width={gW} height={gD} fill={glFill} stroke="rgba(180,220,255,0.4)" strokeWidth="1.5" rx="2"/>
      {type==="copertina-tiranti" && <>
        <line x1={x0} y1={y0} x2={x0-20} y2={y0-20} stroke="rgba(200,169,110,0.5)" strokeWidth="1.5"/>
        <line x1={x0+gW} y1={y0} x2={x0+gW+20} y2={y0-20} stroke="rgba(200,169,110,0.5)" strokeWidth="1.5"/>
      </>}
      {inclLed && <rect x={x0+4} y={y0+4} width={gW-8} height={gD-8} fill="none" stroke="rgba(255,220,120,0.35)" strokeWidth="1.5" strokeDasharray="5,3" rx="2"/>}
      <text x={x0+gW/2} y={H-6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">
        {dims.width||"—"}m × {dims.depth||"—"}m
      </text>
    </svg>
  );
}

export default function CopertinaConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width:"", depth:"" });
  const [type, setType] = useState("copertina-tiranti");
  const [glass, setGlass] = useState("882");
  const [inclLed, setInclLed] = useState(false);
  const [inclDegivrare, setInclDegivrare] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useAutoSave("copertina", { dims, type, glass, inclLed, inclDegivrare });

  const resetAll = () => { clearSavedConfig("copertina"); window.location.reload(); };

  useEffect(() => {
    fetch("/catalog.json").then(r => r.json())
      .then(d => {
        const raw = d.products["pergola-copertina"];
        setProduct({
          ...raw,
          typeCategories: Object.fromEntries(
            Object.entries(raw.typeCategories).filter(([k]) => k.startsWith("copertina"))
          )
        });
        setVatRate(d.vatRate);
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  // Restore saved project from Dashboard
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'copertina' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.type) setType(cfg.type);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.inclLed) setInclLed(cfg.inclLed);
          if (cfg.inclDegivrare) setInclDegivrare(cfg.inclDegivrare);
        }
      } catch (e) {}
      localStorage.removeItem('loadProject');
    }
  }, []);

  // Load B2B price tier
  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  const p = product;
  const w = parseFloat(dims.width)||0, d = parseFloat(dims.depth)||0;
  const isValid = dims.width && dims.depth && w > 0 && d > 0 &&
    (type !== "copertina-tiranti" || (w <= 4 && d <= 2)) &&
    (type !== "copertina-fara-1.2" || (w <= 3 && d <= 1.2)) &&
    (type !== "copertina-fara-1.5" || d <= 1.5);

  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const area = w * d;

    // Structural price
    let structP = 0, structLabel = "";
    if (type === "copertina-tiranti") {
      const kits = Math.ceil(w / 2) + 1;
      structP = kits * p.typeCategories[type].kitPrice;
      structLabel = `${kits} kit × ${p.typeCategories[type].kitPrice}€`;
    } else {
      structP = w * p.typeCategories[type].pricePerMeter;
      structLabel = `${w.toFixed(1)}m × ${p.typeCategories[type].pricePerMeter}€/m`;
    }

    const glP   = area * (p.glassTypes[glass]?.pricePerSqm||0);
    const ledP  = inclLed ? (p.options.led.price || 0) : 0;
    const degP  = inclDegivrare ? area * p.options.degivrare.pricePerSqm : 0;
    const { subtotal, vat, total } = calcQuote(Math.round((p.basePrice+structP+glP+ledP+degP) * priceMultiplier), vatRate);
    setQuote({ area:area.toFixed(2), structP:Math.round(structP * priceMultiplier), structLabel, glP:Math.round(glP * priceMultiplier), ledP:Math.round(ledP * priceMultiplier), degP:Math.round(degP * priceMultiplier), subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader/>;

  return (
    <div style={{minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <ResumeBanner storageKey="copertina" onDismiss={resetAll} />
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Copertină" productType="copertina" config={{ dims, type, glass, inclLed, inclDegivrare }} />
      <ConfigHeader title="Configurator Copertine" quote={quote}/>
      <main className="configurator-grid" style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <SectionCard num="01" label="Dimensiuni">
            <div className="config-dim-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} placeholder="Ex: 4.0"/>
              <NumberInput label="Proiecție (m)" value={dims.depth} onChange={v=>setDims(d=>({...d,depth:v}))} placeholder="Ex: 2.0"/>
            </div>
            {type === "copertina-tiranti" && dims.width && dims.depth && (w > 4 || d > 2) && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Max: {w > 4 ? `${w.toFixed(1)}m {'>'} 4m lățime` : ""}{w > 4 && d > 2 ? " / " : ""}{d > 2 ? `${d.toFixed(1)}m {'>'} 2m consolă` : ""}.
              </div>
            )}
            {type === "copertina-fara-1.2" && dims.width && dims.depth && (w > 3 || d > 1.2) && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Max: {w > 3 ? `${w.toFixed(1)}m {'>'} 3m lățime` : ""}{w > 3 && d > 1.2 ? " / " : ""}{d > 1.2 ? `${d.toFixed(1)}m {'>'} 1.2m consolă` : ""}.
              </div>
            )}
            {type === "copertina-fara-1.5" && dims.depth && d > 1.5 && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
                Max consolă: {d.toFixed(1)}m {'>'} 1.5m.
              </div>
            )}
          </SectionCard>
          <SectionCard num="02" label="Tip Copertină">
            {Object.entries(p.typeCategories).map(([k,d]) => {
              const price = d.kitPrice
                ? `${d.kitPrice}€/kit`
                : `${d.pricePerMeter}€/ml`;
              return <OptionBtn key={k} selected={type===k} onClick={() => setType(k)} label={d.name} desc={d.desc} price={price} />;
            })}
          </SectionCard>
          <SectionCard num="03" label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={glass===k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={d.pricePerSqm>0?`+${d.pricePerSqm}€/m²`:"Inclus"}/>
            ))}
          </SectionCard>
          <SectionCard num="04" label="Opțiuni & Accesorii">
            <ToggleOption checked={inclLed} onChange={setInclLed} label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.price}€`}/>
            <ToggleOption checked={inclDegivrare} onChange={setInclDegivrare} label={p.options.degivrare.name} desc={p.options.degivrare.desc} price={`${p.options.degivrare.pricePerSqm}€/m²`}/>
          </SectionCard>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox><CopertinaPreview dims={dims} type={type} glass={glass} inclLed={inclLed}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Structură",value:`${quote.structP}€`, hint: quote.structLabel},
              quote.glP>0&&{label:"Sticlă",value:`+${quote.glP}€`,accent:true},
              quote.ledP>0&&{label:"LED",value:`+${quote.ledP}€`,accent:true},
              quote.degP>0&&{label:"Degivrare",value:`+${quote.degP}€`,accent:true},
            ]:[]}/>
       
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
          productType="copertina"
          config={{ dims, type, glass, inclLed, inclDegivrare }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}