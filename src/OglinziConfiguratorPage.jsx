import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, ToggleOption, NumberInput, SelectInput, QuoteSidebar, PreviewBox, PageLoader, calcQuote } from "./ConfiguratorShared.jsx";
import QuoteModal from "./QuoteModal.jsx";

const FALLBACK = {
  name: "Oglinzi", basePrice: 30,
  mirrorTypes: {
    clara:       { name: "Oglindă Clară",       pricePerSqm: 80,  desc: "Reflexie perfectă, standard" },
    bronze:      { name: "Oglindă Bronze",       pricePerSqm: 95,  desc: "Nuanță caldă, elegantă" },
    gri:         { name: "Oglindă Gri (Fumée)",  pricePerSqm: 95,  desc: "Ton neutru, modern" },
    antichizata: { name: "Oglindă Antichizată",  pricePerSqm: 120, desc: "Efect vintage, patină artistică" },
  },
  shapes: {
    dreptunghi: { name: "Dreptunghi / Pătrat", price: 0,   desc: "Formă standard" },
    rotund:     { name: "Rotund",               price: 25,  desc: "Tăiere circulară" },
    oval:       { name: "Oval",                 price: 30,  desc: "Formă eliptică" },
    custom:     { name: "Formă Specială",       price: 60,  desc: "Contur personalizat la comandă" },
  },
  thicknesses: {
    "4mm": { name: "4mm", pricePerSqm: 0,  desc: "Standard rezidențial" },
    "6mm": { name: "6mm", pricePerSqm: 25, desc: "Robustețe sporită, dimensiuni mari" },
  },
  edges: {
    slefuit:  { name: "Șlefuire Simplă",    pricePerMeter: 8,  desc: "Margini finisate, fără tăișuri" },
    fazetat:  { name: "Fazetare (bizou)",    pricePerMeter: 18, desc: "Bizou decorativ 15-25mm" },
  },
  options: {
    led:        { name: "Iluminare LED Perimetrală", price: 120, desc: "Bandă LED 4000K, efect premium" },
    antiaburire:{ name: "Folie Anti-Aburire",        price: 65,  desc: "Dezaburire electrică, ideal băi" },
  }
};

/* ── Mini preview SVG ── */
function OglinziPreview({ dims, shape, mirrorType, edge, inclLed }) {
  const W = 308, H = 200;
  const w = parseFloat(dims.width) || 0.6, h = parseFloat(dims.height) || 0.8;
  const sc = Math.min((W - 80) / w, (H - 60) / h);
  const gW = w * sc, gH = h * sc;
  const cx = W / 2, cy = H / 2;
  const x0 = cx - gW / 2, y0 = cy - gH / 2;

  const fills = {
    clara: "rgba(200,220,240,0.25)",
    bronze: "rgba(180,140,80,0.2)",
    gri: "rgba(140,140,150,0.25)",
    antichizata: "rgba(160,140,100,0.18)",
  };
  const strokes = {
    clara: "rgba(200,220,240,0.5)",
    bronze: "rgba(200,169,110,0.6)",
    gri: "rgba(160,160,170,0.5)",
    antichizata: "rgba(180,160,110,0.5)",
  };

  const fill = fills[mirrorType] || fills.clara;
  const stroke = strokes[mirrorType] || strokes.clara;

  let mirrorShape;
  if (shape === "rotund") {
    const r = Math.min(gW, gH) / 2;
    mirrorShape = <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={2} />;
  } else if (shape === "oval") {
    mirrorShape = <ellipse cx={cx} cy={cy} rx={gW / 2} ry={gH / 2} fill={fill} stroke={stroke} strokeWidth={2} />;
  } else {
    mirrorShape = <rect x={x0} y={y0} width={gW} height={gH} rx={shape === "custom" ? 16 : 2} fill={fill} stroke={stroke} strokeWidth={2} />;
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      <defs>
        <linearGradient id="mirror-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
      </defs>

      {/* LED glow */}
      {inclLed && (
        shape === "rotund"
          ? <circle cx={cx} cy={cy} r={Math.min(gW, gH) / 2 + 8} fill="none" stroke="rgba(200,169,110,0.35)" strokeWidth={4} />
          : shape === "oval"
          ? <ellipse cx={cx} cy={cy} rx={gW / 2 + 8} ry={gH / 2 + 8} fill="none" stroke="rgba(200,169,110,0.35)" strokeWidth={4} />
          : <rect x={x0 - 8} y={y0 - 8} width={gW + 16} height={gH + 16} rx={shape === "custom" ? 20 : 4} fill="none" stroke="rgba(200,169,110,0.35)" strokeWidth={4} />
      )}

      {/* Mirror */}
      {mirrorShape}

      {/* Shine overlay */}
      {shape === "rotund"
        ? <circle cx={cx} cy={cy} r={Math.min(gW, gH) / 2} fill="url(#mirror-shine)" />
        : shape === "oval"
        ? <ellipse cx={cx} cy={cy} rx={gW / 2} ry={gH / 2} fill="url(#mirror-shine)" />
        : <rect x={x0} y={y0} width={gW} height={gH} rx={shape === "custom" ? 16 : 2} fill="url(#mirror-shine)" />
      }

      {/* Fazetare indicator */}
      {edge === "fazetat" && shape !== "rotund" && shape !== "oval" && (
        <rect x={x0 + 4} y={y0 + 4} width={gW - 8} height={gH - 8} rx={1} fill="none" stroke="rgba(200,169,110,0.25)" strokeWidth={1} strokeDasharray="6 3" />
      )}

      {/* Dims label */}
      <text x={cx} y={H - 8} textAnchor="middle" fill="rgba(240,237,232,0.35)" fontSize="11">
        {w.toFixed(1)}m × {h.toFixed(1)}m
      </text>
    </svg>
  );
}

export default function OglinziConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.19);
  const [dims, setDims] = useState({ width: "", height: "" });
  const [mirrorType, setMirrorType] = useState("clara");
  const [shape, setShape] = useState("dreptunghi");
  const [thickness, setThickness] = useState("4mm");
  const [edge, setEdge] = useState("slefuit");
  const [inclLed, setInclLed] = useState(false);
  const [inclAntiAburire, setInclAntiAburire] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/catalog.json").then(r => r.json())
      .then(d => {
        if (d.products.oglinzi) {
          setProduct(d.products.oglinzi);
          setVatRate(d.vatRate);
        } else {
          setProduct(FALLBACK);
        }
      })
      .catch(() => setProduct(FALLBACK));
  }, []);

  const p = product;
  const isValid = dims.width && dims.height && parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0;

  const calculate = async () => {
    if (!p) return;
    setCalculating(true);
    await new Promise(r => setTimeout(r, 600));

    const w = parseFloat(dims.width) || 0;
    const h = parseFloat(dims.height) || 0;
    const area = w * h;
    const perimeter = 2 * (w + h);

    const mirrorP   = area * (p.mirrorTypes[mirrorType]?.pricePerSqm || 0);
    const shapeP    = p.shapes[shape]?.price || 0;
    const thickP    = area * (p.thicknesses[thickness]?.pricePerSqm || 0);
    const edgeP     = perimeter * (p.edges[edge]?.pricePerMeter || 0);
    const ledP      = inclLed ? (p.options.led?.price || 0) : 0;
    const antiAbP   = inclAntiAburire ? (p.options.antiaburire?.price || 0) : 0;

    const raw = p.basePrice + mirrorP + shapeP + thickP + edgeP + ledP + antiAbP;
    const { subtotal, vat, total } = calcQuote(raw, vatRate);

    setQuote({
      area: area.toFixed(2),
      perimeter: perimeter.toFixed(1),
      mirrorP: Math.round(mirrorP),
      shapeP,
      thickP: Math.round(thickP),
      edgeP: Math.round(edgeP),
      ledP,
      antiAbP,
      subtotal, vat, total
    });
    setCalculating(false);
  };

  if (!p) return <PageLoader />;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <QuoteModal isOpen={showModal} onClose={() => setShowModal(false)} quote={quote} productName="Oglindă" />
      <ConfigHeader title="Configurator Oglinzi" quote={quote} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard num="01" label="Dimensiuni">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberInput label="Lățime (m)" value={dims.width} onChange={v => setDims(d => ({ ...d, width: v }))} placeholder="Ex: 0.8" step="0.05" />
              <NumberInput label="Înălțime (m)" value={dims.height} onChange={v => setDims(d => ({ ...d, height: v }))} placeholder="Ex: 1.2" step="0.05" />
            </div>
          </SectionCard>

          <SectionCard num="02" label="Tip Oglindă">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(p.mirrorTypes).map(([k, d]) => (
                <OptionBtn key={k} selected={mirrorType === k} onClick={() => setMirrorType(k)}
                  label={d.name} desc={d.desc} price={`${d.pricePerSqm}€/m²`} />
              ))}
            </div>
          </SectionCard>

          <SectionCard num="03" label="Formă">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(p.shapes).map(([k, d]) => (
                <OptionBtn key={k} selected={shape === k} onClick={() => setShape(k)}
                  label={d.name} desc={d.desc} price={d.price > 0 ? `+${d.price}€` : "Standard"} />
              ))}
            </div>
          </SectionCard>

          <SectionCard num="04" label="Grosime">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(p.thicknesses).map(([k, d]) => (
                <OptionBtn key={k} selected={thickness === k} onClick={() => setThickness(k)}
                  label={d.name} desc={d.desc} price={d.pricePerSqm > 0 ? `+${d.pricePerSqm}€/m²` : "Standard"} />
              ))}
            </div>
          </SectionCard>

          <SectionCard num="05" label="Finisare Margini">
            {Object.entries(p.edges).map(([k, d]) => (
              <OptionBtn key={k} selected={edge === k} onClick={() => setEdge(k)}
                label={d.name} desc={d.desc} price={`${d.pricePerMeter}€/m`} />
            ))}
          </SectionCard>

          <SectionCard num="06" label="Opțiuni Extra">
            <ToggleOption checked={inclLed} onChange={setInclLed}
              label={p.options.led.name} desc={p.options.led.desc} price={`${p.options.led.price}€`} />
            <ToggleOption checked={inclAntiAburire} onChange={setInclAntiAburire}
              label={p.options.antiaburire.name} desc={p.options.antiaburire.desc} price={`${p.options.antiaburire.price}€`} />
          </SectionCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PreviewBox title="Previzualizare">
            <OglinziPreview dims={dims} shape={shape} mirrorType={mirrorType} edge={edge} inclLed={inclLed} />
          </PreviewBox>
          <QuoteSidebar quote={quote} isFormValid={isValid} calculating={calculating}
            onCalculate={calculate} onReset={() => setQuote(null)} onSolicita={() => setShowModal(true)}
            lines={quote ? [
              { label: "Suprafață", value: `${quote.area} m²` },
              { label: "Oglindă", value: `${quote.mirrorP}€` },
              quote.shapeP > 0  && { label: "Formă specială", value: `+${quote.shapeP}€`, accent: true },
              quote.thickP > 0  && { label: "Grosime extra",  value: `+${quote.thickP}€`, accent: true },
              { label: "Finisare margini", value: `${quote.edgeP}€` },
              quote.ledP > 0    && { label: "LED",            value: `+${quote.ledP}€`,   accent: true },
              quote.antiAbP > 0 && { label: "Anti-aburire",   value: `+${quote.antiAbP}€`, accent: true },
            ] : []}
          />
        </div>
      </main>
    </div>
  );
}
