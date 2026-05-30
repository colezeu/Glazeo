import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, ValidatedNumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import { validateForm } from "./validation.js";
import { usePersistedConfig, getShareableUrl } from "./usePersistedConfig.js";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.js";
import ShowerPreview2D from "./ShowerPreview2D.jsx";
import { Share2, Check } from "lucide-react";

const FALLBACK = { name:"Cabine Duș", basePrice:80, enclosureTypes:{ "paravan-fix-profil":{name:"Paravan Fix cu Profil",price:0,desc:"Fix, cu profil perimetral"}, "paravan-fix-punctual":{name:"Paravan Fix cu Prinderi Fine",price:50,desc:"Prinderi punctuale inox"}, "paravan-mobil":{name:"Paravan Mobil (evantai)",price:180,desc:"Se pliază în evantai"}, "usa-batanta":{name:"Ușă Batantă",price:200,desc:"Deschidere 180°, balamale ascunse"}, "usa-culisanta-vedere":{name:"Ușă Culisantă la Vedere",price:300,desc:"Glisori vizibili"}, "usa-culisanta-sina":{name:"Ușă Culisantă în Șină",price:380,desc:"Sistem ascuns soft-close"} }, glassTypes:{ "8mm":{name:"Securit 8mm",pricePerSqm:130,desc:"Standard"}, "10mm":{name:"Securit 10mm",pricePerSqm:170,desc:"Robustețe sporită"} }, treatments:{ clear:{name:"Transparentă",pricePerSqm:0,desc:""}, frosted:{name:"Sablată",pricePerSqm:25,desc:"Opacă"}, nano:{name:"Nano Anti-Calcar",pricePerSqm:35,desc:""} }, options:{ towelBar:{name:"Port Prosop",price:45,desc:""}, seat:{name:"Scaun Rabatabil",price:85,desc:""}, led:{name:"Iluminare LED",price:120,desc:""} } };

const DEFAULT_CONFIG = {
  width: "", depth: "", height: "2.0", enclosure: "usa-batanta",
  glassType: "8mm", treatment: "clear", inclTowel: false, inclSeat: false, inclLed: false,
};

export default function ShowerConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [config, setConfig] = usePersistedConfig("shower", DEFAULT_CONFIG);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const { width, depth, height, enclosure, glassType, treatment, inclTowel, inclSeat, inclLed } = config;

  useEffect(() => {
    fetch("/catalog.json").then(r=>r.json())
      .then(d => { setProduct(d.products["cabine-dus"]); setVatRate(d.vatRate); })
      .catch(() => setProduct(FALLBACK));
  }, []);

  // Restore saved project
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'shower' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.config) setConfig(cfg.config);
        }
      } catch (e) {}
      localStorage.removeItem('loadProject');
    }
  }, []);

  // Load B2B price tier
  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  if (loadError) return

  const validation = validateForm({ width, depth, height });
  const isValid = validation.valid;
  const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  const handleShare = async () => {
    const url = getShareableUrl({ width, depth, height, enclosure, glassType, treatment, inclTowel, inclSeat, inclLed });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const calculate = async () => {
    if (!p) return;
    setFormTouched(true);
    const check = validateForm({ width, depth, height });
    if (!check.valid) {
      const firstErrorKey = Object.keys(check.errors)[0];
      const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const w=parseFloat(width)||0, d=parseFloat(depth)||0, h=parseFloat(height)||0;
    const area = (w*h) + (d*h) + (w*h);
    const encP = p.enclosureTypes[enclosure].price;
    const glassP = area * p.glassTypes[glassType].pricePerSqm;
    const treatP = area * p.treatments[treatment].pricePerSqm;
    const towelP = inclTowel ? p.options.towelBar.price : 0;
    const seatP  = inclSeat  ? p.options.seat.price     : 0;
    const ledP   = inclLed   ? p.options.led.price      : 0;
    const raw = p.basePrice + encP + glassP + treatP + towelP + seatP + ledP;
    const { subtotal, vat, total } = calcQuote(Math.round(raw * priceMultiplier), vatRate);
    setQuote({ area:area.toFixed(2), encP, glassP:Math.round(glassP), treatP:Math.round(treatP), towelP, seatP, ledP, subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const doorTypeMap = { "usa-batanta":"swing", "usa-culisanta-vedere":"sliding", "usa-culisanta-sina":"sliding", "paravan-fix-profil":"fixed", "paravan-fix-punctual":"fixed", "paravan-mobil":"fixed" };

  return (
    <div style={{ minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Cabină de Duș" config={config} />
      <ConfigHeader title="Configurator Cabine Duș" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          <SectionCard num="01" label="Dimensiuni Cabină">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div data-field="width">
                <ValidatedNumberInput label="Lățime (m)" value={width} onChange={v => { update("width", v); setFormTouched(true); }} placeholder="Ex: 0.9" step="0.05" fieldName="width" helperText="Min: 0.1m — Max: 20m" />
              </div>
              <div data-field="depth">
                <ValidatedNumberInput label="Adâncime (m)" value={depth} onChange={v => { update("depth", v); setFormTouched(true); }} placeholder="Ex: 0.9" step="0.05" fieldName="depth" helperText="Min: 0.1m — Max: 20m" />
              </div>
              <SelectInput label="Înălțime" value={height} onChange={v => { update("height", v); setFormTouched(true); }}
                options={[{value:"1.9",label:"1.9m"},{value:"2.0",label:"2.0m (standard)"},{value:"2.1",label:"2.1m"},{value:"2.2",label:"2.2m"}]} />
            </div>
            {formTouched && !isValid && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5"/><rect x="6.2" y="3.5" width="1.6" height="4" rx="0.8" fill="#ef4444"/><rect x="6.2" y="8.5" width="1.6" height="1.6" rx="0.8" fill="#ef4444"/></svg>
                Vă rugăm completați corect dimensiunile înainte de a calcula.
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Cabină / Deschidere">
            {Object.entries(p.enclosureTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={enclosure===k} onClick={() => update("enclosure", k)} label={d.name} desc={d.desc} price={d.price > 0 ? `+${d.price}€` : "Inclus"} />
            ))}
          </SectionCard>

          <SectionCard num="03" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={glassType===k} onClick={() => update("glassType", k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="04" label="Tratament Suprafață">
            {Object.entries(p.treatments).map(([k,d]) => (
              <OptionBtn key={k} selected={treatment===k} onClick={() => update("treatment", k)} label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Standard"} />
            ))}
          </SectionCard>

          <SectionCard num="05" label="Accesorii">
            <ToggleOption checked={inclTowel} onChange={v => update("inclTowel", v)} label={p.options.towelBar.name} desc={p.options.towelBar.desc} price={`${p.options.towelBar.price}€`} />
            <ToggleOption checked={inclSeat}  onChange={v => update("inclSeat", v)}  label={p.options.seat.name}     desc={p.options.seat.desc}     price={`${p.options.seat.price}€`} />
            <ToggleOption checked={inclLed}   onChange={v => update("inclLed", v)}   label={p.options.led.name}      desc={p.options.led.desc}      price={`${p.options.led.price}€`} />
          </SectionCard>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox title="Previzualizare 2D">
            <ShowerPreview2D dimensions={{ width, depth, height }} glassType={glassType} doorType={doorTypeMap[enclosure] || "fixed"} treatment={treatment} includeLed={inclLed} />
          </PreviewBox>

          {quote && (
            <button onClick={handleShare} className="btn-ghost w-full" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:"0.82rem" }}>
              {copied ? <><Check size={14} color="#22c55e" /> Link copiat!</> : <><Share2 size={14} /> Copiază link configurație</>}
            </button>
          )}

          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label:"Suprafață sticlă", value:`${quote.area} m²` },
              { label:"Tip cabină", value:`${quote.encP}€` },
              { label:"Sticlă", value:`${quote.glassP}€` },
              quote.treatP > 0 && { label:"Tratament",   value:`+${quote.treatP}€`,  accent:true },
              quote.towelP > 0 && { label:"Port prosop", value:`+${quote.towelP}€`,  accent:true },
              quote.seatP  > 0 && { label:"Scaun",       value:`+${quote.seatP}€`,   accent:true },
              quote.ledP   > 0 && { label:"LED",         value:`+${quote.ledP}€`,    accent:true },
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
          productType="shower"
          config={config}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}