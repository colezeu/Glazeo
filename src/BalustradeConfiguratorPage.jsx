import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";
import BalustradePreview3D from "./BalustradePreview2D.jsx";

const FALLBACK = { name:"Balustrade", basePrice:100, glassShapes:{ dreapta:{name:"Sticlă Dreaptă",desc:"Panou drept standard",taxaForma:0}, forma:{name:"Sticlă Formă (rampă)",desc:"Tăiat pe unghi / curbă",taxaForma:45} }, hardwareTypes:{ butoni:{name:"Cu Butoni Inox",pricePerMeter:85,desc:"Puncte de fixare, design minimalist"}, "mini-montanti":{name:"Cu Mini-Montanți",pricePerMeter:78,desc:"Montanți intermediari inox"}, "profil-pardoseala":{name:"Profil Pardoseală",pricePerMeter:50,desc:"Canal montat pe pardoseală"} }, profileShapes:{ U:{name:"Formă U",pricePerMeter:0}, Y:{name:"Formă Y",pricePerMeter:108}, L:{name:"Formă L",pricePerMeter:99} }, glassTypes:{ "662mm":{name:"Sticlă Securizată/Laminată 662 (13mm)",pricePerSqm:84,desc:"Laminat 66.2, ideal interior"}, "882mm":{name:"Sticlă Securizată/Laminată 882 (17mm)",pricePerSqm:98,desc:"Standard exterior"} }, options:{ "handrail-structurala":{name:"Mână Curentă Structurală Aluminiu",pricePerMeter:85,desc:"Profil aluminiu structural"}, "handrail-rotunda":{name:"Mână Curentă Rotundă Inox",pricePerMeter:45,desc:"Rotundă Ø42.4mm, satinat"}, "handrail-patrata":{name:"Mână Curentă Pătrată Inox",pricePerMeter:55,desc:"Profil pătrat 40x40mm"}, "handrail-slim":{name:"Mână Curentă Slim Aluminiu",pricePerMeter:65,desc:"Profil slim 18x12mm"}, led:{name:"Iluminare LED Integrată",price:250,desc:"Bandă LED 3000K"} } };

const PROFIL_IMAGES = { U:"/profil-u.png", Y:"/profil-y.png", L:"/profil-l.png" };
const MC_IMAGES = {
  "handrail-structurala": "/mc-structurala.png",
  "handrail-rotunda":     "/mc-rotunda.png",
  "handrail-patrata":     "/mc-patrata.png",
  "handrail-slim":        "/mc-slim.png",
};

export default function BalustradeConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ length:"", height:"0.9" });
  const [glassShape, setGlassShape] = useState("dreapta");
  const [hardware, setHardware] = useState("butoni");
  const [profileShape, setProfileShape] = useState("U");
  const [glassType, setGlassType] = useState("662mm");
  const [handrail, setHandrail] = useState("none");
  const [includeLed, setIncludeLed] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.json())
      .then(d => {
        setProduct(d.products.balustrade);
        setVatRate(d.vatRate);
        const firstGlass = Object.keys(d.products.balustrade.glassTypes)[0];
        setGlassType(firstGlass);
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  const p = product;
  const showProfileShape = hardware === "profil-pardoseala";
  const isValid = dims.length && parseFloat(dims.length) > 0;

  const skirt = hardware === "butoni" ? 0.35
    : (hardware === "profil-pardoseala" && profileShape === "Y") ? 0.10
    : 0;

  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const len = parseFloat(dims.length) || 0;
    const h   = parseFloat(dims.height) || 0;
    const panelCount = Math.ceil(len / 1.1);
    const area = len * (h + skirt);
    const hwPrice    = len * (p.hardwareTypes[hardware]?.pricePerMeter || 0);
    const profExtra  = showProfileShape ? len * (p.profileShapes[profileShape]?.pricePerMeter || 0) : 0;
    const glassPrice = area * (p.glassTypes[glassType]?.pricePerSqm || 0);
    const taxaForma  = glassShape === "forma" ? (p.glassShapes.forma?.taxaForma || 0) * panelCount : 0;
    const handrailP  = handrail !== "none" ? len * (p.options[handrail]?.pricePerMeter || 0) : 0;
    const ledP       = includeLed ? (p.options.led?.price || 0) : 0;
    const raw = p.basePrice + hwPrice + profExtra + glassPrice + taxaForma + handrailP + ledP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);
    setQuote({ area:area.toFixed(2), hwPrice:Math.round(hwPrice+profExtra), glassPrice:Math.round(glassPrice), taxaForma:Math.round(taxaForma), handrailP:Math.round(handrailP), ledP, subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const mountingType = hardware === "butoni" ? "clips"
    : hardware === "mini-montanti" ? "mini-montanti"
    : hardware === "profil-pardoseala" ? "embedded"
    : "profile";

  return (
    <div style={{ minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Balustradă Sticlă" />
      <ConfigHeader title="Configurator Balustrade" quote={quote} />
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <NumberInput label="Lungime (m)" value={dims.length} onChange={v=>setDims(d=>({...d,length:v}))} placeholder="Ex: 5.0" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v=>setDims(d=>({...d,height:v}))} placeholder="Ex: 0.9" step="0.05" />
            </div>
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {Object.entries(p.glassShapes).map(([k,d]) => (
                <OptionBtn key={k} selected={glassShape===k} onClick={() => setGlassShape(k)} label={d.name} desc={d.desc} />
              ))}
            </div>
            {glassShape === "forma" && p.glassShapes.forma?.taxaForma > 0 && (
              <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:"rgba(200,169,110,0.08)", border:"1px solid rgba(200,169,110,0.2)", fontSize:"0.8rem", color:"rgba(240,237,232,0.6)" }}>
                Include taxă de formă: <strong style={{ color:"#c8a96e" }}>{p.glassShapes.forma.taxaForma}€/panou</strong> pentru tăierea pe unghi.
              </div>
            )}
          </SectionCard>

          <SectionCard num="03" label="Feronerie / Sistem Prindere">
            {Object.entries(p.hardwareTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={hardware===k} onClick={() => setHardware(k)} label={d.name} desc={d.desc} price={`${d.pricePerMeter}€/m`} />
            ))}
            {showProfileShape && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.4)", marginBottom:8 }}>Formă profil:</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {Object.entries(p.profileShapes).map(([k,d]) => (
                    <OptionBtn key={k} selected={profileShape===k} onClick={() => setProfileShape(k)}
                      label={d.name} price={d.pricePerMeter > 0 ? `+${d.pricePerMeter}€/m` : "Inclus"} center />
                  ))}
                </div>
                <div style={{ marginTop:16, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)" }}>
                  <div style={{ fontSize:"0.72rem", color:"rgba(240,237,232,0.35)", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                    Detaliu secțiune · Profil {profileShape}
                  </div>
                  <img src={PROFIL_IMAGES[profileShape]} alt={`Profil ${profileShape}`}
                    style={{ width:"100%", display:"block", maxHeight:240, objectFit:"contain", padding:"16px", filter:"invert(0.88) brightness(0.85)" }} />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard num="04" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={glassType===k} onClick={() => setGlassType(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="05" label="Mână Curentă (opțional)">
            {[
              { key:"none", label:"Fără mână curentă", desc:"", price:"—" },
              ...Object.entries(p.options).filter(([k]) => k.startsWith("handrail")).map(([k,d]) => ({ key:k, label:d.name, desc:d.desc, price:`${d.pricePerMeter}€/m` }))
            ].map(o => (
              <OptionBtn key={o.key} selected={handrail===o.key} onClick={() => setHandrail(o.key)} label={o.label} desc={o.desc} price={o.price} />
            ))}
            {handrail !== "none" && MC_IMAGES[handrail] && (
              <div style={{ marginTop:16, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize:"0.72rem", color:"rgba(240,237,232,0.35)", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                  Detaliu secțiune · {p.options[handrail]?.name}
                </div>
                <img src={MC_IMAGES[handrail]} alt={handrail}
                  style={{ width:"100%", display:"block", maxHeight:220, objectFit:"contain", padding:"16px", filter:"invert(0.88) brightness(0.85)" }} />
              </div>
            )}
            <ToggleOption checked={includeLed} onChange={setIncludeLed}
              label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.price}€`} />
          </SectionCard>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox title="Previzualizare 3D">
            <BalustradePreview3D dimensions={dims} glassType={glassType} mountingType={mountingType}
              profileShape={profileShape} skirtOverride={skirt} includeHandrail={handrail !== "none"}
              includeLed={includeLed} glassShape={glassShape} />
          </PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label:"Suprafață", value:`${quote.area} m²` },
              { label:"Feronerie", value:`${quote.hwPrice}€` },
              { label:"Sticlă",   value:`${quote.glassPrice}€` },
              quote.taxaForma > 0 && { label:"Taxă formă",   value:`+${quote.taxaForma}€`, accent:true },
              quote.handrailP > 0 && { label:p?.options[handrail]?.name || "Mână curentă", value:`+${quote.handrailP}€`, accent:true },
              quote.ledP > 0      && { label:"LED",           value:`+${quote.ledP}€`,      accent:true },
            ] : []}
          />
        </div>
      </main>
    </div>
  );
}
