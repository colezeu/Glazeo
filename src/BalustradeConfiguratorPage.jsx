import { useState, useEffect, useCallback } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, ValidatedNumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote } from "./ConfiguratorShared.jsx";
import { validateForm } from "./validation";
import { usePersistedConfig, getShareableUrl } from "./usePersistedConfig";
import QuoteModal from "./QuoteModal.jsx";
import BalustradePreview3D from "./BalustradePreview2D.jsx";
import { Share2, Check } from "lucide-react";

const FALLBACK = { name:"Balustrade", basePrice:150, glassShapes:{ dreapta:{name:"Sticlă Dreaptă",desc:"Panou drept standard",taxaForma:0}, forma:{name:"Sticlă Formă (rampă)",desc:"Tăiat pe unghi / curbă",taxaForma:45} }, hardwareTypes:{ butoni:{name:"Cu Butoni Inox",pricePerMeter:155,desc:"Puncte de fixare, design minimalist"}, "mini-montanti":{name:"Cu Mini-Montanți",pricePerMeter:195,desc:"Montanți intermediari inox"}, "profil-pardoseala":{name:"Profil Pardoseală",pricePerMeter:1220,desc:"Canal integrat în pardoseală"} }, profileShapes:{ U:{name:"Formă U",pricePerMeter:0}, Y:{name:"Formă Y",pricePerMeter:10}, L:{name:"Formă L",pricePerMeter:10} }, glassTypes:{ "662mm":{name:"Sticlă Securizată/Laminată 662 (13mm)",pricePerSqm:150,desc:"Laminat 66.2, ideal interior"}, "882mm":{name:"Sticlă Securizată/Laminată 882 (17mm)",pricePerSqm:200,desc:"Standard exterior"} }, options:{ handrail:{name:"Mână Curentă Inox",pricePerMeter:45,desc:"Rotundă Ø42mm, satinat"}, "handrail-slim":{name:"Mână Curentă Slim",pricePerMeter:85,desc:"Profil plat 40x10mm"}, led:{name:"Iluminare LED",price:150,desc:"Bandă LED 3000K"} } };

const DEFAULT_CONFIG = {
  length: "", height: "0.9", glassShape: "dreapta", hardware: "butoni",
  profileShape: "U", glassType: "662mm", handrail: "none", includeLed: false,
};

const PROFIL_IMAGES = { U: "/profil-u.png", Y: "/profil-y.png", L: "/profil-l.png" };
const MC_IMAGES = {
  "handrail-structurala": "/mc-structurala.png",
  "handrail-rotunda":     "/mc-rotunda.png",
  "handrail-patrata":     "/mc-patrata.png",
  "handrail-slim":        "/mc-slim.png",
};

export default function BalustradeConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [config, setConfig] = usePersistedConfig("balustrade", DEFAULT_CONFIG);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const { length, height, glassShape, hardware, profileShape, glassType, handrail, includeLed } = config;

  const loadCatalog = () => {
    setLoadError(false);
    fetch("/catalog.json")
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => {
        const catalogProduct = d.products.balustrade;
        if (!catalogProduct) {
  setProduct(FALLBACK);
  setLoadError(true);
  return;
}
        setProduct(catalogProduct);
        setVatRate(d.vatRate);
        setConfig(c => {
          const next = { ...c };

          if (!catalogProduct.glassShapes[next.glassShape]) {
            next.glassShape = DEFAULT_CONFIG.glassShape;
          }

          if (!catalogProduct.hardwareTypes[next.hardware]) {
            next.hardware = DEFAULT_CONFIG.hardware;
          }

          if (!catalogProduct.profileShapes[next.profileShape]) {
            next.profileShape = DEFAULT_CONFIG.profileShape;
          }

          if (!catalogProduct.glassTypes[next.glassType]) {
            next.glassType = Object.keys(catalogProduct.glassTypes)[0] || DEFAULT_CONFIG.glassType;
          }

          if (next.handrail !== "none" && !catalogProduct.options[next.handrail]) {
            next.handrail = DEFAULT_CONFIG.handrail;
          }

          return next;
        });
      })
      .catch(() => {
        setProduct(FALLBACK);
        setLoadError(true);
      });
  };

  useEffect(() => { loadCatalog(); }, []);

  if (loadError && !product) {
    return <ErrorBanner message="Nu s-a putut încărca catalogul de produse." onRetry={loadCatalog} onBack />;
  }

  const p = product;
  const normalizedIncludeLed = includeLed === true || includeLed === "true";
  const showProfileShape = hardware === "profil-pardoseala";

  const validation = validateForm({ width: length, height });
  const isValid = validation.valid;

  const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  const handleShare = async () => {
    const url = getShareableUrl({ length, height, glassShape, hardware, profileShape, glassType, handrail, includeLed });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const skirt = hardware === "butoni" ? 0.35
    : (hardware === "profil-pardoseala" && profileShape === "Y") ? 0.10
    : 0;

  const calculate = async () => {
    if (!p) return;
    setFormTouched(true);
    const check = validateForm({ width: length, height });
    if (!check.valid) {
      const firstErrorKey = Object.keys(check.errors)[0];
      const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const len = parseFloat(length) || 0;
    const h   = parseFloat(height) || 0;
    const panelCount = Math.ceil(len / 1.1);
    const area = len * (h + skirt);
    const hwPrice    = len * (p.hardwareTypes[hardware]?.pricePerMeter || 0);
    const profExtra  = showProfileShape ? len * (p.profileShapes[profileShape]?.pricePerMeter || 0) : 0;
    const glassPrice = area * (p.glassTypes[glassType]?.pricePerSqm || 0);
    const taxaForma  = glassShape === "forma" ? (p.glassShapes.forma?.taxaForma || 0) * panelCount : 0;
    const handrailP  = handrail !== "none" ? len * (p.options[handrail]?.pricePerMeter || 0) : 0;
    const ledP       = normalizedIncludeLed ? (p.options.led?.price || 0) : 0;
    const raw = p.basePrice + hwPrice + profExtra + glassPrice + taxaForma + handrailP + ledP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);
    setQuote({ area: area.toFixed(2), hwPrice: Math.round(hwPrice + profExtra), glassPrice: Math.round(glassPrice), taxaForma: Math.round(taxaForma), handrailP: Math.round(handrailP), ledP, subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const mountingType = hardware === "butoni" ? "clips"
    : hardware === "mini-montanti" ? "mini-montanti"
    : hardware === "profil-pardoseala" ? "embedded"
    : "profile";

  return (
    <div style={{ minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Balustradă Sticlă" config={config} />
      <ConfigHeader title="Configurator Balustrade" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div data-field="width">
                <ValidatedNumberInput label="Lungime (m)" value={length} onChange={v => { update("length", v); setFormTouched(true); }} placeholder="Ex: 5.0" fieldName="width" helperText="Min: 0.1m — Max: 20m" />
              </div>
              <div data-field="height">
                <ValidatedNumberInput label="Înălțime (m)" value={height} onChange={v => { update("height", v); setFormTouched(true); }} placeholder="Ex: 0.9" step="0.05" fieldName="height" helperText="Min: 0.1m — Max: 6m" />
              </div>
            </div>
            {formTouched && !isValid && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5"/><rect x="6.2" y="3.5" width="1.6" height="4" rx="0.8" fill="#ef4444"/><rect x="6.2" y="8.5" width="1.6" height="1.6" rx="0.8" fill="#ef4444"/></svg>
                Vă rugăm completați corect dimensiunile înainte de a calcula.
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {Object.entries(p.glassShapes).map(([k,d]) => (
                <OptionBtn key={k} selected={glassShape===k} onClick={() => update("glassShape", k)} label={d.name} desc={d.desc} />
              ))}
            </div>
            {glassShape === "forma" && p.glassShapes.forma?.taxaForma > 0 && (
              <div style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:"rgba(200,169,110,0.08)", border:"1px solid rgba(200,169,110,0.2)", fontSize:"0.8rem", color:"rgba(240,237,232,0.6)" }}>
                Include taxă de formă: <strong style={{ color:"#c8a96e" }}>{p.glassShapes.forma.taxaForma}€/panou</strong>
              </div>
            )}
          </SectionCard>

          <SectionCard num="03" label="Feronerie / Sistem Prindere">
            {Object.entries(p.hardwareTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={hardware===k} onClick={() => update("hardware", k)} label={d.name} desc={d.desc} price={`${d.pricePerMeter}€/m`} />
            ))}
            {showProfileShape && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.4)", marginBottom:8 }}>Formă profil:</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {Object.entries(p.profileShapes).map(([k,d]) => (
                    <OptionBtn key={k} selected={profileShape===k} onClick={() => update("profileShape", k)} label={d.name} price={d.pricePerMeter > 0 ? `+${d.pricePerMeter}€/m` : "Inclus"} center />
                  ))}
                </div>
                <div style={{ marginTop:16, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)" }}>
                  <div style={{ fontSize:"0.72rem", color:"rgba(240,237,232,0.35)", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", letterSpacing:"0.08em", textTransform:"uppercase" }}>Detaliu secțiune · Profil {profileShape}</div>
                  <img src={PROFIL_IMAGES[profileShape]} alt={`Profil ${profileShape}`} style={{ width:"100%", display:"block", maxHeight:240, objectFit:"contain", padding:"16px", filter:"invert(0.88) brightness(0.85)" }} />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard num="04" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={glassType===k} onClick={() => update("glassType", k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="05" label="Mână Curentă (opțional)">
            {[
              { key:"none", label:"Fără mână curentă", desc:"", price:"—" },
              ...Object.entries(p.options).filter(([k]) => k.startsWith("handrail")).map(([k,d]) => ({ key:k, label:d.name, desc:d.desc, price:`${d.pricePerMeter}€/m` }))
            ].map(o => (
              <OptionBtn key={o.key} selected={handrail===o.key} onClick={() => update("handrail", o.key)} label={o.label} desc={o.desc} price={o.price} />
            ))}
            {handrail !== "none" && MC_IMAGES[handrail] && (
              <div style={{ marginTop:16, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize:"0.72rem", color:"rgba(240,237,232,0.35)", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", letterSpacing:"0.08em", textTransform:"uppercase" }}>Detaliu secțiune · {p.options[handrail]?.name}</div>
                <img src={MC_IMAGES[handrail]} alt={handrail} style={{ width:"100%", display:"block", maxHeight:220, objectFit:"contain", padding:"16px", filter:"invert(0.88) brightness(0.85)" }} />
              </div>
            )}
            <ToggleOption checked={includeLed} onChange={v => update("includeLed", v)} label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.price}€`} />
          </SectionCard>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox title="Previzualizare 3D">
            <BalustradePreview3D dimensions={{ length, height }} glassType={glassType} mountingType={mountingType} profileShape={profileShape} skirtOverride={skirt} includeHandrail={handrail !== "none"} includeLed={normalizedIncludeLed} glassShape={glassShape} />
          </PreviewBox>

          {quote && (
            <button onClick={handleShare} className="btn-ghost w-full" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:"0.82rem" }}>
              {copied ? <><Check size={14} color="#22c55e" /> Link copiat!</> : <><Share2 size={14} /> Copiază link configurație</>}
            </button>
          )}

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label:"Suprafață", value:`${quote.area} m²` },
              { label:"Feronerie", value:`${quote.hwPrice}€` },
              { label:"Sticlă",   value:`${quote.glassPrice}€` },
              quote.taxaForma > 0 && { label:"Taxă formă", value:`+${quote.taxaForma}€`, accent:true },
              quote.handrailP > 0 && { label: handrail !== "none" ? p?.options[handrail]?.name || "Mână curentă" : "Mână curentă", value:`+${quote.handrailP}€`, accent:true },
              quote.ledP > 0      && { label:"LED",         value:`+${quote.ledP}€`,      accent:true },
            ] : []}
          />
        </div>
      </main>
    </div>
  );
}
