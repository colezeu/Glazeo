import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.tsx";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.js";

function SlidingDoorPreview({ dims, typology, carucioare }: { dims: { width: string; height: string }; typology: string; carucioare: string }) {
  const w = parseFloat(dims.width) || 1.2, h = parseFloat(dims.height) || 2.1;
  const isInvizibila = typology === "feronerie-invizibila";
  const W = 308, H = 200, M = 16;
  const sc = Math.min((W - M * 2) / w, (H - M * 2) / h);
  const dW = w * sc, dH = h * sc;
  const x0 = (W - dW) / 2, y0 = (H - dH) / 2;
  const hasSina = carucioare === "in-sina-aluminiu";

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {!isInvizibila && (
        <rect x={x0 - 6} y={y0 - (hasSina ? 7 : 4)} width={dW + 12} height={hasSina ? 6 : 3}
          fill={hasSina ? "rgba(200,169,110,0.2)" : "rgba(200,169,110,0.35)"} rx="2" />
      )}
      {!isInvizibila && (
        <line x1={x0 - 12} y1={y0 + dH} x2={x0 + dW + 12} y2={y0 + dH} stroke="rgba(200,169,110,0.3)" strokeWidth="2" />
      )}
      <rect x={x0} y={y0} width={dW} height={dH} fill="rgba(180,220,255,0.08)" stroke="rgba(180,220,255,0.4)" strokeWidth="1.5" />
      {!isInvizibila && carucioare === "la-vedere-inox" && (
        <>
          <circle cx={x0 + dW * 0.3} cy={y0 - 1} r={8} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="2" />
          <circle cx={x0 + dW * 0.7} cy={y0 - 1} r={8} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="2" />
          <line x1={x0 + dW * 0.3} y1={y0} x2={x0 + dW * 0.3} y2={y0 + 14} stroke="rgba(200,200,200,0.4)" strokeWidth="1.5" />
          <line x1={x0 + dW * 0.7} y1={y0} x2={x0 + dW * 0.7} y2={y0 + 14} stroke="rgba(200,200,200,0.4)" strokeWidth="1.5" />
        </>
      )}
      <rect x={x0 + dW * 0.15} y={y0 + dH / 2 - 18} width={4} height={36} rx="2" fill="rgba(200,169,110,0.6)" />
      <text x={W / 2} y={H - 6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">
        {dims.width}m × {dims.height}m
      </text>
    </svg>
  );
}

export default function SlidingDoorConfiguratorPage() {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);

  const [typology, setTypology] = useState("canat-fara-rama");
  const [carucioare, setCarucioare] = useState("la-vedere-inox");
  const [mount, setMount] = useState("perete");
  const [kit, setKit] = useState("perete-2m");
  const [dims, setDims] = useState({ width: "1.0", height: "2.1" });
  const [glass, setGlass] = useState("10mm-clar");

  const [inclManer, setInclManer] = useState(false);
  const [inclInc, setInclInc] = useState(false);
  const [inclAmortizor, setInclAmortizor] = useState(false);
  const [inclSincron, setInclSincron] = useState(false);
  const [inclProfilOrnamental, setInclProfilOrnamental] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState<Record<string, number | string> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetch(`/catalog.json?v=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.products["usi-culisante"]);
        setVatRate(d.vatRate);
      })
      .catch(() => setProduct(null));
  }, []);

  useEffect(() => { getUserMultiplier().then(m => setPriceMultiplier(m)); }, []);

  useEffect(() => {
    if (!product) return;
    const p = product as Record<string, unknown>;
    const typs = p.typologies as Record<string, Record<string, unknown>>;
    const ty = typs?.[typology];
    if (ty) {
      const carts = ty.carucioareTypes as Record<string, Record<string, unknown>>;
      if (carts) {
        const firstCart = Object.keys(carts)[0];
        setCarucioare(firstCart);
        const cart = carts[firstCart];
        const mountKits = cart?.mountKits as Record<string, Record<string, unknown>>;
        if (mountKits) {
          const firstMount = Object.keys(mountKits)[0];
          setMount(firstMount);
          const mKits = mountKits[firstMount];
          setKit(Object.keys(mKits || {})[0] || "");
        } else {
          const cKits = cart?.kits as Record<string, unknown>;
          setKit(Object.keys(cKits || {})[0] || "");
        }
      }
      const glasses = ty.glassTypes as Record<string, unknown>;
      setGlass(Object.keys(glasses || {})[0] || "10mm-clar");
    }
    setInclManer(false); setInclInc(false); setInclAmortizor(false); setInclSincron(false); setInclProfilOrnamental(false);
  }, [typology, product]);

  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'sliding' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.typology) setTypology(cfg.typology);
          if (cfg.mount) setMount(cfg.mount);
          if (cfg.carucioare) setCarucioare(cfg.carucioare);
          if (cfg.kit) setKit(cfg.kit);
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.inclManer !== undefined) setInclManer(cfg.inclManer);
          if (cfg.inclInc !== undefined) setInclInc(cfg.inclInc);
          if (cfg.inclAmortizor !== undefined) setInclAmortizor(cfg.inclAmortizor);
          if (cfg.inclSincron !== undefined) setInclSincron(cfg.inclSincron);
          if (cfg.nrCanate) setNrCanate(cfg.nrCanate);
        }
      } catch (e) { /* ignore */ }
      localStorage.removeItem('loadProject');
    }
  }, []);

  const p = product as Record<string, unknown> | null;
  const typs = p?.typologies as Record<string, Record<string, unknown>> | undefined;
  const ty = typs?.[typology];
  const isInvizibila = typology === "feronerie-invizibila";
  const isCanatCuRama = typology === "canat-cu-rama";
  const [nrCanate, setNrCanate] = useState(5);
  const isValid = !!(dims.width && dims.height && ty);

  const calculate = async () => {
    if (!p || !ty) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 200));
    const w = parseFloat(dims.width) || 0, h = parseFloat(dims.height) || 0;
    const area = w * h;

    let kitP = 0;
    if (isInvizibila) {
      kitP = (ty.price as number) || 349;
    } else if (isCanatCuRama) {
      kitP = ((ty.basePrice as number) || 2000) - ((5 - nrCanate) * ((ty.pricePerCanatMinus as number) || 110));
    } else {
      const carts = ty.carucioareTypes as Record<string, Record<string, unknown>>;
      const cart = carts?.[carucioare];
      const mountKits = cart?.mountKits as Record<string, Record<string, { price: number }>>;
      if (mountKits) {
        kitP = mountKits[mount]?.[kit]?.price || 0;
      } else {
        const cKits = cart?.kits as Record<string, { price: number }>;
        kitP = cKits?.[kit]?.price || 0;
      }
    }

    const glassTypes = ty.glassTypes as Record<string, { pricePerSqm: number }>;
    const glP = area * (glassTypes?.[glass]?.pricePerSqm || 0);

    const opts = ty.options as Record<string, { price?: number; pricePerMeter?: number }> | undefined;
    const manP = inclManer && opts?.maner ? (opts.maner.price || 0) : 0;
    const incP = inclInc && opts?.incuietoare ? (opts.incuietoare.price || 0) : 0;
    const amortP = inclAmortizor && opts?.amortizor ? (opts.amortizor.price || 0) : 0;
    const sincP = inclSincron && opts?.sincron ? (opts.sincron.price || 0) : 0;
    const profilP = inclProfilOrnamental && opts?.["profil-ornamental"]
      ? (opts["profil-ornamental"].pricePerMeter || 0) * h * 2 : 0;

    const raw = (p.basePrice as number || 0) + kitP + glP + manP + incP + amortP + sincP + profilP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);

    setQuote({
      area: area.toFixed(2),
      kitP: Math.round(kitP * priceMultiplier),
      glP: Math.round(glP * priceMultiplier),
      manP: Math.round(manP * priceMultiplier),
      incP: Math.round(incP * priceMultiplier),
      amortP: Math.round(amortP * priceMultiplier),
      sincP: Math.round(sincP * priceMultiplier),
      profilP: Math.round(profilP * priceMultiplier),
      subtotal: Math.round(subtotal * priceMultiplier),
      vat: Math.round(vat * priceMultiplier),
      total: Math.round(total * priceMultiplier),
    });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const carts = ty?.carucioareTypes as Record<string, { name: string; desc: string; kits?: Record<string, { name: string; price: number }>; mountKits?: Record<string, Record<string, { name: string; price: number }>> }> | undefined;
  const currentCart = carts?.[carucioare];
  const hasMountKits = !!currentCart?.mountKits;
  const currentKits = hasMountKits
    ? (currentCart?.mountKits as Record<string, Record<string, { name: string; price: number }>>)?.[mount]
    : (currentCart?.kits as Record<string, { name: string; price: number }>);
  const glassTypes = ty?.glassTypes as Record<string, { name: string; pricePerSqm: number }> | undefined;
  const options = ty?.options as Record<string, { name: string; price?: number; pricePerMeter?: number }> | undefined;
  const hasRama = typology === "canat-cu-rama";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Ușă Culisantă"
        config={{ dims, typology, mount, carucioare, kit, glass, nrCanate, inclManer, inclInc, inclAmortizor, inclSincron, inclProfilOrnamental }} />
      <ConfigHeader title="Configurator Uși Culisante" quote={quote} />
      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Tipologie">
            {Object.entries(typs || {}).map(([k, t]) => (
              <OptionBtn key={k} selected={typology === k} onClick={() => setTypology(k)}
                label={(t as { name: string }).name} desc={(t as { desc: string }).desc} center />
            ))}
          </SectionCard>

          {!isInvizibila && !isCanatCuRama && carts && (
            <SectionCard num="02" label="Tip Cărucioare">
              {Object.entries(carts).map(([k, c]) => (
                <OptionBtn key={k} selected={carucioare === k} onClick={() => {
                  setCarucioare(k);
                  const mk = c.mountKits;
                  if (mk) { setMount(Object.keys(mk)[0]); setKit(Object.keys(mk[Object.keys(mk)[0]])[0]); }
                  else if (c.kits) { setKit(Object.keys(c.kits)[0]); }
                }} label={c.name} desc={c.desc} center />
              ))}
            </SectionCard>
          )}

          {hasMountKits && (
            <SectionCard num="03" label="Prindere">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {Object.keys(currentCart?.mountKits || {}).map(m => (
                  <OptionBtn key={m} selected={mount === m} onClick={() => {
                    setMount(m);
                    const mk = (currentCart?.mountKits as Record<string, Record<string, unknown>>)?.[m];
                    setKit(Object.keys(mk || {})[0] || "");
                  }} label={m === "perete" ? "Perete" : "Tavan"} center />
                ))}
              </div>
            </SectionCard>
          )}

          {isCanatCuRama && (
            <>
              <SectionCard num="02" label="Număr Canate">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setNrCanate(n)}
                      style={{
                        padding: "10px 16px", borderRadius: 10, border: nrCanate === n ? "2px solid #c8a96e" : "2px solid rgba(200,169,110,0.25)",
                        background: nrCanate === n ? "rgba(200,169,110,0.12)" : "transparent",
                        color: nrCanate === n ? "#c8a96e" : "rgba(240,237,232,0.5)", cursor: "pointer", fontSize: "0.9rem"
                      }}>{n}</button>
                  ))}
                </div>
                {nrCanate < 5 && <div style={{ color: "rgba(200,169,110,0.5)", fontSize: "0.75rem", marginTop: 6 }}>−{(5 - nrCanate) * 110}€ reducere</div>}
              </SectionCard>
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", color: "rgba(200,169,110,0.7)", fontSize: "0.85rem", textAlign: "center" }}>
                ⚠️ Feronerie {2000 - (5 - nrCanate) * 110}€ + TVA — max 3.9m lățime, max 5 canate
              </div>
            </>
          )}

          {!isCanatCuRama && (<></>)}

          {currentKits && !isCanatCuRama && (
            <SectionCard num={hasMountKits ? "04" : isInvizibila ? "02" : "03"} label="Kit Montaj">
              {Object.entries(currentKits).map(([k, d]) => (
                <OptionBtn key={k} selected={kit === k} onClick={() => setKit(k)} label={d.name}
                  price={d.price > 0 ? `${d.price}€` : "Standard"} />
              ))}
            </SectionCard>
          )}

          {glassTypes && (
            <SectionCard num={currentKits ? "05" : isInvizibila ? "02" : "04"} label="Sticlă 10mm ESG">
              {Object.entries(glassTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name}
                  price={`${d.pricePerSqm}€/m²`} />
              ))}
            </SectionCard>
          )}

          <SectionCard num="06" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} step="0.05" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} step="0.05" />
            </div>
          </SectionCard>

          {options && Object.keys(options).length > 0 && (
            <SectionCard num="07" label="Accesorii">
              {options.maner && (
                <div>
                  <ToggleOption checked={inclManer} onChange={(v) => { setInclManer(v); if (v) setInclInc(false); }} label={options.maner.name} desc="" price={`${options.maner.price}€`} />
                  <div style={{ display: "flex", gap: 8, marginTop: 4, marginLeft: 12 }}>
                    <img src="/maner-msc7.png" alt="Mâner MSC7" style={{ width: 60, height: 36, objectFit: "contain", borderRadius: 8, filter: "invert(0.92)", opacity: 0.5 }} />
                  </div>
                </div>
              )}
              {options.incuietoare && (
                <div>
                  <ToggleOption checked={inclInc} onChange={(v) => { setInclInc(v); if (v) setInclManer(false); }} label={options.incuietoare.name} desc="" price={`${options.incuietoare.price}€`} />
                  <div style={{ display: "flex", gap: 8, marginTop: 4, marginLeft: 12 }}>
                    <img src="/incuietoare-dqs15.png" alt="Încuietoare DQS15" style={{ width: 60, height: 36, objectFit: "contain", borderRadius: 8, filter: "invert(0.92)", opacity: 0.5 }} />
                  </div>
                </div>
              )}
              {options.amortizor && carucioare !== "la-vedere-inox" && <ToggleOption checked={inclAmortizor} onChange={setInclAmortizor} label={options.amortizor.name} desc="" price={`${options.amortizor.price}€`} />}
              {options.sincron && carucioare !== "la-vedere-inox" && <ToggleOption checked={inclSincron} onChange={setInclSincron} label={options.sincron.name} desc="" price={`${options.sincron.price}€`} />}
              {options["profil-ornamental"] && hasRama && (
                <ToggleOption checked={inclProfilOrnamental} onChange={setInclProfilOrnamental} label={options["profil-ornamental"].name} desc="" price={`${options["profil-ornamental"].pricePerMeter}€/m`} />
              )}
            </SectionCard>
          )}

          {isInvizibila && (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", color: "rgba(200,169,110,0.7)", fontSize: "0.85rem", textAlign: "center" }}>
              Feronerie invizibilă — {ty.price || 349}€ (include kit complet)
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24, alignSelf: "start" }}>
          <PreviewBox>
            <SlidingDoorPreview dims={dims} typology={typology} carucioare={carucioare} />
          </PreviewBox>
          <div className="glass-card" style={{ borderRadius: 20, padding: "16px" }}>
            <div style={{ color: "rgba(200,169,110,0.6)", fontSize: "0.72rem", marginBottom: 8 }}>Detaliu selecție</div>
            {isCanatCuRama ? <img src="/canat-cu-rama.png" alt="Canat cu Ramă" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)" }} />
            : <img src={isInvizibila ? "/feronerie-invizibila.png" : carucioare === "la-vedere-inox" ? "/culisante-la-vedere-inox.png"
                : kit === "1c-920" || kit === "1c-1420" ? "/culisante-1canat.png"
                : kit === "2c-1940" ? "/culisante-dubla.png"
                : kit?.includes("fix-mobil") ? "/culisante-fix-mobil.png"
                : kit === "2fix-dubla-4m" ? "/culisante-2fix-dubla.png"
                : kit?.includes("buzunar") ? "/culisante-buzunar.png"
                : kit?.includes("2c-1fix") ? "/culisante-2c-1fix.png"
                : kit?.includes("3c-buzunar") ? "/culisante-3c-buzunar.png"
                : kit?.includes("3c-1fix") ? "/culisante-3c-1fix.png"
                : "/usi-culisante.png"} alt="Detaliu" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)" }} />}
            {inclManer && <img src="/maner-msc7.png" alt="Mâner MSC7" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)", marginTop: 8 }} />}
            {inclInc && <img src="/incuietoare-dqs15.png" alt="Încuietoare DQS15" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)", marginTop: 8 }} />}
            {!isCanatCuRama && (options?.maner || options?.incuietoare) && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {options?.maner && <img src="/maner-msc7.png" alt="Mâner" style={{ width: 56, height: 34, objectFit: "contain", borderRadius: 6, filter: "invert(0.92)", opacity: inclManer ? 1 : 0.35, border: inclManer ? "1px solid #c8a96e" : "none" }} />}
                {options?.incuietoare && <img src="/incuietoare-dqs15.png" alt="Încuietoare" style={{ width: 56, height: 34, objectFit: "contain", borderRadius: 6, filter: "invert(0.92)", opacity: inclInc ? 1 : 0.35, border: inclInc ? "1px solid #c8a96e" : "none" }} />}
              </div>
            )}
          </div>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              quote.kitP > 0 && { label: "Kit", value: `${quote.kitP}€`, accent: true },
              { label: "Sticlă", value: `${quote.glP}€` },
              quote.manP > 0 && { label: "Mâner", value: `+${quote.manP}€`, accent: true },
              quote.incP > 0 && { label: "Încuietoare", value: `+${quote.incP}€`, accent: true },
              quote.amortP > 0 && { label: "Amortizor", value: `+${quote.amortP}€`, accent: true },
              quote.sincP > 0 && { label: "Sincron", value: `+${quote.sincP}€`, accent: true },
              quote.profilP > 0 && { label: "Profile orn.", value: `+${quote.profilP}€`, accent: true },
            ].filter(Boolean) : []}
          />
          <button onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>
            💾 Salvează proiect
          </button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal productType="sliding"
          config={{ dims, typology, mount, carucioare, kit, glass, nrCanate, inclManer, inclInc, inclAmortizor, inclSincron, inclProfilOrnamental }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
