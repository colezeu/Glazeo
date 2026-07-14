// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.tsx";
import { getUserMultiplier } from "./lib/user";
import { useAutoSave } from "./useAutoSave";
import ResumeBanner from "./components/ResumeBanner";
import { clearSavedConfig } from "./usePersistedConfig";
import QuoteModal from "./QuoteModal.js";

const FALLBACK = {
  name: "Uși Batante",
  basePrice: 0,
  doorTypes: {
    "full-glass-amortizor": {
      name: "Full Glass cu Amortizor Hidraulic",
      variants: { "fara-luminator": { name: "Fără Luminator", price: 176 }, "cu-luminator": { name: "Cu Luminator", price: 252 } },
      glassTypes: { "10mm-clar": { name: "Securit 10mm Clar", pricePerSqm: 86 }, "10mm-satin": { name: "Securit 10mm Satinată", pricePerSqm: 140 } },
      options: { maner: { name: "Mâner Inox", price: 55 } }
    },
    "full-glass-toc-zidarie": {
      name: "Full Glass cu Toc – Zidărie",
      variants: { "tip-l": { name: "Tip L (spalet)", price: 265 }, "tip-z": { name: "Tip Z (colț)", price: 631 } },
      glassTypes: { "10mm-clar": { name: "Securit 10mm Clar", pricePerSqm: 86 }, "10mm-satin": { name: "Securit 10mm Satinată", pricePerSqm: 140 } },
      options: { maner: { name: "Mâner Inox", price: 55 } }
    }
  }
};

function SwingDoorPreview({ dims, doorType, glass, variant }: { dims: { width: string; height: string }; doorType: string; glass: string; variant: string }) {
  const w = parseFloat(dims.width) || 1, h = parseFloat(dims.height) || 2.1;
  const W = 308, H = 200, M = 20;
  const isLuminator = variant === "cu-luminator";
  // Cu luminator: 25% luminator sus, 75% canat jos
  const lumH = isLuminator ? h * 0.25 : 0;
  const doorH = isLuminator ? h * 0.70 : h; // 5% gap
  const totalH = isLuminator ? lumH + doorH + h * 0.05 : h;
  const sc = Math.min((W * 0.45) / w, (H - M * 2) / totalH);
  const dW = w * sc, dH = totalH * sc, x0 = (W - dW) / 2, y0 = (H - dH) / 2;
  const isSatin = glass === "10mm-satin";
  const isParsol = glass?.includes("parsol");
  const glF = isSatin ? "rgba(200,200,220,0.28)" : isParsol ? "rgba(160,140,100,0.2)" : "rgba(180,220,255,0.1)";
  const glS = isSatin ? "rgba(200,200,220,0.5)" : isParsol ? "rgba(160,140,100,0.5)" : "rgba(180,220,255,0.45)";
  const hasToc = doorType?.includes("toc");
  const frameW = hasToc ? 6 : 3;
  const isAmortizor = doorType === "full-glass-amortizor";

  // Dimensiuni scalate
  const lumScaled = isLuminator ? lumH * sc : 0;
  const gapScaled = isLuminator ? h * 0.05 * sc : 0;
  const doorScaled = doorH * sc;
  const lumY = y0;
  const doorY = y0 + lumScaled + gapScaled;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Pardosea */}
      <line x1={x0 - 20} y1={y0 + dH} x2={x0 + dW + 20} y2={y0 + dH} stroke="rgba(200,169,110,0.4)" strokeWidth="2" />

      {/* Cadru exterior (toc) */}
      <rect x={x0} y={y0} width={dW} height={dH} fill="none" stroke="rgba(200,169,110,0.6)" strokeWidth={frameW} />

      {isLuminator && (
        <>
          {/* Luminator - panou superior */}
          <rect x={x0 + frameW / 2} y={lumY + frameW / 2} width={dW - frameW} height={lumScaled - frameW}
            fill="rgba(180,220,255,0.06)" stroke="rgba(180,220,255,0.35)" strokeWidth="1" />
          {/* Linie separare luminator */}
          <line x1={x0} y1={doorY} x2={x0 + dW} y2={doorY} stroke="rgba(200,169,110,0.35)" strokeWidth="1.5" />
        </>
      )}

      {/* Canat principal */}
      <rect x={x0 + frameW / 2} y={doorY + frameW / 2} width={dW - frameW} height={doorScaled - frameW}
        fill={glF} stroke={glS} strokeWidth="1" />

      {/* Balama / pivot */}
      {isAmortizor ? (
        <>
          {/* Pivoturi la colțuri — stânga sus + stânga jos */}
          <circle cx={x0 + frameW / 2} cy={doorY + frameW} r={4} fill="rgba(200,169,110,0.5)" stroke="rgba(200,169,110,0.8)" strokeWidth="1.5" />
          <circle cx={x0 + frameW / 2} cy={doorY + doorScaled - frameW} r={4} fill="rgba(200,169,110,0.5)" stroke="rgba(200,169,110,0.8)" strokeWidth="1.5" />
        </>
      ) : (
        <>
          {/* Balama stânga (doar la toc) */}
          <rect x={x0 - 3} y={doorY + doorScaled * 0.25} width={6} height={14} rx="1" fill="rgba(200,169,110,0.6)" />
          <rect x={x0 - 3} y={doorY + doorScaled * 0.65} width={6} height={14} rx="1" fill="rgba(200,169,110,0.6)" />
        </>
      )}

      {/* Mâner dreapta */}
      <rect x={x0 + dW - 3} y={doorY + doorScaled / 2 - 18} width={4} height={36} rx="2" fill="rgba(200,169,110,0.8)" />

      <text x={x0 + dW / 2} y={H - 6} textAnchor="middle" fill="rgba(200,169,110,0.6)" fontSize="8" fontFamily="DM Sans">{dims.width}m × {dims.height}m</text>
    </svg>
  );
}

export default function SwingDoorConfiguratorPage() {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);

  const [doorType, setDoorType] = useState("full-glass-amortizor");
  const [variant, setVariant] = useState("fara-luminator");
  const [dims, setDims] = useState({ width: "1.0", height: "2.1" });
  const [glass, setGlass] = useState("10mm-clar");
  const [inclManer, setInclManer] = useState(true);

  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState<Record<string, number | string> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useAutoSave("swingdoor", { doorType, variant, dims, glass, inclManer });

  const resetAll = () => { clearSavedConfig("swingdoor"); window.location.reload(); };

  useEffect(() => {
    fetch(`/catalog.json?v=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.products["usi-batante"]);
        setVatRate(d.vatRate);
        // Init defaults
        const dt = d.products["usi-batante"].doorTypes;
        const first = Object.keys(dt)[0];
        setDoorType(first);
        const firstV = Object.keys(dt[first].variants)[0];
        setVariant(firstV);
        const firstG = Object.keys(dt[first].glassTypes)[0] || "10mm-clar";
        setGlass(firstG);
      })
      .catch(() => {
        setProduct(FALLBACK);
        setVatRate(0.21);
      });
  }, []);

  useEffect(() => { getUserMultiplier().then(m => setPriceMultiplier(m)); }, []);

  // Reset variant when doorType changes
  useEffect(() => {
    if (!product) return;
    const p = product as Record<string, unknown>;
    const dts = p.doorTypes as Record<string, Record<string, unknown>>;
    if (dts?.[doorType]) {
      const vars = Object.keys(dts[doorType].variants as Record<string, unknown>);
      setVariant(vars[0] || "");
      const glassTypes = dts[doorType].glassTypes as Record<string, unknown>;
      const gk = Object.keys(glassTypes || {});
      setGlass(gk[0] || "10mm-clar");
    }
  }, [doorType, product]);

  // Restore saved project
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'swingdoor' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.doorType) setDoorType(cfg.doorType);
          if (cfg.variant) setVariant(cfg.variant);
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.inclManer !== undefined) setInclManer(cfg.inclManer);
        }
      } catch (e) { /* ignore */ }
      localStorage.removeItem('loadProject');
    }
  }, []);

  const p = product as Record<string, unknown> | null;
  const dt = (p?.doorTypes as Record<string, Record<string, unknown>>)?.[doorType];
  const isValid = !!(dims.width && dims.height && dt);

  const calculate = async () => {
    if (!p || !dt) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 200));
    const w = parseFloat(dims.width) || 0, h = parseFloat(dims.height) || 0;
    const area = w * h;

    const vars = dt.variants as Record<string, { price: number }>;
    const variantP = vars?.[variant]?.price || 0;
    const glassTypes = dt.glassTypes as Record<string, { pricePerSqm: number }>;
    const glP = area * (glassTypes?.[glass]?.pricePerSqm || 0);
    const opts = dt.options as Record<string, { price: number }> | undefined;
    const manP = inclManer && opts?.maner ? opts.maner.price : 0;

    const raw = (p.basePrice as number || 0) + variantP + glP + manP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);
    const final = Math.round(raw * priceMultiplier);
    setQuote({
      area: area.toFixed(2),
      variantP: Math.round(variantP * priceMultiplier),
      glP: Math.round(glP * priceMultiplier),
      manP: Math.round(manP * priceMultiplier),
      subtotal: Math.round(subtotal * priceMultiplier),
      vat: Math.round(vat * priceMultiplier),
      total: Math.round(total * priceMultiplier),
      pretFinal: final,
    });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  const doorTypes = p.doorTypes as Record<string, { name: string; desc?: string }>;
  const variants = dt?.variants as Record<string, { name: string; price: number; desc?: string }> | undefined;
  const glassTypes = dt?.glassTypes as Record<string, { name: string; pricePerSqm: number }> | undefined;
  const options = dt?.options as Record<string, { name: string; price: number }> | undefined;
  const isFono = doorType === "fono";
  const isSticla = doorType === "full-glass-toc-sticla";

  // Detail image per doorType + variant
  const DETAIL_IMG: Record<string, string> = {
    "full-glass-amortizor": "/usi-batante-amortizor.jpg",
    "full-glass-toc-zidarie-tip-l": "/usi-batante-toc-l.png",
    "full-glass-toc-zidarie-tip-z": "/usi-batante-toc-z.png",
    "full-glass-toc-sticla": "/usi-batante-toc-sticla.png",
    "fono": "/usi-batante-fonica.jpg",
  };
  const detailImg = DETAIL_IMG[`${doorType}-${variant}`] || DETAIL_IMG[doorType] || "/usi-batante.png";

  return (
    <div style={{minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <ResumeBanner storageKey="swingdoor" onDismiss={resetAll} />
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Ușă Batantă" productType="swingdoor"
        config={{ dims, doorType, variant, glass, inclManer }} />
      <ConfigHeader title="Configurator Uși Batante" quote={quote} />
      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard num="01" label="Tip Ușă">
            {Object.entries(doorTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={doorType === k} onClick={() => setDoorType(k)} label={d.name} desc={d.desc} center />
            ))}
          </SectionCard>

          {variants && !isFono && (
            <SectionCard num="02" label="Configurație">
              {Object.entries(variants).map(([k, d]) => (
                <OptionBtn key={k} selected={variant === k} onClick={() => setVariant(k)} label={d.name} desc={d.desc}
                  price={d.price > 0 ? `${d.price}€` : "Standard"} />
              ))}
            </SectionCard>
          )}

          {glassTypes && Object.keys(glassTypes).length > 0 && (
            <SectionCard num={variants ? "03" : "02"} label="Sticlă 10mm">
              {Object.entries(glassTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name}
                  price={`${d.pricePerSqm}€/m²`} />
              ))}
            </SectionCard>
          )}

          <SectionCard num={variants ? "04" : "03"} label="Dimensiuni">
            <div className="config-dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} step="0.05" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} step="0.05" />
            </div>
          </SectionCard>

          {options && Object.keys(options).length > 0 && (
            <SectionCard num="05" label="Accesorii">
              {options.maner && (
                <ToggleOption checked={inclManer} onChange={setInclManer} label={options.maner.name} desc="" price={`${options.maner.price}€`} />
              )}
            </SectionCard>
          )}

          {isFono && (
            <SectionCard num="02" label="Preț">
              <div style={{ padding: 16, color: "rgba(200,169,110,0.7)", fontSize: "0.9rem", textAlign: "center" }}>
                Preț la cerere. Contactează-ne pentru ofertă personalizată.
              </div>
            </SectionCard>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24, alignSelf: "start" }}>
          <PreviewBox>
            <SwingDoorPreview dims={dims} doorType={doorType} glass={glass} variant={variant} />
          </PreviewBox>
          <div className="glass-card" style={{ borderRadius: 20, padding: "16px" }}>
            <div style={{ color: "rgba(200,169,110,0.6)", fontSize: "0.72rem", marginBottom: 8 }}>Detaliu selecție</div>
            <img src={detailImg} alt="Uși Batante" style={{ width: "100%", borderRadius: 12, filter: "invert(0.92)" }} />
            {options?.maner && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <img src="/maner-msc7.png" alt="Mâner" style={{ width: 56, height: 34, objectFit: "contain", borderRadius: 6, filter: "invert(0.92)", opacity: inclManer ? 1 : 0.4, border: inclManer ? "1px solid #c8a96e" : "none" }} />
                <span style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.65rem", alignSelf: "center" }}>Mâner Inox</span>
              </div>
            )}
          </div>
          <QuoteSidebar quote={quote} isFormValid={isValid && !isFono} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Sticlă", value: `${quote.glP}€` },
              quote.variantP > 0 && { label: "Feronerie", value: `${quote.variantP}€`, accent: true },
              quote.manP > 0 && { label: "Mâner", value: `+${quote.manP}€`, accent: true },
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
        <SaveProjectModal productType="swingdoor"
          config={{ dims, doorType, variant, glass, inclManer }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
