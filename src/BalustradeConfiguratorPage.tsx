import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, ValidatedNumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote } from "./ConfiguratorShared";
import { validateForm } from "./validation";
import { usePersistedConfig, getShareableUrl } from "./usePersistedConfig";
import QuoteModal from "./QuoteModal";
import BalustradePreview3D from "./BalustradePreview2D";
import SaveProjectModal from "./components/SaveProjectModal";
import { Share2, Check } from "lucide-react";
import { getUserMultiplier } from "./lib/user";

/** Mini SVG cross-section for profile shapes (L, U, Y) */
function ProfileShapeSVG({ shape }: { shape: string }) {
  const w = 60, h = 50, m = 6;
  const gold = "#c8a96e";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", margin: "0 auto" }}>
      {/* Glass panel (vertical line) */}
      <rect x={w/2-1.5} y={m} width={3} height={h-m*2} fill="rgba(180,220,255,0.4)" rx={1} />
      {shape === "U" && (
        <>
          <rect x={w/2-8} y={h-m-5} width={16} height={5} fill={gold} rx={1} opacity={0.9} />
          <rect x={w/2-8} y={h-m-5} width={4} height={h-m-5} fill={gold} rx={0.5} opacity={0.6} />
          <rect x={w/2+4} y={h-m-5} width={4} height={h-m-5} fill={gold} rx={0.5} opacity={0.6} />
        </>
      )}
      {shape === "L" && (
        <>
          <rect x={w/2-8} y={h-m-5} width={16} height={5} fill={gold} rx={1} opacity={0.9} />
          <rect x={w/2-8} y={h-m-5} width={4} height={h-m-5} fill={gold} rx={0.5} opacity={0.6} />
        </>
      )}
      {shape === "Y" && (
        <>
          <rect x={w/2-8} y={h-m-5} width={16} height={5} fill={gold} rx={1} opacity={0.9} />
          <polygon points={`${w/2-8},${h-m-5} ${w/2-4},${m+4} ${w/2-0},${h-m-5}`} fill={gold} opacity={0.5} />
          <polygon points={`${w/2+8},${h-m-5} ${w/2+4},${m+4} ${w/2},${h-m-5}`} fill={gold} opacity={0.5} />
        </>
      )}
      {/* Ground line */}
      <line x1={m} y1={h-m} x2={w-m} y2={h-m} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
    </svg>
  );
}

/** Mini SVG for handrail cross-sections */
function HandrailShapeSVG({ type }: { type: string }) {
  const w = 60, h = 50;
  const gold = "#c8a96e";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", margin: "0 auto" }}>
      {type === "none" && (
        <text x={w/2} y={h/2+4} textAnchor="middle" fill="rgba(240,237,232,0.2)" fontSize={12}>—</text>
      )}
      {type.includes("structurala") && (
        <rect x={8} y={h/2-7} width={w-16} height={10} rx={1} fill={gold} opacity={0.8} stroke={gold} strokeWidth={1} />
      )}
      {type.includes("rotunda") && (
        <>
          <rect x={8} y={h/2-1} width={w-16} height={6} rx={3} fill={gold} opacity={0.85} />
          <circle cx={14} cy={h/2+2} r={2.5} fill={gold} opacity={0.5} />
          <circle cx={w-14} cy={h/2+2} r={2.5} fill={gold} opacity={0.5} />
        </>
      )}
      {type.includes("patrata") && (
        <rect x={10} y={h/2-5} width={w-20} height={10} rx={1} fill={gold} opacity={0.8} stroke={gold} strokeWidth={1} />
      )}
      {type.includes("slim") && (
        <rect x={10} y={h/2-3} width={w-20} height={4} rx={1} fill={gold} opacity={0.7} />
      )}
      {/* Support posts */}
      <rect x={16} y={h/2+7} width={2.5} height={h/2-10} rx={1} fill={gold} opacity={0.3} />
      <rect x={w-18} y={h/2+7} width={2.5} height={h/2-10} rx={1} fill={gold} opacity={0.3} />
      {/* Glass hint */}
      <rect x={w/2-1} y={10} width={2} height={h/2-8} fill="rgba(180,220,255,0.2)" rx={0.5} />
    </svg>
  );
}

export default function BalustradeConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [config, setConfig] = usePersistedConfig("balustrade", {
    length: "", height: "0.9", glassShape: "dreapta", hardware: "butoni",
    profileShape: "U", glassType: "662mm", handrail: "none", includeLed: false,
  });
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { length, height, glassShape, hardware, profileShape, glassType, handrail, includeLed } = config;

  // Încarcă multiplicatorul de preț al utilizatorului
  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  // Încarcă configurație salvată din Dashboard
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'balustrade' && parsed.config) {
          setConfig(parsed.config);
        }
      } catch (e) {}
      localStorage.removeItem('loadProject');
    }
  }, []);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => {
        if (!r.ok) throw new Error("Catalog not found");
        return r.json();
      })
      .then(d => {
        const p = d.products.balustrade;
        if (!p) throw new Error("Balustrade data missing");
        setProduct(p);
        setVatRate(d.vatRate || 0.21);
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return <ErrorBanner message="Nu s-a putut încărca catalogul." onRetry={() => window.location.reload()} onBack />;
  }
  if (!product) return <PageLoader />;

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

  const skirt = hardware === "butoni" ? 0.35 : (hardware === "profil-pardoseala" && profileShape === "Y") ? 0.10 : 0;

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
    const h = parseFloat(height) || 0;
    const panelCount = Math.ceil(len / 1.1);
    const area = len * (h + skirt);
    const hwPrice = len * (p.hardwareTypes[hardware]?.pricePerMeter || 0);
    const profExtra = showProfileShape ? len * (p.profileShapes[profileShape]?.pricePerMeter || 0) : 0;
    const glassPrice = area * (p.glassTypes[glassType]?.pricePerSqm || 0);
    const taxaForma = glassShape === "forma" ? (p.glassShapes.forma?.taxaForma || 0) * panelCount : 0;
    const handrailP = handrail !== "none" ? len * (p.options[handrail]?.pricePerMeter || 0) : 0;
    const ledP = normalizedIncludeLed ? (p.options.led?.price || 0) : 0;

    const raw = p.basePrice + hwPrice + profExtra + glassPrice + taxaForma + handrailP + ledP;
    const adjustedRaw = raw * priceMultiplier;
    const { subtotal, vat, total } = calcQuote(adjustedRaw, vatRate);

    setQuote({ area: area.toFixed(2), hwPrice: Math.round(hwPrice + profExtra), glassPrice: Math.round(glassPrice), taxaForma: Math.round(taxaForma), handrailP: Math.round(handrailP), ledP, subtotal, vat, total });
    setCalculating(false);
  };

  const mountingType = hardware === "butoni" ? "clips" : hardware === "mini-montanti" ? "mini-montanti" : hardware === "profil-pardoseala" ? "embedded" : "profile";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Balustradă Sticlă" config={config} />
      <ConfigHeader title="Configurator Balustrade" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div data-field="width">
                <ValidatedNumberInput label="Lungime (m)" value={length} onChange={v => { update("length", v); setFormTouched(true); }} placeholder="Ex: 5.0" fieldName="width" helperText="Min: 0.1m — Max: 20m" />
              </div>
              <div data-field="height">
                <ValidatedNumberInput label="Înălțime (m)" value={height} onChange={v => { update("height", v); setFormTouched(true); }} placeholder="Ex: 0.9" step="0.05" fieldName="height" helperText="Min: 0.1m — Max: 6m" />
              </div>
            </div>
            {formTouched && !isValid && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
                Vă rugăm completați corect dimensiunile înainte de a calcula.
              </div>
            )}
          </SectionCard>

          <SectionCard num="02" label="Tip Sticlă">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(p.glassShapes).map(([k, d]) => (
                <OptionBtn key={k} selected={glassShape === k} onClick={() => update("glassShape", k)} label={d.name} desc={d.desc} />
              ))}
            </div>
            {glassShape === "forma" && p.glassShapes.forma?.taxaForma > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", fontSize: "0.8rem", color: "rgba(240,237,232,0.6)" }}>
                Include taxă de formă: <strong style={{ color: "#c8a96e" }}>{p.glassShapes.forma.taxaForma}€/panou</strong>
              </div>
            )}
          </SectionCard>

          <SectionCard num="03" label="Feronerie / Sistem Prindere">
            {Object.entries(p.hardwareTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={hardware === k} onClick={() => update("hardware", k)} label={d.name} desc={d.desc} price={`${d.pricePerMeter}€/m`} />
            ))}
            {showProfileShape && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.4)", marginBottom: 8 }}>Formă profil:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {Object.entries(p.profileShapes).map(([k, d]) => (
                    <OptionBtn key={k} selected={profileShape === k} onClick={() => update("profileShape", k)} label={d.name} price={d.pricePerMeter > 0 ? `+${d.pricePerMeter}€/m` : "Inclus"} center />
                  ))}
                </div>
                {/* Profil preview SVGs */}
                <div className="option-preview-grid" style={{ marginTop: 12 }}>
                  {Object.entries(p.profileShapes).map(([k, d]) => (
                    <div key={k} className={`option-preview-item ${profileShape === k ? "selected" : ""}`} onClick={() => update("profileShape", k)} title={d.name}>
                      <ProfileShapeSVG shape={k} />
                      <div style={{ fontSize: "0.65rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>{d.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard num="04" label="Calitate Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glassType === k} onClick={() => update("glassType", k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num="05" label="Mână Curentă (opțional)">
            {[
              { key: "none", label: "Fără mână curentă", desc: "", price: "—" },
              ...Object.entries(p.options).filter(([k]) => k.startsWith("handrail")).map(([k, d]) => ({ key: k, label: d.name, desc: d.desc, price: `${d.pricePerMeter}€/m` }))
            ].map(o => (
              <OptionBtn key={o.key} selected={handrail === o.key} onClick={() => update("handrail", o.key)} label={o.label} desc={o.desc} price={o.price} />
            ))}
            <ToggleOption checked={includeLed} onChange={v => update("includeLed", v)} label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.price}€`} />
            {/* Handrail preview SVGs */}
            <div className="option-preview-grid">
              {[
                { key: "none", label: "Fara" },
                ...Object.entries(p.options).filter(([k]) => k.startsWith("handrail")).map(([k, d]) => ({ key: k, label: d.name.split(" ").slice(-2).join(" ") })),
              ].map(o => (
                <div key={o.key} className={`option-preview-item ${handrail === o.key ? "selected" : ""}`} onClick={() => update("handrail", o.key)} title={o.label}>
                  <HandrailShapeSVG type={o.key} />
                  <div style={{ fontSize: "0.6rem", color: "rgba(240,237,232,0.5)", marginTop: 4 }}>{o.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare 3D">
            <BalustradePreview3D dimensions={{ length, height }} glassType={glassType} mountingType={mountingType} profileShape={profileShape} skirtOverride={skirt} includeHandrail={handrail !== "none"} includeLed={normalizedIncludeLed} glassShape={glassShape} />
          </PreviewBox>

          {quote && (
            <button onClick={handleShare} className="btn-ghost w-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.82rem" }}>
              {copied ? <><Check size={14} color="#22c55e" /> Link copiat!</> : <><Share2 size={14} /> Copiază link configurație</>}
            </button>
          )}

          <QuoteSidebar
            quote={quote}
            isFormValid={isValid}
            calculating={calculating}
            onCalculate={calculate}
            onReset={() => setQuote(null)}
            onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Feronerie", value: `${quote.hwPrice}€` },
              { label: "Sticlă", value: `${quote.glassPrice}€` },
              quote.taxaForma > 0 && { label: "Taxă formă", value: `+${quote.taxaForma}€`, accent: true },
              quote.handrailP > 0 && { label: handrail !== "none" ? p.options[handrail]?.name || "Mână curentă" : "Mână curentă", value: `+${quote.handrailP}€`, accent: true },
              quote.ledP > 0 && { label: "LED", value: `+${quote.ledP}€`, accent: true },
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
          productType="balustrade"
          config={config}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}