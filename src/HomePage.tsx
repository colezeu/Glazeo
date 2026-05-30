import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight, ChevronDown, Clock, Menu, X } from "lucide-react";

const PRODUCTS = [
  { id: "balustrade",       name: "Balustrade",              tagline: "Scări, balcoane, terase",                   price: "de la 150 €/m²", path: "/configurator/balustrade",       desc: "Sticlă dreaptă sau pe rampă, cu butoni, profil U/V/L, mini-montanți sau canal în pardoseală.", active: true },
  { id: "inchidere-terasa", name: "Închidere Mobilă Terase", tagline: "Multitrack · Frameless · Ghilotină",        price: "de la 380 €/m²", path: "/configurator/inchidere-terasa", desc: "Sisteme de închidere terase și balcoane: multitrack, frameless full-glass sau ghilotină verticală.", active: true },
  { id: "cabine-dus",       name: "Cabine Duș",              tagline: "Paravan fix, mobil, uși batante/culisante", price: "de la 120 €/m²", path: "/configurator/cabine-dus",       desc: "Paravan fix sau mobil (evantai), ușă batantă sau culisantă cu glisori la vedere sau în șină.", active: false },
  { id: "partitionari",     name: "Partiționări",            tagline: "Simple · Caroiaj · Fonoizolante",           price: "de la 280 €/m²", path: "/configurator/partitionari",     desc: "Partiții din sticlă securizată sau laminat acustic. Cu sau fără profile caroiaj, ușă inclusă.", active: false },
  { id: "usi-batante",      name: "Uși Batante",             tagline: "Simple · Pe toc · Fonoizolante",            price: "de la 220 €/m²", path: "/configurator/usi-batante",      desc: "Uși batante din securit 10–12mm, cu balamale standard sau amortizor hidraulic soft-close.", active: false },
  { id: "usi-culisante",    name: "Uși Culisante",           tagline: "Full glass · Buzunar · Sincron",            price: "de la 220 €/m²", path: "/configurator/usi-culisante",    desc: "Prindere pe perete, tavan sau sincron fără șină jos. Cu sau fără panou fix, varianta buzunar.", active: false },
  { id: "pergola",          name: "Pergole",                  tagline: "Bioclimatică · Sticlă · Sandwich",          price: "de la 420 €/m²", path: "/configurator/pergola-copertina", desc: "Pergole bioclimatice cu lamele orientabile, acoperiș din sticlă culisant sau panou sandwich.", active: false },
  { id: "copertina",        name: "Copertine",                tagline: "Tiranți · Consolă · Spider",                price: "de la 350 €/m²", path: "/configurator/copertina",        desc: "Copertine din sticlă cu tiranți din inox, în consolă fără suport vizibil sau pe prinderi spider.", active: true },
  { id: "oglinzi",          name: "Oglinzi",                  tagline: "Clară · Bronze · Gri · Antichizată",        price: "de la 80 €/m²",  path: "/configurator/oglinzi",         desc: "Oglinzi la comandă — clară, bronze, gri sau antichizată. Forme standard sau speciale, cu LED.", active: true },
];

const STATS = [
  { value: "2400+", label: "Proiecte finalizate" },
  { value: "18 ani", label: "Experiență" },
  { value: "CE", label: "Certificare europeană" },
  { value: "instant", label: "Ofertă personalizată" },
];

// Navbar cu dropdown pentru configuratoare
function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Închide dropdown la click în afara lui
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Închide mobile menu la navigare
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const activeProducts = PRODUCTS.filter(p => p.active);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      padding: "0 32px", background: "rgba(15,17,23,0.7)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)", height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <img src="/logo.png" alt="Glass Associates" style={{ height: 28, filter: "invert(1)", opacity: 0.95 }} />
      </Link>

      {/* Desktop nav */}
      <div className="desktop-nav" style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {/* Dropdown Configuratoare */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: "0.82rem", padding: "6px 12px", borderRadius: 8,
              border: dropdownOpen ? "1px solid rgba(200,169,110,0.3)" : "1px solid transparent",
              background: dropdownOpen ? "rgba(200,169,110,0.08)" : "transparent",
              color: dropdownOpen ? "#c8a96e" : "rgba(240,237,232,0.7)",
              cursor: "pointer", transition: "all 0.2s ease",
            }}
          >
            Configuratoare <ChevronDown size={13} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              minWidth: 260, background: "rgba(20,23,30,0.95)",
              backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "8px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              animation: "fadeDown 0.15s ease",
            }}>
              <div style={{ fontSize: "0.68rem", color: "rgba(240,237,232,0.3)", padding: "6px 12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Toate configuratoarele
              </div>
              {activeProducts.map(p => (
                <Link
                  key={p.id}
                  to={p.path}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 8, textDecoration: "none",
                    color: location.pathname === p.path ? "#c8a96e" : "rgba(240,237,232,0.7)",
                    background: location.pathname === p.path ? "rgba(200,169,110,0.08)" : "transparent",
                    fontSize: "0.82rem", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { if (location.pathname !== p.path) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (location.pathname !== p.path) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{p.name}</span>
                  <span style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.25)" }}>{p.price}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Link-uri directe */}
        <a href="https://glass.associates" target="_blank" rel="noopener" className="nav-link" style={{ fontSize: "0.82rem", padding: "6px 12px" }}>glass.associates</a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="mobile-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ display: "none", background: "none", border: "none", color: "#f0ede8", cursor: "pointer", padding: 4 }}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu" style={{
          position: "absolute", top: 64, left: 0, right: 0,
          background: "rgba(15,17,23,0.97)", backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(240,237,232,0.3)", padding: "8px 0", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
            Configuratoare
          </div>
          {activeProducts.map(p => (
            <Link key={p.id} to={p.path} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", textDecoration: "none",
              color: location.pathname === p.path ? "#c8a96e" : "rgba(240,237,232,0.7)",
              fontSize: "0.88rem", borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {p.name}
              <span style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.3)" }}>{p.price}</span>
            </Link>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 8 }}>
            <a href="https://glass.associates" target="_blank" rel="noopener" style={{ display: "block", padding: "10px 0", textDecoration: "none", color: "rgba(240,237,232,0.6)", fontSize: "0.88rem" }}>glass.associates ↗</a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", color: "#f0ede8", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "url('/hero.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 30% 50%, rgba(15,17,23,0.82) 0%, rgba(15,17,23,0.6) 50%, rgba(15,17,23,0.4) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        {/* Hero */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "120px 32px 80px" }}>
            {/* Glazeo Logo */}
            <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "12px 32px",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: 16,
                background: "rgba(200,169,110,0.06)",
                backdropFilter: "blur(12px)",
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
                  <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="#c8a96e" strokeWidth="1.5" opacity="0.8" />
                  <line x1="8" y1="16" x2="24" y2="16" stroke="#c8a96e" strokeWidth="1.5" opacity="0.6" />
                  <line x1="8" y1="12" x2="20" y2="12" stroke="#c8a96e" strokeWidth="1.5" opacity="0.4" />
                  <line x1="8" y1="20" x2="22" y2="20" stroke="#c8a96e" strokeWidth="1.5" opacity="0.4" />
                </svg>
                <span style={{
                  fontSize: "1.6rem", fontWeight: 400,
                  fontFamily: "'Suisse Intl', serif",
                  background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  letterSpacing: "0.12em",
                }}>GLAZEO</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.25)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Configurator de produse din sticlă
              </div>
            </div>

            <div className="anim-fade-up-2" style={{ marginBottom: 24, textAlign: "center" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: 20, padding: "6px 16px", display: "inline-block" }}>
                Soluții din sticlă structurală
              </span>
            </div>
            <h1 className="serif anim-fade-up-3" style={{ fontSize: "clamp(2.8rem, 7vw, 5.2rem)", lineHeight: 1.08, marginBottom: 24, fontWeight: 400, maxWidth: 600, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
              Transparența<br /><span className="shimmer-text">devenită artă.</span>
            </h1>
            <p className="anim-fade-up-4" style={{ maxWidth: 480, fontSize: "1.05rem", lineHeight: 1.75, color: "rgba(240,237,232,0.6)", marginBottom: 40, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
              Configurați produse din sticlă de înaltă siguranță — balustrade, cabine duș, terase, pergole etc.
            </p>
            <div className="anim-fade-up-5" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="#products">
                <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Configurează Acum <ArrowRight size={16} />
                </button>
              </a>
              <a href="mailto:office@glass.associates">
                <button className="btn-ghost">Contact Direct</button>
              </a>
            </div>
            <div className="stats-grid anim-fade-up-6" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", marginTop: 80, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ padding: "24px 20px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#c8a96e", fontFamily: "'DM Serif Display', serif" }}>{s.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.45)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Catalog Produse</p>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 400 }}>Gama noastră completă</h2>
          </div>

          <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {PRODUCTS.map((p) => (
              p.active ? (
                <Link key={p.id} to={p.path} style={{ textDecoration: "none", display: "block", position: "relative", zIndex: 2 }}>
                  <div className="glass-card glass-card-hover" style={{ borderRadius: 20, padding: "32px 28px", height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 2, background: "rgba(15,17,23,0.55)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 14 }}>{p.tagline}</div>
                      <h3 style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: 10, fontFamily: "'DM Serif Display', serif" }}>{p.name}</h3>
                      <p style={{ fontSize: "0.83rem", color: "rgba(240,237,232,0.43)", lineHeight: 1.65, marginBottom: 24 }}>{p.desc}</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.3)" }}>{p.price}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#c8a96e", fontSize: "0.8rem", fontWeight: 600 }}>
                        Configurează <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={p.id} style={{ borderRadius: 20, padding: "32px 28px", height: "100%", display: "flex", flexDirection: "column", background: "rgba(15,17,23,0.35)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.6, cursor: "not-allowed" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,169,110,0.5)" }}>{p.tagline}</div>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 600, color: "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px" }}>
                        <Clock size={10} /> În curând
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: 10, fontFamily: "'DM Serif Display', serif", color: "rgba(240,237,232,0.5)" }}>{p.name}</h3>
                    <p style={{ fontSize: "0.83rem", color: "rgba(240,237,232,0.25)", lineHeight: 1.65, marginBottom: 24 }}>{p.desc}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.2)" }}>{p.price}</span>
                  </div>
                </div>
              )
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 24, padding: "60px 48px", textAlign: "center", backdropFilter: "blur(20px)" }}>
            <h2 className="serif" style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", marginBottom: 16, fontWeight: 400 }}>Pregătit să configurați?</h2>
            <p style={{ color: "rgba(240,237,232,0.45)", marginBottom: 32, fontSize: "1rem" }}>Ofertă personalizată în câteva minute.</p>
            <a href="#products">
              <button className="btn-primary" style={{ fontSize: "1rem", padding: "16px 40px" }}>Începe Configurarea</button>
            </a>
          </div>
        </section>

        <footer style={{ padding: "32px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center", color: "rgba(240,237,232,0.25)", fontSize: "0.82rem", background: "rgba(15,17,23,0.5)", backdropFilter: "blur(16px)" }}>
          © 2026 Glass Associates · Soluții din sticlă structurală
        </footer>
      </div>
    </div>
  );
}
