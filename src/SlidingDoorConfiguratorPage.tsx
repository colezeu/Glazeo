// @ts-nocheck
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
      {/* Sina / track */}
      {!isInvizibila && (
        <rect x={x0 - 6} y={y0 - (hasSina ? 7 : 4)} width={dW + 12} height={hasSina ? 6 : 3}
          fill={hasSina ? "rgba(200,169,110,0.2)" : "rgba(200,169,110,0.35)"} rx="2" />
      )}
      {/* Podea */}
      {!isInvizibila && (
        <line x1={x0 - 12} y1={y0 + dH} x2={x0 + dW + 12} y2={y0 + dH} stroke="rgba(200,169,110,0.3)" strokeWidth="2" />
      )}
      {/* Sticla */}
      <rect x={x0} y={y0} width={dW} height={dH} fill="rgba(180,220,255,0.08)" stroke="rgba(180,220,255,0.4)" strokeWidth="1.5" />
      {/* Cărucioare */}
      {!isInvizibila && carucioare === "la-vedere-inox" && (
        <>
          <circle cx={x0 + dW * 0.3} cy={y0 - 1} r={8} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="2" />
          <circle cx={x0 + dW * 0.7} cy={y0 - 1} r={8} fill="none" stroke="rgba(200,200,200,0.5)" strokeWidth="2" />
          <line x1={x0 + dW * 0.3} y1={y0} x2={x0 + dW * 0.3} y2={y0 + 14} stroke="rgba(200,200,200,0.4)" strokeWidth="1.5" />
          <line x1={x0 + dW * 0.7} y1={y0} x2={x0 + dW * 0.7} y2={y0 + 14} stroke="rgba(200,200,200,0.4)" strokeWidth="1.5" />
        </>
      )}
      {/* Mâner */}
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

  const [typology, setTypology] = useState("canat-cu-rama");
  const [mount, setMount] = useState("tavan");
  const [carucioare, setCarucioare] = useState("la-vedere-inox");
  const [kit, setKit] = useState("perete-2m");
  const [dims, setDims] = useState({ width: "1.0", height: "2.1" });
  const [glass, setGlass] = useState("10mm-clar");

  // Options
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

  // Reset sub-selections when typology changes
  useEffect(() => {
    if (!product) return;
    const p = product as Record<string, unknown>;
    const typs = p.typologies as Record<string, Record<string, unknown>>;
    const ty = typs?.[typology];
    if (ty) {
      const mounts = ty.mountTypes as Record<string, unknown>;
      setMount(Object.keys(mounts)[0] || "tavan");
      const carts = ty.carucioareTypes as Record<string, Record<string, unknown>>;
      if (carts) {
        const firstCart = Object.keys(carts)[0];
        setCarucioare(firstCart);
        const kits = carts[firstCart]?.kits as Record<string, unknown>;
        setKit(Object.keys(kits || {})[0] || "");
      }
      const glasses = ty.glassTypes as Record<string, unknown>;
      setGlass(Object.keys(glasses || {})[0] || "10mm-clar");
    }
    // Reset options
    setInclManer(false); setInclInc(false); setInclAmortizor(false); setInclSincron(false); setInclProfilOrnamental(false);
  }, [typology, product]);

  // Restore saved project
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
          if (cfg.inclProfilOrnamental !== undefined) setInclProfilOrnamental(cfg.inclProfilOrnamental);
        }
      } catch (e) { /* ignore */ }
      localStorage.removeItem('loadProject');
    }
  }, []);

  const p = product as Record<string, unknown> | null;
  const typs = p?.typologies as Record<string, Record<string, unknown>> | undefined;
  const ty = typs?.[typology];
  const isInvizibila = typology === "feronerie-invizibila";
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
    } else {
      const carts = ty.carucioareTypes as Record<string, Record<string, unknown>>;
      const cart = carts?.[carucioare];
      const kits = cart?.kits as Record<string, { price: number }>;
      kitP = kits?.[kit]?.price || 0;
    }

    const glassTypes = ty.glassTypes as Record<string, { pricePerSqm: number }>;
    const glP = area * (glassTypes?.[glass]?.pricePerSqm || 0);

    const opts = ty.options as Record<string, { price?: number; pricePerMeter?: number }> | undefined;
    const manP = inclManer && opts?.maner ? (opts.maner.price || 0) : 0;
    const incP = inclInc && opts?.incuietoare ? (opts.incuietoare.price || 0) : 0;
    const amortP = inclAmortizor && opts?.amortizor ? (opts.amortizor.price || 0) : 0;
    const sincP = inclSincron && opts?.sincron ? (opts.sincron.price || 0) : 0;
    const profilP = inclProfilOrnamental && opts?.["profil-ornamental"]
      ? (opts["profil-ornamental"].pricePerMeter || 0) * h * 2 : 0; // ×2 fețe

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

  consttyp = typs || {};
  const mounts = ty?.mountTypes as Record<string, { name: string; desc: string }> | undefined;
  const carts = ty?.carucioareTypes as Record<string, { name: string; desc: string; kits: Record<string, { name: string; price: number }> }> | undefined;
  const currentCart = carts?.[carucioare];
  const currentKits = currentCart?.kits as Record<string, { name: string; price: number }> | undefined;
  const glassTypes = ty?.glassTypes as Record<string, { name: string; pricePerSqm: number }> | undefined;
  const options = ty?.options as Record<string, { name: string; price?: number; pricePerMeter?: number }> | undefined;
  const hasRama = typology === "canat-cu-rama";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Ușă Culisantă"
        config={{ dims, typology, mount, carucioare, kit, glass, inclManer, inclInc, inclAmortizor, inclSincron, inclProfilOrnamental }} />
      <ConfigHeader title="Configurator Uși Culisante" quote={quote} />
      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Tipologie">
            {Object.entries(typs).map(([k, t]) => (
              <OptionBtn key={k} selected={typology === k} onClick={() => setTypology(k)}
                label={(t as { name: string }).name} desc={(t as { desc: string }).desc} center />
            ))}
          </SectionCard>

          {!isInvizibila && carts && (
            <SectionCard num="02" label="Tip Cărucioare">
              {Object.entries(carts).map(([k, c]) => (
                <OptionBtn key={k} selected={carucioare === k} onClick={() => { setCarucioare(k); const cKits = c.kits; setKit(Object.keys(cKits)[0]); }}
                  label={c.name} desc={c.desc} center />
              ))}
            </SectionCard>
          )}

          {currentKits && !isInvizibila && (
            <SectionCard num="03" label="Kit Montaj">
              {Object.entries(currentKits).map(([k, d]) => (
                <OptionBtn key={k} selected={kit === k} onClick={() => setKit(k)} label={d.name}
                  price={d.price > 0 ? `${d.price}€` : "Standard"} />
              ))}
            </SectionCard>
          )}

          {glassTypes && (
            <SectionCard num={currentKits ? "04" : isInvizibila ? "02" : "03"} label="Sticlă 10mm ESG">
              {Object.entries(glassTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name}
                  price={`${d.pricePerSqm}€/m²`} />
              ))}
            </SectionCard>
          )}

          <SectionCard num={currentKits ? "05" : isInvizibila ? "03" : "04"} label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} step="0.05" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} step="0.05" />
            </div>
          </SectionCard>

          {options && Object.keys(options).length > 0 && (
            <SectionCard num="06" label="Accesorii">
              {options.maner && <ToggleOption checked={inclManer} onChange={setInclManer} label={options.maner.name} desc="" price={`${options.maner.price}€`} />}
              {options.incuietoare && <ToggleOption checked={inclInc} onChange={setInclInc} label={options.incuietoare.name} desc="" price={`${options.incuietoare.price}€`} />}
              {options.amortizor && <ToggleOption checked={inclAmortizor} onChange={setInclAmortizor} label={options.amortizor.name} desc="" price={`${options.amortizor.price}€`} />}
              {options.sincron && <ToggleOption checked={inclSincron} onChange={setInclSincron} label={options.sincron.name} desc="" price={`${options.sincron.price}€`} />}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox>
            <SlidingDoorPreview dims={dims} typology={typology} carucioare={carucioare} />
          </PreviewBox>
          <div className="glass-card" style={{ borderRadius: 20, padding: "16px" }}>
            <div style={{ color: "rgba(200,169,110,0.6)", fontSize: "0.72rem", marginBottom: 8 }}>Detaliu selecție</div>
            <img src={isInvizibila ? "/usi-culisante.png" : carucioare === "la-vedere-inox" ? "/culisante-la-vedere-inox.png"
              : kit === "1c-920" || kit === "1c-1420" ? "/culisante-1canat.png"
              : kit === "2c-1940" ? "/culisante-dubla.png"
              : kit?.includes("fix-mobil") ? "/culisante-fix-mobil.png"
              : kit?.includes("buzunar") ? "/culisante-buzunar.png"
              : "/usi-culisante.png"}
              alt="Detaliu" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)" }} />
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
          config={{ dims, typology, mount, carucioare, kit, glass, inclManer, inclInc, inclAmortizor, inclSincron, inclProfilOrnamental }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
