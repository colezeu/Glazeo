import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = {
  name: "Pergolă", basePrice: 300,
  typeCategories: {
    "pergola-bioclimatica": { name: "Pergolă Bioclimatică",    pricePerSqm: 650, desc: "Lamele orientabile, ventilație controlată" },
    "pergola-sticla":       { name: "Pergolă Acoperiș Sticlă", pricePerSqm: 580, desc: "Panouri de sticlă culisante sau fixe" },
    "pergola-sandwich":     { name: "Pergolă Panou Sandwich",   pricePerSqm: 420, desc: "Panou termoizolant opac" },
  },
  glassTypes: {
    clear:  { name: "Sticlă Clară",      pricePerSqm: 0,  desc: "Lumină maximă" },
    solar:  { name: "Control Solar",      pricePerSqm: 85, desc: "Reduce căldura, g=0.35" },
    frosted:{ name: "Sablată / Satinată", pricePerSqm: 45, desc: "Difuzie lumină" },
  },
  options: {
    led:           { name: "Iluminare LED",        pricePerMeter: 55, desc: "Bandă LED în profil" },
    dezghetare:    { name: "Dezghețare Electrică", pricePerSqm: 95,   desc: "Rezistențe anti-îngheț" },
    mobilier:      { name: "Mobilier Pergolă",      price: 1200,       desc: "Set rezistent UV" },
    "panouri-lat": { name: "Panouri Laterale",      pricePerSqm: 280,  desc: "Închideri laterale suplimentare" },
  }
};

function PergolaPreview({ dims, type, glass, inclLed }) {
  const w = parseFloat(dims.width) || 4, d = parseFloat(dims.depth) || 3;
  const W = 308, H = 180, M = 24;
  const sc = Math.min((W * 0.55 - M) / w, (H - M * 2) / d);
  const gW = w * sc, gD = d * sc, x0 = (W - gW) / 2, y0 = (H - gD) / 2;
  const isBio = type === "pergola-bioclimatica";
  const isSandwich = type === "pergola-sandwich";
  const roofFill = isSandwich ? "rgba(160,160,180,0.2)" : glass === "solar" ? "rgba(80,160,100,0.12)" : "rgba(180,220,255,0.08)";
  const roofStroke = isSandwich ? "rgba(160,160,180,0.5)" : "rgba(180,220,255,0.4)";
  const slats = isBio ? Math.round(w * 2.5) : 0;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x={x0} y={y0} width={gW} height={gD} fill={roofFill} stroke={roofStroke} strokeWidth="1.5" rx="2"/>
      {isBio && Array.from({ length: slats }, (_, i) => (
        <line key={i} x1={x0+(i/slats)*gW} y1={y0} x2={x0+(i/slats)*gW} y2={y0+gD} stroke="rgba(200,169,110,0.4)" strokeWidth="2"/>
      ))}
      {[[x0,y0],[x0+gW-4,y0],[x0,y0+gD-4],[x0+gW-4,y0+gD-4]].map(([cx,cy],i) => (
        <rect key={i} x={cx} y={cy} width={4} height={4} fill="rgba(200,169,110,0.7)" rx="1"/>
      ))}
      {inclLed && <rect x={x0+4} y={y0+4} width={gW-8} height={gD-8} fill="none" stroke="rgba(255,220,120,0.35)" strokeWidth="1.5" strokeDasharray="5,3" rx="2"/>}
      <text x={x0+gW/2} y={H-6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">
        {dims.width||"—"}m × {dims.depth||"—"}m
      </text>
    </svg>
  );
}

export default function PergolaConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width:"", depth:"" });
  const [type, setType] = useState("pergola-bioclimatica");
  const [glass, setGlass] = useState("clear");
  const [inclLed, setInclLed] = useState(false);
  const [inclDez, setInclDez] = useState(false);
  const [inclMob, setInclMob] = useState(false);
  const [inclPan, setInclPan] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json").then(r => r.json())
      .then(d => {
        const raw = d.products["pergola-copertina"];
        setProduct({
          ...raw,
          typeCategories: Object.fromEntries(
            Object.entries(raw.typeCategories).filter(([k]) => k.startsWith("pergola"))
          )
        });
        setVatRate(d.vatRate);
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  const p = product;
  const isValid = dims.width && dims.depth && parseFloat(dims.width) > 0;
  const showGlass = type === "pergola-sticla";
  const perimeter = 2 * ((parseFloat(dims.width)||0) + (parseFloat(dims.depth)||0));

  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const w = parseFloat(dims.width)||0, d = parseFloat(dims.depth)||0, area = w * d;
    const typeP = area * p.typeCategories[type].pricePerSqm;
    const glP   = showGlass ? area * (p.glassTypes[glass]?.pricePerSqm||0) : 0;
    const ledP  = inclLed ? perimeter * p.options.led.pricePerMeter : 0;
    const dezP  = inclDez ? area * p.options.dezghetare.pricePerSqm : 0;
    const mobP  = inclMob ? p.options.mobilier.price : 0;
    const panP  = inclPan ? area * p.options["panouri-lat"].pricePerSqm : 0;
    const { subtotal, vat, total } = calcQuote(p.basePrice + typeP + glP + ledP + dezP + mobP + panP, vatRate);
    setQuote({ area:area.toFixed(2), typeP:Math.round(typeP), glP:Math.round(glP), ledP:Math.round(ledP), dezP:Math.round(dezP), mobP, panP:Math.round(panP), subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader/>;

  return (
    <div style={{ minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Pergolă"/>
      <ConfigHeader title="Configurator Pergole" quote={quote}/>
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v=>setDims(d=>({...d,width:v}))} placeholder="Ex: 4.0"/>
              <NumberInput label="Adâncime (m)" value={dims.depth} onChange={v=>setDims(d=>({...d,depth:v}))} placeholder="Ex: 3.0"/>
            </div>
          </SectionCard>
          <SectionCard num="02" label="Tip Pergolă">
            {Object.entries(p.typeCategories).map(([k,d]) => (
              <OptionBtn key={k} selected={type===k} onClick={() => setType(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`}/>
            ))}
          </SectionCard>
          {showGlass && (
            <SectionCard num="03" label="Tip Sticlă Acoperiș">
              {Object.entries(p.glassTypes).map(([k,d]) => (
                <OptionBtn key={k} selected={glass===k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={d.pricePerSqm>0?`+${d.pricePerSqm}€/m²`:"Inclus"}/>
              ))}
            </SectionCard>
          )}
          <SectionCard num={showGlass?"04":"03"} label="Opțiuni & Accesorii">
            <ToggleOption checked={inclLed} onChange={setInclLed} label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.pricePerMeter}€/m`}/>
            <ToggleOption checked={inclDez} onChange={setInclDez} label={p.options.dezghetare.name} desc={p.options.dezghetare.desc} price={`${p.options.dezghetare.pricePerSqm}€/m²`}/>
            <ToggleOption checked={inclMob} onChange={setInclMob} label={p.options.mobilier.name} desc={p.options.mobilier.desc} price={`${p.options.mobilier.price}€`}/>
            <ToggleOption checked={inclPan} onChange={setInclPan} label={p.options["panouri-lat"].name} desc={p.options["panouri-lat"].desc} price={`${p.options["panouri-lat"].pricePerSqm}€/m²`}/>
          </SectionCard>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox><PergolaPreview dims={dims} type={type} glass={glass} inclLed={inclLed}/></PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote?[
              {label:"Suprafață",value:`${quote.area} m²`},
              {label:"Structură",value:`${quote.typeP}€`},
              quote.glP>0&&{label:"Sticlă",value:`+${quote.glP}€`,accent:true},
              quote.ledP>0&&{label:"LED",value:`+${quote.ledP}€`,accent:true},
              quote.dezP>0&&{label:"Dezghețare",value:`+${quote.dezP}€`,accent:true},
              quote.mobP>0&&{label:"Mobilier",value:`+${quote.mobP}€`,accent:true},
              quote.panP>0&&{label:"Panouri lat.",value:`+${quote.panP}€`,accent:true},
            ]:[]}/>
        </div>
      </main>
    </div>
  );
}
