import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, ChevronRight, Shield, Sun, Thermometer, Maximize2, Wind, HardDrive, Phone, Mail, Sparkles } from "lucide-react";

function SEOHead({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — Glass Associates`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
  }, [title, description]);
  return null;
}

interface ServiceItem {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  desc: string;
  benefits: string[];
  specs: string[];
  configuratorPath?: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: "balustrade",
    icon: "⊞",
    name: "Balustrade din Sticlă",
    tagline: "Scări, balcoane, terase",
    desc: "Sisteme complete de balustradă din sticlă securizată, cu profile din aluminiu anodizat sau inox. Soluția ideală pentru protecția teraselor, balcoanelor și scărilor interioare, fără a compromite vederea și luminozitatea spațiului.",
    benefits: [
      "Protecție eficientă împotriva intemperiilor și căderilor accidentale",
      "Spațiu vizual neîntrerupt — senzație de libertate și deschidere",
      "Sticlă laminată sau călită 10–12 mm, cu certificare CE",
      "Feronerie variată: butoni, mini-montanți, profil U/V/L, canal în pardoseală",
    ],
    specs: ["Sticlă securizată 10–12mm", "Mână curentă din inox sau lemn", "Înălțime standard 90–110cm", "Opțiune LED încorporat", "Profile aluminiu anodizat RAL"],
    configuratorPath: "/configurator/balustrade",
  },
  {
    id: "cabine-dus",
    icon: "▦",
    name: "Cabine Duș",
    tagline: "Paravan fix, mobil, uși batante/culisante",
    desc: "Configurăm și montăm cabine de duș din sticlă securizată, cu feronerie de calitate premium. De la paravane fixe elegante până la sisteme mobile cu uși batante sau culisante — fiecare soluție este adaptată exact dimensiunilor și preferințelor clientului.",
    benefits: [
      "Sticlă securizată 8mm sau 10mm cu tratament nano pentru curățare ușoară",
      "Etanșare perfectă cu garnituri magnetice și profile din aluminiu",
      "Economie de spațiu — ușile culisante nu necesită degajare",
      "Design modern care completează orice stil de baie",
    ],
    specs: ["Sticlă 8–10mm călită + nano", "Garnituri magnetice și profile", "Ușă batantă (evantai) sau culisantă", "Opțiune sablare / decor", "Feronerie inox periat sau negru mat"],
    configuratorPath: "/configurator/cabine-dus",
  },
  {
    id: "inchidere-terasa",
    icon: "⧉",
    name: "Închideri Terase",
    tagline: "Multitrack · Frameless · Ghilotină",
    desc: "Sisteme complete de închidere mobilă pentru terase și balcoane. Trei tehnologii diferite acoperă orice nevoie: Multitrack cu șine multiple și canate culisante, frameless full-glass pentru un aspect complet transparent, sau ghilotină verticală pentru deschidere totală pe înălțime.",
    benefits: [
      "Protecție împotriva vântului, ploii și zgomotului exterior",
      "Spațiu suplimentar utilizabil — terasa devine living extensibil",
      "Eficiență termică — sticla cu tratament low-E reduce pierderile de căldură",
      "Flexibilitate maximă — deschidere parțială sau totală după preferințe",
    ],
    specs: ["Sistem Multitrack cu șine 2–5 canate", "Frameless — fără rame, sticlă 8–10mm", "Ghilotină — contragreutate și motorizare opțională", "Garnitură PVC între sticle (Multitrack)", "Profile aluminiu termopan"],
    configuratorPath: "/configurator/inchidere-terasa",
  },
  {
    id: "pergola",
    icon: "⌗",
    name: "Pergole Bioclimatice",
    tagline: "Bioclimatică · Sticlă Culisantă · Sandwich",
    desc: "Pergole bioclimatice cu lamele orientabile din aluminiu, care reglează gradul de umbrire și ventilație natural. Opțional, acoperiș din sticlă culisantă pentru lumină maximă sau panou sandwich pentru izolare termică superioară.",
    benefits: [
      "Protecție UV și termică — lamele orientabile blochează radiația directă",
      "Spațiu exterior util pe tot parcursul anului — terasă, grădină, restaurant",
      "Eficiență energetică — reducerea temperaturii interioare cu până la 8°C",
      "Flexibilitate — de la complet deschis la complet închis în câteva secunde",
    ],
    specs: ["Lamele aluminiu 180–200mm", "Acoperiș sticlă culisantă 6+6mm sau panou sandwich", "Motorizare cu telecomandă", "Senzori vânt și ploaie (opțional)", "Profile RAL la alegere"],
    configuratorPath: "/configurator/pergola-copertina",
  },
  {
    id: "copertina",
    icon: "⤢",
    name: "Copertine din Sticlă",
    tagline: "Tiranți · Consolă · Spider",
    desc: "Copertine din sticlă securizată pentru intrări, ferestre sau pasaje pietonale. Trei sisteme de prindere: cu tiranți din inox pentru stabilitate maximă, în consolă pentru un aspect minimalist fără suport vizibil, sau pe prinderi spider pentru un design contemporan.",
    benefits: [
      "Protecția intrării împotriva ploii, zăpezii și razelor directe",
      "Spațiu de tranziție protejat între exterior și interior",
      "Amplasare versatilă — deasupra ușilor, ferestrelor, vitrinelor",
      "Sticlă călită stratificată 8–12mm pentru siguranță maximă",
    ],
    specs: ["Sticlă stratificată 8–12mm", "Tiranți inox Ø20–30mm", "Consolă fără suport vizibil până la 2m", "Prinderi spider din inox", "Opțiune LED strip încorporat"],
    configuratorPath: "/configurator/copertina",
  },
  {
    id: "usi-batante",
    icon: "▯",
    name: "Uși Batante din Sticlă",
    tagline: "Full Glass · Toc Aluminiu · Fonoizolante",
    desc: "Uși batante din sticlă securizată, cu toc din aluminiu sau direct în perete. Sistem full glass cu balamale și amortizor hidraulic pentru o închidere lină și silențioasă. Opțiuni fonoizolante pentru birouri și spații comerciale.",
    benefits: [
      "Izolare fonică eficientă — varianta fonoizolantă reduce zgomotul cu până la 35dB",
      "Economie de spațiu — se deschide în interior fără a consuma loc util",
      "Lumină naturală maximă — sticla transparentă păstrează senzația de spațiu deschis",
      "Flexibilitate — monodirecțională, dublă sau ca parte a unui sistem de partiționare",
    ],
    specs: ["Sticlă securizată 8–10mm", "Amortizor hidraulic soft-close", "Toc aluminiu perimetral (opțional)", "Izolație fonică până la 35dB", "Balamale reglabile inox"],
    configuratorPath: "/configurator/usi-batante",
  },
  {
    id: "usi-culisante",
    icon: "⫼",
    name: "Uși Culisante din Sticlă",
    tagline: "Canat cu/fără Ramă · Feronerie Invizibilă",
    desc: "Uși culisante din sticlă, perfecte pentru dressinguri, băi, birouri sau spații mici unde o ușă batantă nu este practică. Canatul poate fi cu ramă din aluminiu sau full-glass, iar feroneria poate rămâne la vedere (inox periat) sau poate fi ascunsă în șină pentru un aspect minimalist.",
    benefits: [
      "Economie maximă de spațiu — nu necesită rază de deschidere",
      "Acces facil în spații înguste — coridoare, dressinguri, debarale",
      "Design curat — varianta buzunar ascunde complet canatul în perete",
      "Versatilitate — simplă, dublă sau sincron (două canate culisante)",
    ],
    specs: ["Sticlă securizată 8–10mm", "Cărucioare inox la vedere sau în șină", "Sistem buzunar (canat ascuns în perete)", "Opțiune sincron — două canate culisante", "Fără șină la nivelul pardoselii"],
    configuratorPath: "/configurator/usi-culisante",
  },
  {
    id: "partitionari",
    icon: "▌",
    name: "Partiționări din Sticlă",
    tagline: "Profile Perimetrale · Fonoizolante",
    desc: "Sisteme de compartimentare din sticlă pentru birouri, showroomuri, cabinete sau locuințe. Profile perimetrale din aluminiu cu garnituri fonoizolante, sticlă securizată 8–10mm. Panouri simetrice de 700–980mm, cu ușă încorporată la cerere.",
    benefits: [
      "Spațiu deschis și luminos — compartimentezi fără a pierde lumina naturală",
      "Izolare fonică eficientă — birouri liniștite cu sticlă fonoizolantă",
      "Flexibilitate totală — configurabile, ușor de mutat și reconfigurat",
      "Aspect profesional și modern — potrivite pentru orice tip de afacere",
    ],
    specs: ["Sticlă securizată 8–10mm", "Profile U+L aluminiu", "Garnituri fonoizolante UP2", "Panouri simetrice 700–980mm", "Ușă încorporată (batantă sau culisantă)"],
    configuratorPath: "/configurator/partitionari",
  },
  {
    id: "oglinzi",
    icon: "◈",
    name: "Oglinzi la Comandă",
    tagline: "Clară · Bronze · Gri · Antichizată",
    desc: "Oglinzi fabricate la comandă în orice dimensiune și formă. Patru tipuri de finisaj: clară (standard), bronze (cald și vintage), gri (contemporan) și antichizată (decorativă). Opțiuni cu iluminare LED perimetrală și forme speciale (rotunde, ovale, arhitecturale).",
    benefits: [
      "Amplifică vizual spațiul — oglinzile creează senzația de încăpere mai mare",
      "Iluminare ambientală — opțiunea LED adaugă o sursă de lumină difuză",
      "Personalizare completă — orice dimensiune și formă, inclusiv șabloane decorative",
      "Finisaje variate — de la elegant clasic la modern contemporan",
    ],
    specs: ["Sticlă oglindă 4–6mm", "Finisaje: clar, bronze, gri, antichizat", "Opțiune LED 4000K sau 6500K", "Forme standard sau speciale", "Grosimi: 4mm (standard) sau 6mm (mare)"],
    configuratorPath: "/configurator/oglinzi",
  },
  {
    id: "smart-glass",
    icon: "✦",
    name: "Sticlă Inteligentă (Smart Glass)",
    tagline: "PDLC · Opacitate reglabilă · Control electric",
    desc: "Sticlă inteligentă cu tehnologie PDLC (Polymer Dispersed Liquid Crystal) care comută între transparent și opac la simpla apăsare a unui buton. Soluția ideală pentru birouri, cabinete medicale, showroomuri și spații premium unde confidențialitatea este la fel de importantă ca lumina naturală.",
    benefits: [
      "Intimitate instantanee — trece de la transparent la opac în mai puțin de o secundă",
      "Spațiu eficient — înlocuiește jaluzelele, draperiile și ecranele mecanice",
      "Eficiență energetică — reduce încălzirea solară și pierderile termice",
      "Versatilitate — poate fi utilizată ca perete despărțitor, ușă sau fațadă interioară",
    ],
    specs: ["Tehnologie PDLC laminată în sticlă", "Tensiune operare 48–65V AC", "Opacitate mod OFF: 90%+", "Transparență mod ON: 80%+", "Grosime sticlă 8–12mm laminată"],
  },
  {
    id: "fire-rated",
    icon: "▲",
    name: "Sticlă Rezistentă la Foc",
    tagline: "EI 30 · EI 60 · EI 120",
    desc: "Sticlă certificată ignifugă, conforme cu standardele europene de siguranță la incendiu. Disponibilă în clasele EI 30, EI 60 și EI 120 (minute de rezistență). Sistem complet cu rame și profile speciale care asigură etanșeitatea la fum și gaze fierbinți.",
    benefits: [
      "Siguranță maximă — protejează căile de evacuare și limitează propagarea focului",
      "Spațiu luminos chiar și în zonele cu cerințe stricte de securitate la incendiu",
      "Conformitate legală — îndeplinește normativele europene și naționale P.S.I.",
      "Flexibilitate arhitecturală — disponibilă ca perete despărțitor, ușă sau geam de control",
    ],
    specs: ["Certificare EI 30 / EI 60 / EI 120", "Sticlă laminată cu gel intumescent", "Rame speciale din aluminiu sau oțel", "Etanșeitate la fum certificată", "Testată conform EN 1634-1"],
  },
];

const BENEFITS_OVERVIEW = [
  { icon: Shield, title: "Protecție Durabilă", desc: "Toate produsele noastre utilizează sticlă securizată certificată CE, cu rezistență la impact și intemperii. Protejăm persoanele și bunurile cu soluții sigure." },
  { icon: Maximize2, title: "Optimizarea Spațiului", desc: "De la uși culisante care economisesc spațiu până la închideri de terase care adaugă metri pătrați utili locuinței — fiecare soluție maximizează suprafața disponibilă." },
  { icon: Thermometer, title: "Eficiență Termică", desc: "Sticla low-E, profilele termopan și sistemele de etanșare avansată reduc pierderile de căldură și costurile de încălzire. Confort termic pe tot parcursul anului." },
  { icon: Sun, title: "Lumină Naturală Maximă", desc: "Transparența sticlei permite pătrunderea luminii naturale, reducând necesarul de iluminat artificial și creând spații mai sănătoase și mai plăcute." },
  { icon: Wind, title: "Flexibilitate Arhitecturală", desc: "Sistemele noastre modulare și configurabile se adaptează oricărei forme, dimensiuni și stil arhitectural — de la clasic la ultra-modern." },
  { icon: HardDrive, title: "Durabilitate și Întreținere Ușoară", desc: "Materiale premium, tratamente nano și profile tratate anticoroziv asigură o durată lungă de viață cu întreținere minimă. Curățare simplă cu apă și detergent neutru." },
];

const SECTORS = [
  "Rezidențial — case, apartamente, vile",
  "Comercial — birouri, magazine, showroomuri",
  "HoReCa — restaurante, hoteluri, spații de evenimente",
  "Industrial — hale de producție, depozite, showroomuri auto",
  "Instituțional — școli, cabinete medicale, clinici",
];

export default function ServicesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8" }}>
      <SEOHead
        title="Servicii Complete din Sticlă"
        description="Glass Associates — soluții complete din sticlă structurală: balustrade, cabine duș, închideri terase, pergole, copertine, uși, partiționări, oglinzi, sticlă inteligentă și ignifugă."
      />

      {/* ─── Hero ─────────────────────────────── */}
      <section style={{ minHeight: "70vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(200,169,110,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "120px 32px 80px", position: "relative", zIndex: 1 }}>
          <div className="anim-fade-up" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: 20, padding: "6px 16px", display: "inline-block" }}>
              Glass Associates
            </span>
          </div>
          <h1 className="serif anim-fade-up-2" style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)", lineHeight: 1.08, fontWeight: 400, maxWidth: 800, marginBottom: 24 }}>
            Soluții complete din <span className="shimmer-text">sticlă structurală</span>
          </h1>
          <p className="anim-fade-up-3" style={{ maxWidth: 620, fontSize: "1.1rem", lineHeight: 1.75, color: "rgba(240,237,232,0.58)", marginBottom: 40 }}>
            De la balustrade și cabine duș până la închideri de terase, pergole, copertine și sisteme speciale — oferim soluții integrale de sticlă pentru proiecte rezidențiale și comerciale în România.
          </p>
          <div className="anim-fade-up-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#servicii">
              <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Explorează Serviciile <ArrowRight size={16} />
              </button>
            </a>
            <a href="#contact">
              <button className="btn-ghost">Cere Ofertă</button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Introducere produse ───────────────── */}
      <section id="servicii" style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="anim-fade-up" style={{ marginBottom: 56 }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Catalog Servicii</p>
          <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400, maxWidth: 700 }}>
            Toate soluțiile noastre din sticlă, într-un singur loc
          </h2>
          <p style={{ maxWidth: 560, color: "rgba(240,237,232,0.5)", fontSize: "0.95rem", lineHeight: 1.7, marginTop: 16 }}>
            Fiecare produs este disponibil în configuratorul nostru online pentru o ofertă instantanee și personalizată.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SERVICES.map((service, index) => (
            <div
              key={service.id}
              className="anim-fade-up"
              style={{
                animationDelay: `${Math.min(index * 0.08, 0.8)}s`,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                overflow: "hidden",
                transition: "border-color 0.3s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <div style={{ padding: "40px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
                {/* Stânga — header + descriere */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <span style={{ fontSize: "1.8rem", color: "#c8a96e" }}>{service.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 4 }}>{service.tagline}</div>
                      <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 400 }}>{service.name}</h3>
                    </div>
                  </div>
                  <p style={{ color: "rgba(240,237,232,0.55)", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: 20 }}>
                    {service.desc}
                  </p>
                  {service.configuratorPath && (
                    <Link to={service.configuratorPath} style={{ textDecoration: "none" }}>
                      <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", fontSize: "0.85rem" }}>
                        Configurează Online <ChevronRight size={14} />
                      </button>
                    </Link>
                  )}
                </div>

                {/* Dreapta — beneficii + specificații */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Beneficii */}
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 10 }}>Beneficii</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      {service.benefits.map((b, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "rgba(240,237,232,0.48)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          <span style={{ color: "#c8a96e", flexShrink: 0, marginTop: 3 }}>▸</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specificații tehnice */}
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {service.specs.map((s, i) => (
                        <span key={i} style={{
                          fontSize: "0.72rem", color: "rgba(240,237,232,0.45)",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 6, padding: "4px 10px",
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── De ce să alegi sticla structurală? (Beneficii generale) ─── */}
      <section style={{ padding: "80px 32px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Avantaje</p>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400 }}>
              De ce să alegi sticla structurală?
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {BENEFITS_OVERVIEW.map((b, i) => (
              <div key={i} className="glass-card glass-card-hover" style={{
                borderRadius: 20, padding: "32px 28px",
                display: "flex", flexDirection: "column",
                background: "rgba(15,17,23,0.55)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <b.icon size={22} color="#c8a96e" style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 10 }}>{b.title}</h3>
                <p style={{ fontSize: "0.83rem", color: "rgba(240,237,232,0.43)", lineHeight: 1.65, flex: 1 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Domenii de aplicare ─── */}
      <section style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 12 }}>Domenii de Aplicare</p>
          <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400 }}>
            Soluții pentru orice tip de proiect
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {SECTORS.map((sector) => (
            <div key={sector} className="glass-card" style={{ borderRadius: 16, padding: "18px 20px", color: "rgba(240,237,232,0.72)", fontSize: "0.9rem" }}>
              {sector}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────── */}
      <section id="contact" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", background: "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 24, padding: "48px 40px", textAlign: "center", backdropFilter: "blur(20px)" }}>
          <Sparkles size={28} color="#c8a96e" style={{ marginBottom: 16 }} />
          <h2 className="serif" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, marginBottom: 12 }}>
            Începe proiectul tău în sticlă
          </h2>
          <p style={{ color: "rgba(240,237,232,0.5)", maxWidth: 480, margin: "0 auto 28px", fontSize: "0.95rem", lineHeight: 1.7 }}>
            Folosește configuratorul online pentru o ofertă instantanee sau contactează-ne direct pentru o soluție personalizată.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/home">
              <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.95rem", padding: "14px 32px" }}>
                Toate Configuratoarele <ArrowRight size={16} />
              </button>
            </a>
            <a href="mailto:office@glass.associates" style={{ textDecoration: "none" }}>
              <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={16} /> office@glass.associates
              </button>
            </a>
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="tel:+40721726789" style={{ textDecoration: "none" }}>
              <button className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Phone size={16} /> +40 721 726 789
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────── */}
      <footer style={{ padding: "32px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center", color: "rgba(240,237,232,0.25)", fontSize: "0.82rem", background: "rgba(15,17,23,0.5)", backdropFilter: "blur(16px)" }}>
        © 2026 Glass Associates · Soluții din sticlă structurală
      </footer>
    </div>
  );
}
