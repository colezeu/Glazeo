import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const TYPES = [
  {
    id: "multitrack",
    name: "Multitrack",
    tagline: "Șine multiple, 2-8 canate",
    price: "de la 145 €/ml",
    desc: "Sistem clasic cu șine și canate culisante. Profile laterale, încuietori, mânere, vopsire RAL. Ideal pentru terase și balcoane.",
    path: "/configurator/inchidere-terasa/multitrack",
    active: true,
  },
  {
    id: "frameless",
    name: "Frameless Full-Glass",
    tagline: "Panouri fără rame vizibile",
    price: "de la 175 €/ml",
    desc: "Design minimalist: panouri full-glass fără rame vizibile. Transparență maximă, sistem premium.",
    path: "/configurator/inchidere-terasa/frameless",
    active: true,
  },
  {
    id: "ghilotina",
    name: "Ghilotină Verticală",
    tagline: "Ridicare verticală, contragreutate",
    price: "de la 480 €/ml",
    desc: "Sistem cu contragreutate pentru ridicare verticală. Configurație automată 1+1 sau 1+2 după înălțime. Ghidaje laterale silentioase.",
    path: "/configurator/inchidere-terasa/ghilotina",
    active: false,
    comingSoon: true,
  },
];

export default function TerraceLandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        {/* Back link */}
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "rgba(240,237,232,0.4)", textDecoration: "none",
          fontSize: "0.82rem", marginBottom: 40,
        }}>
          ← Înapoi la catalog
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 8 }}>
            Închidere Terase & Balcoane
          </p>
          <h1 className="serif" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 400, marginBottom: 12 }}>
            Alege sistemul potrivit
          </h1>
          <p style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.95rem", maxWidth: 600 }}>
            Trei tipologii de închidere pentru terase și balcoane. Fiecare cu propriul sistem de calcul și opțiuni de personalizare.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {TYPES.map(t => (
            t.active ? (
            <Link key={t.id} to={t.path} style={{ textDecoration: "none" }}>
              <div className="glass-card glass-card-hover" style={{
                borderRadius: 20, padding: "36px 28px", height: "100%",
                display: "flex", flexDirection: "column",
                background: "rgba(15,17,23,0.55)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 16 }}>
                    {t.tagline}
                  </div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: 12, fontFamily: "'DM Serif Display', serif" }}>
                    {t.name}
                  </h3>
                  <p style={{ fontSize: "0.83rem", color: "rgba(240,237,232,0.43)", lineHeight: 1.65, marginBottom: 24 }}>
                    {t.desc}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.35)" }}>{t.price}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#c8a96e", fontSize: "0.82rem", fontWeight: 600 }}>
                    Configurează <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
            ) : t.comingSoon ? (
            <div key={t.id} style={{
              borderRadius: 20, padding: "36px 28px", height: "100%",
              display: "flex", flexDirection: "column",
              background: "rgba(15,17,23,0.35)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)", opacity: 0.6,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,169,110,0.5)" }}>{t.tagline}</div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px" }}>În curând</span>
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: 12, fontFamily: "'DM Serif Display', serif", color: "rgba(240,237,232,0.5)" }}>{t.name}</h3>
                <p style={{ fontSize: "0.83rem", color: "rgba(240,237,232,0.25)", lineHeight: 1.65, marginBottom: 24 }}>{t.desc}</p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.2)" }}>{t.price}</span>
            </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}
