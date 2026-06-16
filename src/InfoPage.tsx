// @ts-nocheck
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, Phone } from "lucide-react";

const PAGE_CONTENT = {
  despre: {
    eyebrow: "Glass Associates",
    title: "Soluții din sticlă pentru spații curate, sigure și luminoase.",
    intro: "Configuratoarele ajută clienții să pornească de la dimensiuni reale, opțiuni clare și un buget estimativ înainte de discuția tehnică finală.",
    items: ["Balustrade și sisteme structurale", "Cabine duș și compartimentări", "Pergole, copertine și închideri terase"],
  },
  portofoliu: {
    eyebrow: "Portofoliu",
    title: "Lucrări organizate pe tipuri de produs.",
    intro: "Pagina poate deveni galeria principală pentru proiecte finalizate, cu filtre pe produs, oraș și tip de montaj.",
    items: ["Balustrade", "Cabine duș", "Terase și pergole", "Uși și partiționări"],
  },
  contact: {
    eyebrow: "Contact",
    title: "Trimite dimensiunile sau pornește direct din configurator.",
    intro: "Pentru o ofertă exactă, include dimensiuni, tipul produsului, orașul și câteva fotografii ale zonei de montaj.",
    items: ["office@glassassociates.ro", "+40 721 726 789", "Răspuns în maxim 24 de ore lucrătoare"],
  },
};

export default function InfoPage({ page }) {
  const content = PAGE_CONTENT[page] || PAGE_CONTENT.despre;
  const isContact = page === "contact";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,17,23,0.95)" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "#f0ede8", textDecoration: "none", fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Înapoi
        </Link>
        <img src="/logo.png" alt="Glass Associates" style={{ height: 28, filter: "invert(1)", opacity: 0.95 }} />
      </header>

      <main style={{ maxWidth: 940, margin: "0 auto", padding: "88px 24px" }}>
        <p style={{ color: "#c8a96e", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
          {content.eyebrow}
        </p>
        <h1 className="serif" style={{ fontSize: "clamp(2.2rem, 6vw, 4.4rem)", lineHeight: 1.08, fontWeight: 400, maxWidth: 760, marginBottom: 24 }}>
          {content.title}
        </h1>
        <p style={{ maxWidth: 620, color: "rgba(240,237,232,0.58)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: 40 }}>
          {content.intro}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 42 }}>
          {content.items.map((item) => (
            <div key={item} className="glass-card" style={{ borderRadius: 16, padding: "18px 20px", color: "rgba(240,237,232,0.72)" }}>
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/configurator/balustrade">
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Configurează <ArrowRight size={16} />
            </button>
          </Link>
          {isContact ? (
            <>
              <a href="mailto:office@glassassociates.ro" style={{ textDecoration: "none" }}>
                <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={16} /> Email
                </button>
              </a>
              <a href="tel:+40721726789" style={{ textDecoration: "none" }}>
                <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={16} /> Telefon
                </button>
              </a>
            </>
          ) : (
            <Link to="/contact" style={{ textDecoration: "none" }}>
              <button className="btn-ghost">Contact</button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
