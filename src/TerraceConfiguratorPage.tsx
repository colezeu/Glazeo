// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, ErrorBanner, calcQuote, formatPrice } from "./ConfiguratorShared.js";
import QuoteModal from "./QuoteModal.js";
import { Plus, Trash2 } from "lucide-react";
import { getUserMultiplier } from "./lib/user";
import { useAutoSave } from "./useAutoSave";
import ResumeBanner from "./components/ResumeBanner";
import { clearSavedConfig } from "./usePersistedConfig";

interface Section {
  id: number;
  width: string;
  nrCanate: number;
}

function panelOptionsForWidth(w: number): { value: number; label: string }[] {
  if (w <= 0) return [];
  const wMm = w * 1000;
  const minPanels = Math.ceil(wMm / 1250);
  const maxPanels = Math.floor(wMm / 500);
  const options = [];
  for (let n = minPanels; n <= maxPanels; n++) {
    const pw = Math.round(wMm / n);
    options.push({ value: n, label: `${n} canate (≈${pw}mm)` });
  }
  return options;
}

export default function TerraceConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [sections, setSections] = useState<Section[]>([
    { id: 1, width: "", nrCanate: 3 },
  ]);
  const [height, setHeight] = useState("2.4");
  const [glass, setGlass] = useState("clar");
  const [deschidereMijloc, setDeschidereMijloc] = useState(false);
  const [sineNeintrerupte, setSineNeintrerupte] = useState(false);
  const [manerScoica, setManerScoica] = useState(false);
  const [manerRectangular, setManerRectangular] = useState(false);
  const [incuietoare, setIncuietoare] = useState(false);
  const [profileLaterale, setProfileLaterale] = useState(false);
  const [vopsireRAL, setVopsireRAL] = useState(false);
  const [blocator, setBlocator] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useAutoSave("terrace", { sections, height, glass, deschidereMijloc, sineNeintrerupte, manerScoica, manerRectangular, incuietoare, profileLaterale, vopsireRAL, blocator });

  const resetAll = () => { clearSavedConfig("terrace"); window.location.reload(); };

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const p = d.products["inchidere-terasa"];
        if (!p) throw new Error("Terrace data missing");
        setProduct(p);
        setVatRate(d.vatRate || p.vatRate || 0.21);
      })
      .catch(() => setLoadError(true));
  }, []);
   
  // Restore saved project from Dashboard
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'terrace-multitrack' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.sections) setSections(cfg.sections);
          if (cfg.glass) setGlass(cfg.glass);
          if (cfg.height) setHeight(cfg.height);
          if (cfg.deschidereMijloc) setDeschidereMijloc(cfg.deschidereMijloc);
          if (cfg.sineNeintrerupte) setSineNeintrerupte(cfg.sineNeintrerupte);
          if (cfg.manerScoica) setManerScoica(cfg.manerScoica);
          if (cfg.manerRectangular) setManerRectangular(cfg.manerRectangular);
          if (cfg.incuietoare) setIncuietoare(cfg.incuietoare);
          if (cfg.profileLaterale) setProfileLaterale(cfg.profileLaterale);
          if (cfg.vopsireRAL) setVopsireRAL(cfg.vopsireRAL);
          if (cfg.blocator) setBlocator(cfg.blocator);
        }
      } catch (e) {}
      localStorage.removeItem('loadProject');
    }
  }, []);

  // Load B2B price tier
  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  if (loadError) return <ErrorBanner message="Nu s-a putut încărca catalogul." onRetry={() => window.location.reload()} onBack />;
  if (!product) return <PageLoader />;

  const p = product;
  const maxHeight = 3; // m

  // Total width from all sections
  const totalW = sections.reduce((sum, s) => sum + (parseFloat(s.width) || 0), 0);
  const h = parseFloat(height) || 0;

  // Validation
  const w = totalW;
  const minWidth = (p.minLungimeMM || 1200) / 1000;
  const hasInvalidSection = sections.some(s => {
    const sw = parseFloat(s.width) || 0;
    if (sw <= 0) return true;
    const opts = panelOptionsForWidth(sw);
    return opts.length === 0 || !opts.find(o => o.value === s.nrCanate);
  });
  const isValid = w >= minWidth && h > 0 && h <= maxHeight && !hasInvalidSection;

  const lungimeM = Math.ceil(w);
  const inaltimeM = Math.ceil(h);
  const mpTotal = w * h;
  const totalCanate = sections.reduce((sum, s) => sum + s.nrCanate, 0);

  const updateSection = (id: number, field: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      // Auto-adjust panels when width changes
      if (field === "width") {
        const opts = panelOptionsForWidth(parseFloat(value) || 0);
        if (opts.length > 0 && !opts.find(o => o.value === s.nrCanate)) {
          updated.nrCanate = opts[0].value;
        }
      }
      return updated;
    }));
  };

  const addSection = () => {
    const newId = Math.max(0, ...sections.map(s => s.id)) + 1;
    setSections(prev => [...prev, { id: newId, width: "", nrCanate: 3 }]);
  };

  const removeSection = (id: number) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter(s => s.id !== id));
  };

const MAX_SINA_CONTINUA = 6.3; // m — lungimea brută a șinei
  const effectiveSineNeintrerupte = sineNeintrerupte && w <= MAX_SINA_CONTINUA;

  const calculate = async () => {
    if (!p || !isValid) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 400));

    const pretSticlaMp = p.glassTypes[glass]?.pricePerSqm || 56;
    const costSticla = mpTotal * pretSticlaMp;

    // System cost — per section (fiecare secțiune e un produs independent)
    let costSistemBaza = 0;
    let costSineExtra = 0;
    let nrSineExtraTotal = 0;
    for (const s of sections) {
      const sw = Math.ceil(parseFloat(s.width) || 0);
      costSistemBaza += sw * (p.systemPrices?.sistemBaza?.pricePerMeter || 145);
      const extraPerSection = (!deschidereMijloc && s.nrCanate > 3) ? s.nrCanate - 3 : 0;
      nrSineExtraTotal += extraPerSection;
      costSineExtra += extraPerSection * sw * (p.systemPrices?.sinaExtra?.pricePerMeter || 39);
    }

    const costProfileLaterale = profileLaterale ? inaltimeM * (p.systemPrices?.profilLateral?.pricePerMeter || 39) : 0;
    const costIncuietoareVal = incuietoare ? (p.accessories?.incuietoare?.price || 207) : 0;
    const nrManere = deschidereMijloc ? 2 : 1;
    const costManere = ((manerScoica ? (p.accessories?.manerScoica?.price || 40) : 0)
                     + (manerRectangular ? (p.accessories?.manerRectangular?.price || 80) : 0)) * nrManere;
    const costRAL = vopsireRAL ? (lungimeM <= 3 ? 120 : lungimeM <= 4 ? 150 : 300) : 0;
    const costBlocator = blocator ? (p.accessories?.blocator?.price || 49) : 0;
    const costFeronerie = costSistemBaza + costSineExtra + costProfileLaterale + costIncuietoareVal + costManere + costRAL + costBlocator;
    const factorSine = effectiveSineNeintrerupte ? (p.systemPrices?.sineMajorare?.factor || 1.35) : 1.0;
    const costFeronerieAjustat = Math.round(costFeronerie * factorSine);

    const pretFinal = Math.round((costSticla + costFeronerieAjustat) * priceMultiplier);
    const { subtotal, vat, total } = calcQuote(pretFinal, vatRate);

    setQuote({
      area: mpTotal.toFixed(2), glassP: Math.round(costSticla * priceMultiplier), hardwareP: Math.round(costFeronerieAjustat * priceMultiplier),
      canate: totalCanate, sineExtra: nrSineExtraTotal, sections: sections.length,
      subtotal, vat, total
    });
    setCalculating(false);
  };

  return (
    <div style={{minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <ResumeBanner storageKey="terrace" onDismiss={resetAll} />
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Închidere Multitrack" productType="terrace-multitrack" config={{ sections, glass, height, totalCanate, deschidereMijloc, sineNeintrerupte, manerScoica, manerRectangular, incuietoare, profileLaterale, vopsireRAL, blocator }} />
      <ConfigHeader title="Configurator Terase — Multitrack" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Global height */}
          <SectionCard num="00" label="Înălțime sistem">
            <NumberInput label="Înălțime (m)" value={height} onChange={setHeight} placeholder="Ex: 2.4" step="0.1" />
            <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.3)", marginTop: 6 }}>Maxim 3.0m</div>
          </SectionCard>

          {/* Sections */}
          {sections.map((section, idx) => {
            const sw = parseFloat(section.width) || 0;
            const opts = panelOptionsForWidth(sw);
            const panelMm = sw > 0 && section.nrCanate > 0 ? Math.round((sw * 1000) / section.nrCanate) : null;
            const panelValid = panelMm !== null && panelMm >= 500 && panelMm <= 1250;

            return (
              <SectionCard key={section.id} num={`S${idx + 1}`} label={`Secțiunea ${idx + 1}`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(section.id)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "0.7rem", color: "#ef4444" }}>
                      <Trash2 size={12} /> Șterge
                    </button>
                  )}
                </div>
                <div className="config-dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <NumberInput label="Lungime (m)" value={section.width}
                    onChange={v => updateSection(section.id, "width", v)}
                    placeholder="Ex: 2.0" step="0.1" />
                  {opts.length > 0 ? (
                    <SelectInput label="Canate" value={section.nrCanate}
                      onChange={v => updateSection(section.id, "nrCanate", Number(v))}
                      options={opts.map(o => ({ value: o.value, label: o.label }))} />
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.3)", paddingTop: 28 }}>
                      {sw > 0 ? "Dimensiune invalidă pt canate" : "Completează lungimea"}
                    </div>
                  )}
                </div>
                {panelMm !== null && !panelValid && (
                  <div style={{ marginTop: 8, fontSize: "0.72rem", color: "#ef4444" }}>
                    Canat {panelMm}mm — trebuie 500–1250mm. Ajustează lungimea sau nr. canate.
                  </div>
                )}
              </SectionCard>
            );
          })}

          <button onClick={addSection} className="btn-ghost"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", border: "1px dashed rgba(200,169,110,0.3)", borderRadius: 12, fontSize: "0.82rem" }}>
            <Plus size={14} /> Adaugă secțiune
          </button>

          {/* Summary */}
          {totalW > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", fontSize: "0.82rem", color: "rgba(240,237,232,0.6)" }}>
              Total: <strong style={{ color: "#c8a96e" }}>{totalW.toFixed(1)}m</strong> · {totalCanate} canate · {sections.length} secțiune{sections.length > 1 ? "i" : ""}
            </div>
          )}

          {/* Warnings */}
          {w > 0 && w < minWidth && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
              Lungimea totală minimă este {minWidth}m (actual: {w.toFixed(1)}m)
            </div>
          )}
          {h > maxHeight && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.8rem", color: "#ef4444" }}>
              Înălțimea maximă este {maxHeight}m (actual: {h.toFixed(1)}m)
            </div>
          )}

          <SectionCard num={String(sections.length + 2)} label="Tip Sticlă">
            {Object.entries(p.glassTypes).map(([k, d]) => (
              <OptionBtn key={k} selected={glass === k} onClick={() => setGlass(k)} label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
            ))}
          </SectionCard>

          <SectionCard num={String(sections.length + 3)} label="Număr Canate & Deschidere">
            <div style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.4)", marginBottom: 12 }}>
              Total sistem: {totalCanate} canate din {sections.length} secțiune{sections.length > 1 ? "i" : ""}
            </div>
            <ToggleOption checked={deschidereMijloc} onChange={setDeschidereMijloc} label="Deschidere la mijloc" desc="Canatele se întâlnesc la mijloc — fără șine suplimentare" />
            <ToggleOption checked={effectiveSineNeintrerupte} onChange={w <= MAX_SINA_CONTINUA ? setSineNeintrerupte : () => {}}
              label={w > MAX_SINA_CONTINUA ? "Șine neîntrerupte (indisponibil)" : "Șine neîntrerupte"}
              desc={w > MAX_SINA_CONTINUA
                ? `Lungimea totală ${w.toFixed(1)}m depășește șina brută de ${MAX_SINA_CONTINUA}m — șinele se îmbină`
                : "Feronerie majorată cu 35% pentru șine continue"} />
          </SectionCard>

          <SectionCard num={String(sections.length + 4)} label="Accesorii">
            <ToggleOption checked={profileLaterale} onChange={blocator ? () => {} : setProfileLaterale} label={p.systemPrices?.profilLateral?.name || "Profile laterale"} desc={blocator ? "Obligatoriu pentru blocator interior" : p.systemPrices?.profilLateral?.desc} price={`${p.systemPrices?.profilLateral?.pricePerMeter || 39}€/m`} />
            <ToggleOption checked={blocator} onChange={(v) => { setBlocator(v); if (v) setProfileLaterale(true); }} label={p.accessories?.blocator?.name || "Blocator interior"} desc={p.accessories?.blocator?.desc || "Limitator deschidere canat principal — necesită profile laterale"} price={`${p.accessories?.blocator?.price || 49}€`} />
            <ToggleOption checked={incuietoare} onChange={setIncuietoare} label={p.accessories?.incuietoare?.name || "Încuietoare"} desc={p.accessories?.incuietoare?.desc} price={`${p.accessories?.incuietoare?.price || 207}€`} />
            <ToggleOption checked={manerScoica} onChange={(v) => { setManerScoica(v); if (v) setManerRectangular(false); }} label={p.accessories?.manerScoica?.name || "Mâner Scoică"} desc={p.accessories?.manerScoica?.desc} price={`${p.accessories?.manerScoica?.price || 40}€`} />
            <ToggleOption checked={manerRectangular} onChange={(v) => { setManerRectangular(v); if (v) setManerScoica(false); }} label={p.accessories?.manerRectangular?.name || "Mâner Rectangular"} desc={p.accessories?.manerRectangular?.desc} price={`${p.accessories?.manerRectangular?.price || 80}€`} />
            <ToggleOption checked={vopsireRAL} onChange={setVopsireRAL} label="Vopsire Câmp Electrostatic RAL" desc={`Cost fix: ${lungimeM > 0 ? (lungimeM <= 3 ? '120€' : lungimeM <= 4 ? '150€' : '300€') : '120-300€'} + TVA`} price={lungimeM > 0 ? `${lungimeM <= 3 ? '120' : lungimeM <= 4 ? '150' : '300'}€` : '120-300€'} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <TerracePreview w={w} h={h} nrCanate={totalCanate} glass={glass} sections={sections} />
          </PreviewBox>

          {(manerScoica || manerRectangular) && (
            <div className="glass-card" style={{ borderRadius: 20, padding: "20px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", marginBottom: 16 }}>Detaliu mâner</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                {manerScoica && <div style={{ textAlign: "center" }}><img src="/maner-scoica.png" alt="Mâner Scoică" style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }} /><div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginTop: 6 }}>Mâner Scoică — {p.accessories?.manerScoica?.price || 40}€</div></div>}
                {manerRectangular && <div style={{ textAlign: "center" }}><img src="/maner-rectangular.png" alt="Mâner Rectangular" style={{ width: "100%", maxHeight: 120, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }} /><div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginTop: 6 }}>Mâner Rectangular — {p.accessories?.manerRectangular?.price || 80}€</div></div>}
              </div>
            </div>
          )}

          {blocator && (
            <div className="glass-card" style={{ borderRadius: 20, padding: "20px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.4)", marginBottom: 16 }}>Blocator interior</div>
              <div style={{ textAlign: "center" }}>
                <img src="/blocator.png" alt="Blocator interior" style={{ width: "100%", maxHeight: 140, objectFit: "contain", filter: "invert(1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 8 }} />
                <div style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.5)", marginTop: 6 }}>Limitator deschidere canat principal — 49€</div>
              </div>
            </div>
          )}

          <QuoteSidebar
            quote={quote}
            isFormValid={isValid}
            calculating={calculating}
            onCalculate={calculate}
            onReset={() => setQuote(null)}
            onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: `Suprafață (${mpTotal.toFixed(1)}m²)`, value: formatPrice(quote.glassP) },
              { label: `Feronerie (${quote.canate} canate)`, value: formatPrice(quote.hardwareP) },
              quote.sineExtra > 0 && { label: `Șine extra (${quote.sineExtra})`, value: "inclus", accent: true },
              effectiveSineNeintrerupte && { label: "Șine neîntrerupte", value: "+35%", accent: true },
              sections.length > 1 && { label: `${sections.length} secțiuni`, value: `total ${w.toFixed(1)}m`, accent: true },
            ] : []}
          />

          <button onClick={() => setShowSaveModal(true)}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            style={{ background: "linear-gradient(90deg, #c8a96e, #a88b5a)" }}>
            💾 Salvează proiect
          </button>
        </div>
      </main>

      {showSaveModal && (
        <SaveProjectModal productType="terrace-multitrack"
          config={{ sections, glass, height, totalCanate, deschidereMijloc, sineNeintrerupte, manerScoica, manerRectangular, incuietoare, profileLaterale, vopsireRAL, blocator }}
          onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}

function TerracePreview({ w, h, nrCanate, glass, sections }: { w: number; h: number; nrCanate: number; glass: string; sections: Section[] }) {
  const W = 300, H = 170, M = 16;
  const realW = w || 4, realH = h || 2.4;
  const sc = Math.min((W - M * 2) / realW, (H - M * 2) / realH);
  const gW = realW * sc, gH = realH * sc;
  const x0 = (W - gW) / 2, y0 = H - M - gH;

  const glassColors: Record<string, { fill: string; stroke: string }> = {
    clar:   { fill: 'rgba(160,200,180,0.15)', stroke: 'rgba(160,200,180,0.4)' },
    bronze: { fill: 'rgba(140,100,60,0.2)',   stroke: 'rgba(140,100,60,0.5)' },
    gri:    { fill: 'rgba(160,160,160,0.18)',  stroke: 'rgba(160,160,160,0.45)' },
    satin:  { fill: 'rgba(200,200,210,0.25)', stroke: 'rgba(200,200,210,0.5)' },
  };
  const gc = glassColors[glass] || glassColors.clar;

  // Build panel data from sections
  const panels: { w: number; x: number }[] = [];
  let cx = x0;
  const totalSW = sections.reduce((sum, s) => sum + (parseFloat(s.width) || 0), 0) || realW;
  for (const s of sections) {
    const sw = (parseFloat(s.width) || 0) || (realW / sections.length);
    const sx = (sw / totalSW) * gW;
    const pw = sx / (s.nrCanate || 1);
    for (let i = 0; i < (s.nrCanate || 1); i++) {
      panels.push({ w: pw, x: cx + i * pw });
    }
    cx += sx;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#0f1117' }}>
      {/* Ground */}
      <line x1={x0 - 8} y1={y0 + gH + 6} x2={x0 + gW + 8} y2={y0 + gH + 6} stroke="rgba(200,169,110,0.35)" strokeWidth="2" />
      {/* Bottom rail — profil gros în care stă sticla + căruciorul */}
      <rect x={x0} y={y0 + gH - 2} width={gW} height={8} rx="2" fill="rgba(200,169,110,0.25)" stroke="rgba(200,169,110,0.5)" strokeWidth="1" />
      {/* Top rail */}
      <line x1={x0} y1={y0 - 5} x2={x0 + gW} y2={y0 - 5} stroke="rgba(200,169,110,0.5)" strokeWidth="3" strokeLinecap="round" />
      {panels.map((panel, i) => (
        <g key={i}>
          <rect x={panel.x + 1} y={y0} width={panel.w - 2} height={gH} fill={gc.fill} stroke={gc.stroke} strokeWidth="1.2" />
        </g>
      ))}
      {/* Section dividers */}
      {sections.length > 1 && (() => {
        let dx = x0;
        const result = [];
        for (let i = 0; i < sections.length - 1; i++) {
          const sw = (parseFloat(sections[i].width) || 0) || (realW / sections.length);
          dx += (sw / totalSW) * gW;
          result.push(<line key={`div-${i}`} x1={dx} y1={y0} x2={dx} y2={y0 + gH} stroke="rgba(200,169,110,0.2)" strokeWidth="1.5" strokeDasharray="3,3" />);
        }
        return result;
      })()}
      <text x={x0 + gW / 2} y={H - 4} textAnchor="middle" fill="rgba(200,169,110,0.5)" fontSize="7" fontFamily="DM Sans">
        {realW.toFixed(1)}m × {realH.toFixed(1)}m · {nrCanate} canate{sections.length > 1 ? ` · ${sections.length} sec.` : ""}
      </text>
    </svg>
  );
}
