import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, ValidatedNumberInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote } from "./ConfiguratorShared";
import { validateForm } from "./validation";
import { usePersistedConfig, getShareableUrl } from "./usePersistedConfig";
import QuoteModal from "./QuoteModal";
import BalustradePreview3D from "./BalustradePreview2D";
import SaveProjectModal from "./components/SaveProjectModal";
import { Share2, Check } from "lucide-react";
import { getUserMultiplier } from "./lib/user";

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
  const showProfileShape = hardware === "profil-pardoseala" || hardware === "profil-pardoseala-reglaj";

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

  const skirt = hardware === "butoni" ? 0.35 : ((hardware === "profil-pardoseala" || hardware === "profil-pardoseala-reglaj") && profileShape === "Y") ? 0.10 : 0;

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

  const isPardoseala = hardware === "profil-pardoseala" || hardware === "profil-pardoseala-reglaj";
  const mountingType = hardware === "butoni" ? "clips" : hardware === "mini-montanti" ? "mini-montanti" : isPardoseala ? "embedded" : "profile";

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
                {/* Profil preview images */}
                <div className="option-preview-grid" style={{ marginTop: 12 }}>
                  {Object.entries(p.profileShapes).map(([k, d]) => (
                    <div key={k} className={`option-preview-item ${profileShape === k ? "selected" : ""}`} onClick={() => update("profileShape", k)} title={d.name}>
                      <img src={`/profil-${k.toLowerCase()}.png`} alt={d.name} style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
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
            {/* Handrail preview images */}
            <div className="option-preview-grid">
              {[
                { key: "none", label: "Fara", img: null },
                { key: "handrail-structurala", label: "Structurala", img: "/mc-structurala.png" },
                { key: "handrail-rotunda", label: "Rotunda", img: "/mc-rotunda.png" },
                { key: "handrail-patrata", label: "Patrata", img: "/mc-patrata.png" },
                { key: "handrail-slim", label: "Slim", img: "/mc-slim.png" },
              ].map(o => (
                <div key={o.key} className={`option-preview-item ${handrail === o.key ? "selected" : ""}`} onClick={() => update("handrail", o.key)} title={o.label}>
                  {o.img ? (
                    <img src={o.img} alt={o.label} style={{ width: 80, height: 50, objectFit: "contain", display: "block", margin: "0 auto", filter: "invert(1)" }} />
                  ) : (
                    <div style={{ width: 80, height: 50, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,237,232,0.2)", fontSize: 14 }}>—</div>
                  )}
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

          {(showProfileShape || handrail !== "none") && (
            <div className="glass-card" style={{ borderRadius: 20, padding: "20px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", marginBottom: 16 }}>
                Detaliu selecție
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {showProfileShape && (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginBottom: 8 }}>
                      Profil: {p.profileShapes[profileShape]?.name || profileShape}
                    </div>
                    <img
                      src={`/profil-${profileShape.toLowerCase()}.png`}
                      alt={p.profileShapes[profileShape]?.name}
                      style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }}
                    />
                  </div>
                )}
                {handrail !== "none" && (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginBottom: 8 }}>
                      Mână curentă: {p.options[handrail]?.name || handrail}
                    </div>
                    <img
                      src={`/mc-${handrail.replace("handrail-", "")}.png`}
                      alt={p.options[handrail]?.name}
                      style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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