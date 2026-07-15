// @ts-nocheck
import { useState, useEffect } from "react";
import { ConfigHeader, SectionCard, OptionBtn, QuoteSidebar, PageLoader, ErrorBanner } from "./ConfiguratorShared";
import { usePersistedConfig } from "./usePersistedConfig";
import QuoteModal from "./QuoteModal";
import SaveProjectModal from "./components/SaveProjectModal";
import { getUserMultiplier } from "./lib/user";
import { Palette, Layers, Sparkles } from "lucide-react";

const CATEGORIES = [
  { id: "textile",   name: "Textile",       icon: "🧵", desc: "Denim, in, catifea, mătase, lână — textile naturale încapsulate în sticlă" },
  { id: "tehnice",   name: "Tehnice",       icon: "⚙️", desc: "Carbon, inserții metalice, meșuri — materiale high-tech pentru proiecte premium" },
  { id: "naturale",  name: "Naturale",      icon: "🪨", desc: "Furnir, ardezie, piatră — elemente organice prinse între straturi de sticlă" },
  { id: "decorative",name: "Decorative",    icon: "🎨", desc: "Tartan, tapet, broderii — modele și texturi decorative personalizate" },
];

const MATERIALS: Record<string, { id: string; name: string; desc: string }[]> = {
  textile: [
    { id: "denim",    name: "Denim",      desc: "Textură robustă, albastru industrial — perfect pentru spații casual-chic" },
    { id: "in",       name: "In",         desc: "Fibre naturale, semi-transparent — difuzează lumina elegant" },
    { id: "catifea",  name: "Catifea",    desc: "Lux tactil, culori profunde — pentru lobby-uri și restaurante premium" },
    { id: "matase",   name: "Mătase",     desc: "Strălucire subtilă, fluiditate — hoteluri și spa-uri de lux" },
    { id: "lana",     name: "Lână",       desc: "Căldură și textură — perfect pentru spații rezidențiale premium" },
    { id: "bumbac",   name: "Bumbac",     desc: "Natural, versatil — se potrivește oricărui proiect" },
  ],
  tehnice: [
    { id: "carbon",   name: "Carbon",     desc: "Textură de supercar — showroom-uri auto, birouri tech, spații avangardiste" },
    { id: "metal",    name: "Inserții Metalice", desc: "Alamă, cupru, inox — strălucire metalică reală încapsulată" },
    { id: "mesh",     name: "Meșuri",     desc: "Plasă metalică fină — efect industrial sofisticat" },
  ],
  naturale: [
    { id: "furnir",   name: "Furnir",     desc: "Lemn natural subțire — căldura lemnului cu rezistența sticlei" },
    { id: "ardezie",  name: "Ardezie",    desc: "Piatră naturală — textură brută, aspect mineral autentic" },
    { id: "piatra",   name: "Piatră",     desc: "Piatră naturală subțire — fiecare panou e unic" },
  ],
  decorative: [
    { id: "tartan",   name: "Tartan",     desc: "Model clasic scoțian — hoteluri, cluburi private, restaurante" },
    { id: "tapet",    name: "Tapet",      desc: "Orice model de tapet — personalizare totală" },
    { id: "broderie", name: "Broderii",   desc: "Texturi brodate manual — piese unicat pentru proiecte speciale" },
  ],
};

const USE_CASES = [
  "Hotel Lobby", "Restaurant Fine Dining", "Showroom Auto",
  "Spa & Wellness", "Retail Premium", "Birouri Clasa A",
  "Vile de Lux", "Yacht Interior", "Club Privat",
];

export default function VitroVibeConfiguratorPage() {
  const [product, setProduct] = useState(null);
  const [vatRate, setVatRate] = useState(0.21);
  const [config, setConfig] = usePersistedConfig("vitrovibe", {
    category: "", material: "", useCase: "", width: "", height: "", message: "",
  });
  const [quote, setQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);

  const { category, material, useCase, width, height, message } = config;

  useEffect(() => {
    getUserMultiplier().then(mult => setPriceMultiplier(mult));
  }, []);

  useEffect(() => {
    fetch("/catalog.json")
      .then(r => r.json())
      .then(d => {
        const p = d.products?.vitrovibe;
        if (!p) throw new Error("VitroVibe data missing");
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
  const selectedCat = CATEGORIES.find(c => c.id === category);
  const selectedMat = category ? MATERIALS[category]?.find(m => m.id === material) : null;
  const canRequestQuote = category && material && width && height;

  const update = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  const buildQuote = () => {
    const sqm = (parseFloat(width) || 0) * (parseFloat(height) || 0);
    const basePrice = p.basePrice || 0;
    const total = sqm * basePrice * priceMultiplier;
    const subtotal = total / (1 + vatRate);
    const vat = total - subtotal;
    setQuote({
      subtotal: Math.round(subtotal * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      total: Math.round(total * 100) / 100,
      sqm: Math.round(sqm * 100) / 100,
      unitPrice: basePrice,
      multiplier: priceMultiplier,
      vatPercent: Math.round(vatRate * 100),
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f1117 0%, #15181f 100%)", color: "#f0ede8" }}>
      <ConfigHeader
        title="VitroVibe"
        subtitle="Sticlă laminată cu textile reale"
        backTo="/home"
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 120px", display: "flex", gap: 32 }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Intro */}
          <SectionCard title="Material compozit revoluționar" icon={<Sparkles size={18} />}>
            <p style={{ color: "rgba(240,237,232,0.6)", fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
              Încapsulăm textile și materiale reale direct între straturile de sticlă.
              Nu folii printate, nu sablare — textură tridimensională autentică, dezvoltată în atelierul propriu din Arad.
              Fiecare panou este unic și personalizabil.
            </p>
          </SectionCard>

          {/* Step 1: Categorie */}
          <SectionCard title="1. Alege categoria de material" icon={<Layers size={18} />}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {CATEGORIES.map(cat => (
                <OptionBtn
                  key={cat.id}
                  selected={category === cat.id}
                  onClick={() => { update("category", cat.id); update("material", ""); }}
                  label={
                    <div>
                      <div style={{ fontSize: "1.1rem", marginBottom: 4 }}>{cat.icon} {cat.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.45)", lineHeight: 1.4 }}>{cat.desc}</div>
                    </div>
                  }
                />
              ))}
            </div>
          </SectionCard>

          {/* Step 2: Material specific */}
          {category && (
            <SectionCard title={`2. Alege materialul — ${selectedCat?.name}`} icon={<Palette size={18} />}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {MATERIALS[category].map(mat => (
                  <OptionBtn
                    key={mat.id}
                    selected={material === mat.id}
                    onClick={() => update("material", mat.id)}
                    label={
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 3 }}>{mat.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.45)", lineHeight: 1.3 }}>{mat.desc}</div>
                      </div>
                    }
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Step 3: Dimensiuni + Use Case */}
          {material && (
            <SectionCard title="3. Detalii proiect" icon={<span>📐</span>}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", marginBottom: 6, display: "block" }}>Lățime (m)</label>
                  <input
                    type="number" min="0.1" max="4" step="0.01" value={width}
                    onChange={e => update("width", e.target.value)}
                    placeholder="ex: 2.5"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f0ede8", fontSize: "0.9rem", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", marginBottom: 6, display: "block" }}>Înălțime (m)</label>
                  <input
                    type="number" min="0.1" max="3.5" step="0.01" value={height}
                    onChange={e => update("height", e.target.value)}
                    placeholder="ex: 2.7"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f0ede8", fontSize: "0.9rem", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <label style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", marginBottom: 8, display: "block" }}>
                Tip proiect (opțional)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {USE_CASES.map(uc => (
                  <OptionBtn
                    key={uc}
                    selected={useCase === uc}
                    onClick={() => update("useCase", uc)}
                    label={uc}
                  />
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", marginBottom: 6, display: "block" }}>
                  Mesaj / Cerințe speciale (opțional)
                </label>
                <textarea
                  value={message}
                  onChange={e => update("message", e.target.value)}
                  placeholder="Ex: Vreau catifea bleumarin pentru lobby-ul unui hotel de 5 stele. Am nevoie de 3 panouri de 2.5×2.7m..."
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f0ede8", fontSize: "0.88rem", boxSizing: "border-box",
                    resize: "vertical", fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                onClick={buildQuote}
                disabled={!canRequestQuote}
                style={{
                  marginTop: 20, width: "100%", padding: "14px 24px", borderRadius: 12,
                  border: "none", cursor: canRequestQuote ? "pointer" : "not-allowed",
                  background: canRequestQuote
                    ? "linear-gradient(135deg, #c8a96e, #b8944e)"
                    : "rgba(255,255,255,0.05)",
                  color: canRequestQuote ? "#0f1117" : "rgba(240,237,232,0.3)",
                  fontSize: "1rem", fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                💎 Vezi prețul estimativ
              </button>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <QuoteSidebar
          quote={quote}
          config={{
            ...config,
            categoryName: selectedCat?.name || "",
            materialName: selectedMat?.name || "",
          }}
          productName="VitroVibe"
          productUnit="m²"
          onRequestOffer={() => setShowModal(true)}
          onSaveProject={() => setShowSaveModal(true)}
          basePriceLabel={p.basePrice ? `Preț orientativ: de la ${p.basePrice} €/m²` : "Preț personalizat — solicită ofertă"}
        />
      </div>

      {showModal && (
        <QuoteModal
          config={{ ...config, categoryName: selectedCat?.name, materialName: selectedMat?.name }}
          quote={quote}
          productType="vitrovibe"
          productName={`VitroVibe — ${selectedMat?.name || ""}`}
          vatRate={vatRate}
          onClose={() => setShowModal(false)}
        />
      )}

      {showSaveModal && (
        <SaveProjectModal
          config={{ ...config, categoryName: selectedCat?.name, materialName: selectedMat?.name }}
          productType="vitrovibe"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
