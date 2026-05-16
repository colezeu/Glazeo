import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, ValidatedNumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import { validateForm } from "./validation";
import QuoteModal from "./QuoteModal.jsx";
import ShowerPreview2D from "./ShowerPreview2D.jsx";

const FALLBACK = { name:"Cabine Duș", basePrice:80, enclosureTypes:{ "paravan-fix-profil":{name:"Paravan Fix cu Profil",price:0,desc:"Fix, cu profil perimetral"}, "paravan-fix-punctual":{name:"Paravan Fix cu Prinderi Fine",price:50,desc:"Prinderi punctuale inox"}, "paravan-mobil":{name:"Paravan Mobil (evantai)",price:180,desc:"Se pliază în evantai"}, "usa-batanta":{name:"Ușă Batantă",price:200,desc:"Deschidere 180°, balamale ascunse"}, "usa-culisanta-vedere":{name:"Ușă Culisantă la Vedere",price:300,desc:"Glisori vizibili"}, "usa-culisanta-sina":{name:"Ușă Culisantă în Șină",price:380,desc:"Sistem ascuns soft-close"} }, glassTypes:{ "8mm":{name:"Securit 8mm",pricePerSqm:130,desc:"Standard"}, "10mm":{name:"Securit 10mm",pricePerSqm:170,desc:"Robustețe sporită"} }, treatments:{ clear:{name:"Transparentă",pricePerSqm:0,desc:""}, frosted:{name:"Sablată",pricePerSqm:25,desc:"Opacă"}, nano:{name:"Nano Anti-Calcar",pricePerSqm:35,desc:""} }, options:{ towelBar:{name:"Port Prosop",price:45,desc:""}, seat:{name:"Scaun Rabatabil",price:85,desc:""}, led:{name:"Iluminare LED",price:120,desc:""} } };

export default function ShowerConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width:"", depth:"", height:"2.0" });
  const [enclosure, setEnclosure] = useState("usa-batanta");
  const [glassType, setGlassType] = useState("8mm");
  const [treatment, setTreatment] = useState("clear");
  const [inclTowel, setInclTowel] = useState(false);
  const [inclSeat, setInclSeat] = useState(false);
  const [inclLed, setInclLed] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  useEffect(() => {
    fetch("/catalog.json").then(r=>r.json())
      .then(d => { setProduct(d.products["cabine-dus"]); setVatRate(d.vatRate); })
      .catch(() => setProduct(FALLBACK));
  }, []);

  const p = product;

  // Validare completă
  const validation = validateForm({
    width: dims.width,
    depth: dims.depth,
    height: dims.height,
  });
  const isValid = validation.valid;
  const displayErrors = formTouched ? validation.errors : {};

  const calculate = async () => {
    if (!p) return;
    setFormTouched(true);

    const check = validateForm({ width: dims.width, depth: dims.depth, height: dims.height });
    if (!check.valid) {
      const firstErrorKey = Object.keys(check.errors)[0];
      const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const w=parseFloat(dims.width)||0, d=parseFloat(dims.depth)||0, h=parseFloat(dims.height)||0;
    const area = (w*h) + (d*h) + (w*h);
    const encP      = p.enclosureTypes[enclosure].price;
    const glassP    = area * p.glassTypes[glassType].pricePerSqm;
    const treatP    = area * p.treatments[treatment].pricePerSqm;
    const towelP    = inclTowel ? p.options.towelBar.price : 0;
    const seatP     = inclSeat  ? p.options.seat.price     : 0;
    const ledP      = inclLed   ? p.options.led.price      : 0;
    const raw = p.basePrice + encP + glassP + treatP + towelP + seatP + ledP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);
    setQuote({ area:area.toFixed(2), encP, glassP:Math.round(glassP), treatP:Math.round(treatP), towelP, seatP, ledP, subtotal, vat, total });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const doorTypeMap = { "usa-batanta":"swing", "usa-culisanta-vedere":"sliding", "usa-culisanta-sina":"sliding", "paravan-fix-profil":"fixed", "paravan-fix-punctual":"fixed", "paravan-mobil":"fixed" };

  return (
    <div style={{ minHeight:"100vh", background:"#0f1117", color:"#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Cabină de Duș" />
      <ConfigHeader title="Configurator Cabine Duș" quote={quote} />

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"grid", gridTemplateColumns:"1fr 340px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          <SectionCard num="01" label="Dimensiuni Cabină">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div data-field="width">
                <ValidatedNumberInput
                  label="Lățime (m)"
                  value={dims.width}
                  onChange={v => { setDims(d => ({ ...d, width: v })); setFormTouched(true); }}
                  placeholder="Ex: 0.9"
                  step="0.05"
                  fieldName="width"
                  helperText="Min: 0.1m — Max: 20m"
                />
              </div>
              <div data-field="depth">
                <ValidatedNumberInput
                  label="Adâncime (m)"
                  value={dims.depth}
                  onChange={v => { setDims(d => ({ ...d, depth: v })); setFormTouched(true); }}
                  placeholder="Ex: 0.9"
                  step="0.05"
                  fieldName="depth"
                  helperText="Min: 0.1m — Max: 20m"
                />
              </div>
              <SelectInput label="Înălțime" value={dims.height} onChange={v => { setDims(d => ({ ...d, height: v })); setFormTouched(true); }}
                options={[{value:"1.9",label:"1.9m"},{value:"2.0",label:"2.0m (standard)"},{value:"2.1",label:"2.1m"},{value:"2.2",label:"2.2m"}]} />
            </div>
            {formTouched && !isValid && (
              <div style={{
                marginTop: 12, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "0.8rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 8
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5"/>
                  <rect x="6.2" y="3.5" width="1.6" height="4" rx="0.8" fill="#ef4444"/>
                  <rect x="6.2" y="8.5" width="1.6" height="1.6" rx="0.8" fill="#ef4444"/>
                </svg>
                Vă rugăm completați corect dimensiunile înainte de a calcula.
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Cabină / Deschidere">
            {Object.entries(p.enclosureTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={enclosure===k} onClick={() => setEnclosure(k)}
                label={d.name} desc={d.desc} price={d.price > 0 ? `+${d.price}€` : "Inclus"} />
            ))}
          </SectionCard>

          <SectionCard num="03" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k,d]) => (
              <OptionBtn key={k} selected={glassType===k} onClick={() => setGlassType(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="04" label="Tratament Suprafață">
            {Object.entries(p.treatments).map(([k,d]) => (
              <OptionBtn key={k} selected={treatment===k} onClick={() => setTreatment(k)}
                label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Standard"} />
            ))}
          </SectionCard>

          <SectionCard num="05" label="Accesorii">
            <ToggleOption checked={inclTowel} onChange={setInclTowel} label={p.options.towelBar.name} desc={p.options.towelBar.desc} price={`${p.options.towelBar.price}€`} />
            <ToggleOption checked={inclSeat}  onChange={setInclSeat}  label={p.options.seat.name}     desc={p.options.seat.desc}     price={`${p.options.seat.price}€`} />
            <ToggleOption checked={inclLed}   onChange={setInclLed}   label={p.options.led.name}      desc={p.options.led.desc}      price={`${p.options.led.price}€`} />
          </SectionCard>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <PreviewBox title="Previzualizare 2D">
            <ShowerPreview2D dimensions={dims} glassType={glassType}
              doorType={doorTypeMap[enclosure] || "fixed"} treatment={treatment} includeLed={inclLed} />
          </PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label:"Suprafață sticlă", value:`${quote.area} m²` },
              { label:"Tip cabină", value:`${quote.encP}€` },
              { label:"Sticlă", value:`${quote.glassP}€` },
              quote.treatP > 0  && { label:"Tratament",   value:`+${quote.treatP}€`,  accent:true },
              quote.towelP > 0  && { label:"Port prosop", value:`+${quote.towelP}€`,  accent:true },
              quote.seatP  > 0  && { label:"Scaun",       value:`+${quote.seatP}€`,   accent:true },
              quote.ledP   > 0  && { label:"LED",         value:`+${quote.ledP}€`,    accent:true },
            ] : []}
          />
        </div>
      </main>
    </div>
  );
}
