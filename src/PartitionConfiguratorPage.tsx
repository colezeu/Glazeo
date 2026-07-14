// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect, useRef } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal";

const FALLBACK = { 
  name: "Partiționări", 
  basePrice: 0, 
  systemTypes: {
    simpla: { name: "Simplă (profile perimetrale)", desc: "Profile U + L , garnituri UP2, sticlă securizată", 
      hardwareKit: {
        profilU: { pricePerM: 9.92 },
        profilL: { pricePerM: 12.20 },
        garnitura: { pricePerM: 0.97 },
        imbinare: { pricePerBuc: 13.81 }
      },
      panelWidth: { min: 700, max: 980 }
    },
    fono: { name: "Cu Izolație Fonică", desc: "Sistem acustic — preț la cerere", priceOnRequest: true }
  }, 
  glassTypes: {
    "10mm-clar": { name: "10mm ESG Clar", pricePerSqm: 65, desc: "Sticlă securizată 10mm, transparență maximă" },
    "10mm-satinat": { name: "10mm ESG Satinat", pricePerSqm: 105, desc: "Sticlă securizată 10mm, satinată pentru intimitate" }
  }, 
  options: {
    "usa-simpla": { name: "Ușă Simplă (amortizor hidraulic)", desc: "Ușă batantă full-glass, amortizor hidraulic, fără toc",
      finishes: { "inox-satinat": { name: "Inox Satinat", price: 294 }, "negru-mat": { name: "Negru Mat", price: 314 } }
    },
    "usa-toc": { name: "Ușă cu Toc Aluminiu", price: 371, desc: "Ușă batantă cu toc aluminiu perimetral, balamale reglabile" },
    "profil-policarbonat": { name: "Profil Policarbonat (între sticle)", code: "22.6P10.180.03", pricePerBuc: 12.34, desc: "Profil transparent 180° între panouri, L=3000mm" }
  } 
};

/** Calculează numărul de panouri și lățimea fiecăruia (mm) */
function calcPanels(widthM, panelMin, panelMax) {
  if (!widthM || widthM <= 0) return { count: 0, eachMm: 0 };
  const wMm = widthM * 1000;
  const count = Math.max(1, Math.ceil(wMm / panelMax));
  const eachMm = wMm / count;
  if (eachMm < panelMin && count > 1) return { count, eachMm: Math.round(eachMm), warning: true };
  return { count, eachMm: Math.round(eachMm), warning: eachMm < panelMin };
}

function PartitionPreview({ dims, system, glass, nrPanouri, tipUsa }) {
  const w = parseFloat(dims.width) || 3;
  const h = parseFloat(dims.height) || 2.4;
  const W = 308, H = 185, M = 20;
  const sc = Math.min((W - M * 2) / w, (H - M * 2) / h);
  const gW = w * sc, gH = h * sc, x0 = (W - gW) / 2, y0 = (H - gH) / 2;
  const isSatinat = glass === "10mm-satinat";
  const glF = isSatinat ? "rgba(200,200,220,0.25)" : "rgba(180,220,255,0.08)";
  const glS = isSatinat ? "rgba(200,200,220,0.45)" : "rgba(180,220,255,0.4)";
  const profColor = "rgba(200,169,110,0.5)";
  const cols = nrPanouri || 0;
  const hasUsa = tipUsa && tipUsa !== "none";
  const isToc = tipUsa === "usa-toc";
  const doorW = hasUsa ? Math.min(gW * 0.3, 60) : 0;
  const glassW = gW - doorW;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Perimetral profiles */}
      <rect x={x0-4} y={y0-4} width={gW+8} height={gH+8} fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="3" rx="1"/>
      <line x1={x0-8} y1={y0+gH} x2={x0+gW+8} y2={y0+gH} stroke="rgba(200,169,110,0.25)" strokeWidth="2"/>
      
      {/* Glass panels */}
      {cols > 0 && Array.from({length: cols}, (_, i) => {
        const px = x0 + i * (glassW / cols);
        const pw = glassW / cols;
        return (
          <g key={`p${i}`}>
            <rect x={px} y={y0} width={pw} height={gH} fill={glF} stroke={glS} strokeWidth="1.5"/>
            <text x={px + pw/2} y={y0 + gH/2} textAnchor="middle" fill="rgba(200,200,220,0.5)" fontSize="9" fontFamily="DM Sans">
              {i+1}
            </text>
          </g>
        );
      })}
      
      {/* Joint profiles between panels */}
      {cols > 1 && Array.from({length: cols-1}, (_, i) => (
        <line key={`j${i}`} x1={x0 + (i+1) * (glassW / cols)} y1={y0} x2={x0 + (i+1) * (glassW / cols)} y2={y0+gH} stroke={profColor} strokeWidth="2.5"/>
      ))}
      
      {/* Door */}
      {hasUsa && (
        <>
          <rect x={x0+glassW} y={y0} width={doorW} height={gH} fill={glF} stroke="rgba(200,169,110,0.6)" strokeWidth="2"/>
          {isToc && <rect x={x0+glassW} y={y0} width={doorW} height={gH} fill="none" stroke="rgba(200,169,110,0.5)" strokeWidth="3" rx="0"/>}
          <path d={`M ${x0+glassW} ${y0+gH} A ${doorW} ${doorW} 0 0 0 ${x0+glassW-doorW} ${y0+gH-doorW}`} fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="1" strokeDasharray="3,3"/>
          <rect x={x0+glassW-doorW*0.65} y={y0+gH/2-18} width={3} height={36} rx="1.5" fill="rgba(200,169,110,0.8)"/>
        </>
      )}
      
      <text x={W/2} y={H-5} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">
        {dims.width || "—"}m × {dims.height || "—"}m {cols > 0 ? `· ${cols} panou${cols>1?'ri':''}` : ''}
      </text>
    </svg>
  );
}

export default function PartitionConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width: "", height: "2.4" });
  const [system, setSystem] = useState("simpla");
  const [glass, setGlass] = useState("10mm-clar");
  const [tipUsa, setTipUsa] = useState("none");
  const [finishUsa, setFinishUsa] = useState("inox-satinat");
  const [inclPolicarbonat, setInclPolicarbonat] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.json())
      .then(d => {
        setProduct(d.products["partitionari"]);
        setVatRate(d.vatRate || 0.19);
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  // Restore saved project
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'partitionari' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.system) setSystem(cfg.system);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.tipUsa) setTipUsa(cfg.tipUsa);
          if (cfg.finishUsa) setFinishUsa(cfg.finishUsa);
          if (cfg.inclPolicarbonat !== undefined) setInclPolicarbonat(cfg.inclPolicarbonat);
          if (cfg.nrPanouri) setNrPanouri(cfg.nrPanouri);
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
  const sysData = p?.systemTypes?.[system];
  const isFono = system === "fono" || sysData?.priceOnRequest;

  // Panel calculation
  const pw = sysData?.panelWidth || { min: 700, max: 980 };
  const panels = calcPanels(parseFloat(dims.width), pw.min, pw.max);
  const nrPanouriDefault = panels.count;
  const [nrPanouri, setNrPanouri] = useState(nrPanouriDefault);
  
  // When width changes, keep user's choice if still valid, otherwise reset
  const prevWidth = useRef(dims.width);
  useEffect(() => {
    if (dims.width !== prevWidth.current) {
      prevWidth.current = dims.width;
      // Check if current nrPanouri is still in the valid range for the new width
      const w = parseFloat(dims.width) * 1000;
      const newMin = Math.max(1, Math.ceil(w / pw.max));
      const newMax = Math.min(6, Math.max(1, Math.floor(w / pw.min)));
      if (nrPanouri < newMin || nrPanouri > newMax) {
        setNrPanouri(nrPanouriDefault);
      }
    }
  }, [dims.width]);
  
  // Calculate actual panel width
  const wMm = (parseFloat(dims.width) || 0) * 1000;
  const eachMm = nrPanouri > 0 ? Math.round(wMm / nrPanouri) : 0;
  const isValidPanel = eachMm >= pw.min && eachMm <= pw.max;

  // Dimension limits
  const h = parseFloat(dims.height) || 0;
  const over3m = h > 3.0;
  const over4m = parseFloat(dims.width) > 4.0;
  const isValid = dims.width && parseFloat(dims.width) > 0 && !isFono && isValidPanel && !over3m;

  // Build panel options, ensuring current value is always included
  const minPanouri = Math.max(1, Math.ceil(wMm / pw.max));
  const maxPanouri = Math.min(6, Math.max(1, Math.floor(wMm / pw.min)));
  const panouriOptions = [];
  for (let i = minPanouri; i <= maxPanouri; i++) panouriOptions.push(i);
  // Ensure the currently selected count is in the list
  if (nrPanouri > 0 && !panouriOptions.includes(nrPanouri)) {
    panouriOptions.push(nrPanouri);
    panouriOptions.sort((a, b) => a - b);
  }

  const calculate = async () => {
    if (!p || isFono) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    
    const w = parseFloat(dims.width) || 0;
    const h = parseFloat(dims.height) || 0;
    const area = w * h;
    
    const qp = sysData?.hardwareKit;
    if (!qp) { setCalculating(false); return; }
    
    // Profile perimetrale — bare de 3m, se rotunjește la multiplu de 3
    const bara = 3; // metri per bară
    const mLUcumparat = Math.ceil(w / bara) * bara;  // metri cumpărați per profil U
    const mLLcumparat = Math.ceil(h / bara) * bara;  // metri cumpărați per profil L
    const costU = 2 * mLUcumparat * qp.profilU.pricePerM;  // 2 buc (sus+jos)
    const costL = 2 * mLLcumparat * qp.profilL.pricePerM;  // 2 buc (stânga+dreapta)
    const perimetru = 2*w + 2*h;
    
    // Garnituri UP2: 2m per metru liniar de profil (interior + exterior)
    const costGarnituri = 2 * perimetru * qp.garnitura.pricePerM;
    
    // Sticlă
    const costSticla = area * (p.glassTypes[glass]?.pricePerSqm || 0);
    
    // Profile îmbinare — bare de 3m (22.6P10.090.03)
    const nrImbinari = Math.max(0, nrPanouri - 1);
    const barePerImbinare = Math.ceil(h / bara);
    const costImbinare = nrImbinari * barePerImbinare * qp.imbinare.pricePerBuc;
    
    // Profil policarbonat (22.6P10.180.03) — alternativă la H-profile
    const costPolicarbonat = inclPolicarbonat 
      ? nrImbinari * barePerImbinare * (p?.options?.["profil-policarbonat"]?.pricePerBuc || 12.34)
      : 0;
    
    // Ușă — preț din finishes dacă există
    const optUsa = p?.options?.[tipUsa];
    const costUsa = tipUsa !== "none" 
      ? (optUsa?.finishes?.[finishUsa]?.price || optUsa?.price || 0) 
      : 0;
    
    const rawTotal = costU + costL + costGarnituri + costSticla + costImbinare + costPolicarbonat + costUsa;
    const costFeronerie = Math.round((costU + costL + costGarnituri + costImbinare + costPolicarbonat + costUsa) * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(Math.round(rawTotal * priceMultiplier), vatRate);
    
    setQuote({ 
      area: area.toFixed(2), 
      nrPanouri,
      eachMm,
      costFeronerie,
      costSticla: Math.round(costSticla * priceMultiplier), 
      // Detalii complete pentru email/export (nu se afișează clientului)
      costU: Math.round(costU * priceMultiplier),
      costL: Math.round(costL * priceMultiplier),
      costGarnituri: Math.round(costGarnituri * priceMultiplier),
      costImbinare: Math.round(costImbinare * priceMultiplier),
      costPolicarbonat: Math.round(costPolicarbonat * priceMultiplier),
      costUsa,
      tipUsa,
      // Info cumpărare (bare de 3m)
      mLUcumparat,
      mLLcumparat,
      bareImbinareTotal: nrImbinari * barePerImbinare,
      kitCodes: {
        profilU: qp.profilU,
        profilL: qp.profilL,
        garnitura: qp.garnitura,
        imbinare: qp.imbinare,
      },
      subtotal, vat, total 
    });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const optSimpla = p?.options?.["usa-simpla"];
  const optToc = p?.options?.["usa-toc"];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Partiționare" productType="partitionari" config={{ dims, system, glass, tipUsa, nrPanouri, inclPolicarbonat }} />
      <ConfigHeader title="Configurator Partiționări" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard num="01" label="Dimensiuni Partiție">
            <div className="config-dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime totală (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} placeholder="0.5 – 4.0" min="0.5" max="4.0" step="0.01" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} placeholder="Max 3.0" min="0.5" max="3.0" step="0.05" />
            </div>
            {over4m && (
              <div style={{ marginTop: 8, fontSize: "0.8rem", color: "rgba(255,180,100,0.85)", padding: "8px 12px", background: "rgba(255,180,100,0.08)", borderRadius: 8 }}>
                ⚠️ Peste 4m lățime — consultați fezabilitatea structurală. Maxim 6 panouri.
              </div>
            )}
            {over3m && (
              <div style={{ marginTop: 8, fontSize: "0.8rem", color: "rgba(255,180,100,0.85)", padding: "8px 12px", background: "rgba(255,180,100,0.08)", borderRadius: 8 }}>
                ⚠️ Peste 3.0m înălțime necesită sticlă 12mm ESG. Solicitați ofertă personalizată.
              </div>
            )}
            {nrPanouriDefault > 0 && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.85rem", color: "rgba(200,169,110,0.7)" }}>Panouri:</span>
                <select 
                  value={nrPanouri} 
                  onChange={e => setNrPanouri(Number(e.target.value))}
                  className="input-field"
                  style={{ padding: "6px 12px", fontSize: "0.85rem", width: "auto" }}
                >
                  {panouriOptions.map(n => (
                    <option key={n} value={n}>{n} panou{n>1?'ri':''}</option>
                  ))}
                </select>
                <span style={{ fontSize: "0.8rem", color: isValidPanel ? "rgba(100,200,120,0.6)" : "rgba(255,180,100,0.85)" }}>
                  × {eachMm}mm
                </span>
                {!isValidPanel && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,180,100,0.8)", padding: "4px 8px", background: "rgba(255,180,100,0.1)", borderRadius: 6 }}>
                    ⚠ {eachMm < pw.min ? `Min ${pw.min}mm` : `Max ${pw.max}mm`} — alegeți alt număr de panouri
                  </span>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sistem">
            {Object.entries(p.systemTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={system === k} onClick={() => setSystem(k)} label={d.name} desc={d.desc} price={d.priceOnRequest ? "Preț la cerere" : ""} />
            ))}
          </SectionCard>

          {!isFono && (
            <>
              <SectionCard num="03" label="Tip Sticlă">
                {Object.entries(p.glassTypes).map(([k, d]) => (
                  <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
                ))}
              </SectionCard>

              <SectionCard num="04" label="Ușă (opțional)">
                <ToggleOption checked={tipUsa === "none"} onChange={v => v && setTipUsa("none")} label="Fără ușă" desc="Doar panouri fixe" price="" />
                <ToggleOption checked={tipUsa === "usa-simpla"} onChange={v => v && setTipUsa("usa-simpla")} label={optSimpla?.name || "Ușă Simplă"} desc={optSimpla?.desc || ""} price={`de la ${optSimpla?.finishes?.["inox-satinat"]?.price || 0}€`} />
                {tipUsa === "usa-simpla" && optSimpla?.finishes && (
                  <div style={{ marginLeft: 24, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: "0.72rem", color: "rgba(200,169,110,0.5)", marginBottom: 2 }}>Finisaj:</div>
                    {optSimpla.finishes["inox-satinat"] && (
                      <OptionBtn key="inox" selected={finishUsa === "inox-satinat"} onClick={() => setFinishUsa("inox-satinat")} label={optSimpla.finishes["inox-satinat"].name} desc="" price={`${optSimpla.finishes["inox-satinat"].price}€`} />
                    )}
                    {optSimpla.finishes["negru-mat"] && (
                      <OptionBtn key="negru" selected={finishUsa === "negru-mat"} onClick={() => setFinishUsa("negru-mat")} label={optSimpla.finishes["negru-mat"].name} desc="" price={`${optSimpla.finishes["negru-mat"].price}€`} />
                    )}
                  </div>
                )}
                <ToggleOption checked={tipUsa === "usa-toc"} onChange={v => v && setTipUsa("usa-toc")} label={optToc?.name || "Ușă cu Toc"} desc={optToc?.desc || ""} price={`${optToc?.price || 0}€`} />
              </SectionCard>

              {nrPanouri > 1 && (
                <SectionCard num="05" label="Accesorii">
                  <ToggleOption 
                    checked={inclPolicarbonat} 
                    onChange={setInclPolicarbonat} 
                    label={p?.options?.["profil-policarbonat"]?.name || "Profil Policarbonat"} 
                    desc={p?.options?.["profil-policarbonat"]?.desc || "Profil transparent între panouri"} 
                    price={`${p?.options?.["profil-policarbonat"]?.pricePerBuc || 12.34}€/bară`} 
                  />
                </SectionCard>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox>
            <PartitionPreview dims={dims} system={system} glass={glass} nrPanouri={nrPanouri} tipUsa={tipUsa} />
            {dims.width && dims.height && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.8rem", color: "rgba(200,169,110,0.6)" }}>
                {dims.width}m × {dims.height}m {nrPanouri > 0 ? `· ${nrPanouri} panou${nrPanouri>1?'ri':''}` : ''}
              </div>
            )}
          </PreviewBox>

          {isFono ? (
            <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <p style={{ color: "rgba(200,169,110,0.8)", margin: 0 }}>Preț la cerere</p>
              <p style={{ color: "rgba(200,200,220,0.5)", fontSize: "0.85rem", margin: "8px 0 0" }}>Solicitați oferta personalizată</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary mt-4"
                style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)", padding: "10px 24px", borderRadius: 8, border: "none", color: "#0f1117", fontWeight: 600, cursor: "pointer" }}
              >
                Solicitați Ofertă
              </button>
            </div>
          ) : (
            <>
              {/* Detail panel — profile images */}
              <div className="glass-card" style={{ borderRadius: 20, padding: "20px" }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(200,169,110,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                  Detaliu Profile
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <img src="/profil-u-perimetral.png" alt="Profil U" 
                      style={{ width: "100%", maxHeight: 80, objectFit: "contain", filter: "invert(0.92)", borderRadius: 8, padding: 4 }} />
                    <div style={{ fontSize: "0.65rem", color: "rgba(240,237,232,0.4)", marginTop: 4 }}>Profil U</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <img src="/profil-l-cu-capac.png" alt="Profil L cu capac" 
                      style={{ width: "100%", maxHeight: 80, objectFit: "contain", filter: "invert(0.92)", borderRadius: 8, padding: 4 }} />
                    <div style={{ fontSize: "0.65rem", color: "rgba(240,237,232,0.4)", marginTop: 4 }}>Profil L cu capac</div>
                  </div>
                </div>
                {inclPolicarbonat && (
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <img src="/profil-policarbonat.png" alt="Profil Policarbonat" 
                      style={{ width: "100%", maxHeight: 80, objectFit: "contain", filter: "invert(0.92)", borderRadius: 8, padding: 4 }} />
                    <div style={{ fontSize: "0.65rem", color: "rgba(200,169,110,0.5)", marginTop: 4 }}>Profil Policarbonat 180°</div>
                  </div>
                )}
              </div>

              <QuoteSidebar 
                quote={quote} 
                isFormValid={isValid} 
                calculating={calculating}
                onCalculate={calculate} 
                onReset={() => setQuote(null)} 
                onSolicita={() => setShowModal(true)}
                lines={quote ? [
                  { label: "Suprafață", value: `${quote.area} m²` },
                  { label: `${quote.nrPanouri} panou${quote.nrPanouri>1?'ri':''} × ${quote.eachMm}mm`, value: "" },
                  { label: "Feronerie", value: `${quote.costFeronerie}€` },
                  { label: "Sticlă", value: `${quote.costSticla}€` },
                ] : []}
              />

              <button
                onClick={() => setShowSaveModal(true)}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
                style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}
              >
                💾 Salvează proiect
              </button>
            </>
          )}
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal
          productType="partitionari"
          config={{ dims, system, glass, tipUsa, finishUsa, nrPanouri, inclPolicarbonat }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
