import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Check, RotateCcw } from "lucide-react";

export function ConfigHeader({ title, quote }) {
  return (
    <header style={{ background:"rgba(15,17,23,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:40 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#f0ede8", textDecoration:"none" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ fontWeight:700, fontSize:"0.95rem" }}>{title}</div>
          <div style={{ fontSize:"0.73rem", color:"rgba(240,237,232,0.35)" }}>Glass Associates</div>
        </div>
      </div>
      {quote && (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:"0.82rem", color:"rgba(240,237,232,0.4)" }}>Total estimat:</span>
          <span style={{ fontSize:"1.1rem", fontWeight:700, color:"#c8a96e" }}>{quote.total}€</span>
        </div>
      )}
    </header>
  );
}

export function SectionCard({ num, label, children }) {
  return (
    <div className="glass-card" style={{ borderRadius:20, padding:"28px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#c8a96e", opacity:0.7, minWidth:24 }}>{num}</span>
        <span style={{ fontWeight:700, fontSize:"1rem" }}>{label}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{children}</div>
    </div>
  );
}

export function OptionBtn({ selected, onClick, label, desc, price, center }) {
  return (
    <button className={`option-btn ${selected ? "selected" : ""}`} onClick={onClick} style={center ? { textAlign:"center" } : {}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={center ? { width:"100%", textAlign:"center" } : {}}>
          <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{label}</div>
          {desc && <div style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.4)", marginTop:2 }}>{desc}</div>}
        </div>
        {price && !center && <span className="price-tag">{price}</span>}
      </div>
      {price && center && <div style={{ marginTop:8 }}><span className="price-tag">{price}</span></div>}
    </button>
  );
}

export function ToggleOption({ checked, onChange, label, desc, price }) {
  return (
    <button className={`option-btn ${checked ? "selected" : ""}`} onClick={() => onChange(!checked)}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${checked ? "#c8a96e" : "rgba(255,255,255,0.2)"}`, background: checked ? "#c8a96e" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
            {checked && <Check size={12} color="#0f1117" strokeWidth={3} />}
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{label}</div>
            {desc && <div style={{ fontSize:"0.76rem", color:"rgba(240,237,232,0.38)", marginTop:1 }}>{desc}</div>}
          </div>
        </div>
        {price && <span className="price-tag">{price}</span>}
      </div>
    </button>
  );
}

export function NumberInput({ label, value, onChange, placeholder, step, min, max }) {
  return (
    <div>
      <label style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.45)", display:"block", marginBottom:8 }}>{label}</label>
      <input className="input-field" type="number" step={step || "0.1"} min={min} max={max} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export { ValidatedNumberInput } from "./ValidatedNumberInput";
export { validateField, validateForm, ValidationRules } from "./validation";
export { OptionCard, GlassPreviewSVG, HandrailPreviewSVG, HardwarePreviewSVG } from "./OptionPreviews";

export function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ fontSize:"0.78rem", color:"rgba(240,237,232,0.45)", display:"block", marginBottom:8 }}>{label}</label>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function QuoteLine({ label, value, accent, muted }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.83rem" }}>
      <span style={{ color: muted ? "rgba(240,237,232,0.3)" : "rgba(240,237,232,0.5)" }}>{label}</span>
      <span style={{ color: accent ? "#c8a96e" : muted ? "rgba(240,237,232,0.3)" : "rgba(240,237,232,0.8)", fontWeight:500 }}>{value}</span>
    </div>
  );
}

export function QuoteSidebar({ quote, isFormValid, calculating, onCalculate, onReset, onSolicita, lines }) {
  return (
    <div className="glass-card" style={{ borderRadius:20, padding:"24px", position:"sticky", top:80 }}>
      <div style={{ fontSize:"0.75rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(240,237,232,0.4)", marginBottom:20 }}>Rezumat Ofertă</div>
      {!quote ? (
        <>
          <div style={{ color:"rgba(240,237,232,0.3)", fontSize:"0.85rem", textAlign:"center", padding:"16px 0 24px" }}>
            Completează dimensiunile pentru a calcula prețul
          </div>
          <button className="btn-primary" style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            disabled={!isFormValid || calculating} onClick={onCalculate}>
            {calculating ? <><Loader2 size={16} className="animate-spin" />Se calculează...</> : "Calculează Preț"}
          </button>
        </>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {(lines || []).map((l, i) => l && <QuoteLine key={i} {...l} />)}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:10, marginTop:4 }}>
              <QuoteLine label="Subtotal" value={`${quote.subtotal}€`} />
              <QuoteLine label="TVA 19%" value={`${quote.vat}€`} muted />
            </div>
          </div>
          <div style={{ background:"rgba(200,169,110,0.08)", border:"1px solid rgba(200,169,110,0.2)", borderRadius:14, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"0.85rem", fontWeight:600 }}>Total</span>
            <span style={{ fontSize:"1.8rem", fontWeight:700, color:"#c8a96e" }}>{quote.total}€</span>
          </div>
          <button className="btn-primary" style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }} onClick={onSolicita}>
            <Check size={16} /> Solicită Ofertă
          </button>
          <button className="btn-ghost" style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }} onClick={onReset}>
            <RotateCcw size={13} /> Recalculează
          </button>
        </>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "2px solid rgba(200,169,110,0.2)",
        borderTopColor: "#c8a96e",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.85rem" }}>Se încarcă configuratorul...</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", color: "#f0ede8"
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 8 }}>Eroare de încărcare</h3>
        <p style={{ color: "rgba(240,237,232,0.5)", fontSize: "0.88rem", marginBottom: 24, lineHeight: 1.6 }}>
          {message || "Nu s-a putut încărca catalogul de produse. Verificați conexiunea la internet."}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {onRetry && (
            <button onClick={onRetry} className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
              🔄 Încearcă din nou
            </button>
          )}
          {onBack && (
            <a href="/"><button className="btn-ghost" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
              ← Înapoi la Homepage
            </button></a>
          )}
        </div>
      </div>
    </div>
  );
}

export function PreviewBox({ title, children }) {
  return (
    <div className="glass-card" style={{ borderRadius:20, padding:"20px 16px" }}>
      <div style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(240,237,232,0.4)", marginBottom:14 }}>{title || "Previzualizare 2D"}</div>
      {children}
    </div>
  );
}

export function useCatalog(productKey, fallback) {
  const [product, setProduct] = require("react").useState(null);
  const [vatRate, setVatRate] = require("react").useState(0.19);
  require("react").useEffect(() => {
    fetch("/catalog.json").then(r => r.json())
      .then(d => { setProduct(d.products[productKey]); setVatRate(d.vatRate); })
      .catch(() => { setProduct(fallback); });
  }, []);
  return { product, vatRate };
}

export function calcQuote(subtotalRaw, vatRate) {
  const subtotal = Math.round(subtotalRaw);
  const vat = Math.round(subtotalRaw * vatRate);
  const total = Math.round(subtotalRaw * (1 + vatRate));
  return { subtotal, vat, total };
}
