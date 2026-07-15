// @ts-nocheck
import SaveProjectModal from "./components/SaveProjectModal";
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, NumberInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.js";
import { getUserMultiplier } from "./lib/user";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = {
  name: "Cădițe Duș Compozit",
  basePrice: 280,
  transport: 25,
  maxWidth: 1.1,
  maxLength: 2.0,
  colors: {
    alb:   { name: "Alb",   color: "#f5f5f0" },
    gri:   { name: "Gri",   color: "#9e9e9e" },
    negru: { name: "Negru", color: "#2a2a2a" },
    crem:  { name: "Crem",  color: "#e8d5b7" },
  }
};

/* ── Preview SVG: cadă duș compozit cu pantă și sifon ── */
function CaditaPreview({ dims, colorKey, colors }) {
  const W = 340, H = 220;
  const w = parseFloat(dims.width) || 0.9, l = parseFloat(dims.length) || 1.2;
  const sc = Math.min((W - 60) / w, (H - 50) / l);
  const gW = w * sc, gL = l * sc;
  const cx = W / 2, cy = H / 2;
  const x0 = cx - gW / 2, y0 = cy - gL / 2;

  const colorHex = (colors && colors[colorKey]?.color) || "#f5f5f0";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      {/* Umbră */}
      <rect x={x0 + 3} y={y0 + 3} width={gW} height={gL} rx={6} fill="rgba(0,0,0,0.3)" />
      
      {/* Corp cadă */}
      <rect x={x0} y={y0} width={gW} height={gL} rx={6} fill={colorHex} stroke="rgba(200,169,110,0.35)" strokeWidth={1.5} />
      
      {/* Pantă — linii concentrice spre sifon */}
      {[0.25, 0.5, 0.75].map(r => (
        <rect
          key={r}
          x={x0 + gW * 0.05 + (gW * 0.9 * (1 - r)) / 2}
          y={y0 + gL * 0.1 + (gL * 0.7 * (1 - r)) / 2}
          width={gW * 0.9 * r}
          height={gL * 0.7 * r}
          rx={3}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.8}
        />
      ))}

      {/* Sifon (centru-jos) */}
      <circle cx={cx} cy={y0 + gL * 0.72} r={Math.min(gW, gL) * 0.06} fill="rgba(200,169,110,0.5)" stroke="rgba(200,169,110,0.7)" strokeWidth={1} />
      <circle cx={cx} cy={y0 + gL * 0.72} r={Math.min(gW, gL) * 0.025} fill="rgba(15,17,23,0.6)" />

      {/* Dimensiuni */}
      <text x={x0 + gW / 2} y={y0 - 6} textAnchor="middle" fill="rgba(240,237,232,0.45)" fontSize="10">
        {w.toFixed(1)}m
      </text>
      <text x={x0 + gW + 14} y={y0 + gL / 2} textAnchor="middle" fill="rgba(240,237,232,0.45)" fontSize="10"
        transform={`rotate(90, ${x0 + gW + 14}, ${y0 + gL / 2})`}>
        {l.toFixed(1)}m
      </text>

      {/* Înălțime 3cm */}
      <text x={cx} y={y0 + gL + 18} textAnchor="middle" fill="rgba(240,237,232,0.3)" fontSize="9">
        h=3cm · pantă integrată · sifon inclus
      </text>
    </svg>
  );
}

export default function CaditaDusConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [dims, setDims] = useState({ width: "", length: "" });
  const [colorKey, setColorKey] = useState("alb");
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.json())
      .then(d => {
        if (d.products["cadita-dus"]) {
          setProduct(d.products["cadita-dus"]);
          setVatRate(d.vatRate);
        } else {
          setProduct(FALLBACK);
        }
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  // Restore saved project
  useEffect(() => {
    const saved = localStorage.getItem('loadProject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.product_type === 'cadita-dus' && parsed.config) {
          const cfg = parsed.config;
          if (cfg.dims) setDims(cfg.dims);
          if (cfg.colorKey) setColorKey(cfg.colorKey);
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
  const w = parseFloat(dims.width) || 0;
  const l = parseFloat(dims.length) || 0;
  const isValid = dims.width && dims.length && w > 0 && l > 0
    && w <= (p?.maxWidth || 1.1) && l <= (p?.maxLength || 2.0);

  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));

    const area = w * l;
    const materialP = area * p.basePrice;
    const transportP = p.transport || 25;

    const raw = Math.round(materialP * priceMultiplier) + transportP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);

    setQuote({
      area: area.toFixed(2),
      materialP: Math.round(materialP * priceMultiplier),
      transportP,
      subtotal, vat, total
    });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote}
        productName="Cădiță Duș Compozit" productType="cadita-dus"
        config={{ dims, colorKey }} />
      <ConfigHeader title="Configurator Cădițe Duș Compozit" quote={quote} />

      <main className="configurator-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Dimensiuni">
            <p style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.45)", marginBottom: 14 }}>
              Maxim: {p.maxWidth}m lățime × {p.maxLength}m lungime. Înălțime fixă 3cm, pantă integrată către sifon.
            </p>
            <div className="config-dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m) — max 1.1m" value={dims.width}
                onChange={v => setDims(d => ({ ...d, width: v }))}
                placeholder="Ex: 0.9" step="0.05" min="0.1" max={p.maxWidth} />
              <NumberInput label="Lungime (m) — max 2.0m" value={dims.length}
                onChange={v => setDims(d => ({ ...d, length: v }))}
                placeholder="Ex: 1.2" step="0.05" min="0.1" max={p.maxLength} />
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(240,237,232,0.3)", marginTop: 10 }}>
              Suprafață: {(w * l).toFixed(2)} m²
            </p>
          </SectionCard>

          <SectionCard num="02" label="Culoare">
            <div className="config-dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(p.colors).map(([k, d]) => (
                <button
                  key={k}
                  className={`option-btn ${colorKey === k ? "selected" : ""}`}
                  onClick={() => setColorKey(k)}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: d.color,
                    border: colorKey === k ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.2)",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.name}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard num="03" label="Detalii Produs">
            <ul style={{ fontSize: "0.82rem", color: "rgba(240,237,232,0.6)", lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Material: compozit durabil, suprafață antiderapantă</li>
              <li>Înălțime: 3 cm — montaj rapid pe șapă</li>
              <li>Pantă integrată către sifon (inclus)</li>
              <li>Culori: Alb, Gri, Negru, Crem</li>
              <li>Transport: 25€ / comandă</li>
            </ul>
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <img
              src={`/cadita-${colorKey}.jpg`}
              alt={`Cădiță duș ${p.colors[colorKey]?.name}`}
              style={{ width: "100%", borderRadius: 12 }}
            />
            {dims.width && dims.length && (
              <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.35)", marginTop: 8, textAlign: "center" }}>
                {parseFloat(dims.width).toFixed(1)}m × {parseFloat(dims.length).toFixed(1)}m · {p.colors[colorKey]?.name}
              </div>
            )}
          </PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Material compozit", value: `${quote.materialP}€` },
              { label: "Transport", value: `${quote.transportP}€`, accent: true },
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
          productType="cadita-dus"
          config={{ dims, colorKey }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
