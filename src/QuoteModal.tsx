// @ts-nocheck
import { useState } from "react";
import { X, Send, Check, Loader2, FileText, Mail, Download } from "lucide-react";
import { validateForm } from "./validation";
import { generateQuotePDF, sendQuoteEmail } from "./quotePdf";
import { saveQuote } from "./lib/quotes";
import { formatPrice } from "./ConfiguratorShared";

export default function QuoteModal({ isOpen, onClose, quote, productName, productType, config }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [markupPercent, setMarkupPercent] = useState("");
  const [montaj, setMontaj] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sendMethod, setSendMethod] = useState("email");

  if (!isOpen) return null;

  const markupPct = parseFloat(markupPercent) || 0;
  const montajEur = parseFloat(montaj) || 0;
  const baseTotal = quote?.total || 0;
  const markupValue = Math.round(baseTotal * markupPct / 100);
  const finalTotal = baseTotal + markupValue + montajEur;

  const validation = validateForm({
    name: form.name,
    email: form.email,
    phone: form.phone,
    message: form.message,
  });
  const errors = touched ? validation.errors : {};
  const canSubmit = validateForm({ name: form.name, email: form.email }).valid;

  const handleSend = async () => {
    setTouched(true);
    const check = validateForm({ name: form.name, email: form.email, phone: form.phone, message: form.message });
    if (!check.valid) return;

    saveQuote({
      client_name: form.name,
      client_email: form.email,
      client_phone: form.phone || undefined,
      client_message: form.message || undefined,
      product_name: productName,
      product_type: productType || undefined,
      config: { ...config, _breakdown: quote },
      quote_total: finalTotal,
      quote_subtotal: quote?.subtotal ? parseFloat(String(quote.subtotal)) : undefined,
      quote_vat: quote?.vat ? parseFloat(String(quote.vat)) : undefined,
      markup_percent: markupPct || undefined,
      markup_value: markupValue || undefined,
      montaj: montajEur || undefined,
      wa_recipient: waNumber || undefined,
      send_method: sendMethod as 'email' | 'whatsapp' | 'pdf',
    });

    if (sendMethod === "pdf") {
      generateQuotePDF({
        productName,
        quote: { ...quote, markupPercent: markupPct, markupValue, montaj: montajEur, finalTotal },
        config,
        clientInfo: form,
      });
      setSent(true);
      return;
    }

    if (sendMethod === "email") {
      setSending(true);
      try {
        await sendQuoteEmail({
          productName,
          quote: { ...quote, markupPercent: markupPct, markupValue, montaj: montajEur, finalTotal },
          config,
          clientInfo: form,
        });
        setSent(true);
      } catch (err) {
        alert("Eroare la trimitere: " + err.message);
      } finally {
        setSending(false);
      }
      return;
    }

    if (sendMethod === "whatsapp") {
      const lines = [];
      lines.push(`*Cerere Ofertă — ${productName}*`);
      lines.push("");
      lines.push(`👤 *Client:* ${form.name}`);
      if (form.phone) lines.push(`📞 *Telefon:* ${form.phone}`);
      if (form.email) lines.push(`📧 *Email:* ${form.email}`);
      lines.push("");
      if (config) {
        lines.push("*📐 Configurație:*");
        if (config.length) lines.push(`• Lungime: ${config.length}m`);
        if (config.width) lines.push(`• Lățime: ${config.width}m`);
        if (config.depth) lines.push(`• Adâncime: ${config.depth}m`);
        if (config.height) lines.push(`• Înălțime: ${config.height}m`);
        if (config.glassType) lines.push(`• Sticlă: ${config.glassType}`);
        if (config.glassShape) lines.push(`• Formă: ${config.glassShape}`);
        if (config.hardware) lines.push(`• Feronerie: ${config.hardware}`);
        if (config.enclosure) lines.push(`• Tip cabină: ${config.enclosure}`);
        if (config.nrPanouri) lines.push(`• Nr. panouri: ${config.nrPanouri}`);
        if (config.system) lines.push(`• Sistem: ${config.system}`);
        lines.push("");
      }
      if (quote) {
        lines.push("*💰 Detalii Preț:*");
        lines.push(`• Preț bază: ${formatPrice(baseTotal)}`);
        if (markupPct > 0) lines.push(`• Adaos (${markupPct}%): +${formatPrice(markupValue)}`);
        if (montajEur > 0) lines.push(`• Montaj: +${formatPrice(montajEur)}`);
        lines.push(`• *Total: ${formatPrice(finalTotal)}*`);
        if (quote.area) {
          lines.push(`  (Suprafață: ${quote.area} m² · Subtotal: ${formatPrice(quote.subtotal)} + TVA ${formatPrice(quote.vat)})`);
        }
      }
      if (form.message) {
        lines.push("");
        lines.push(`💬 *Mesaj:* ${form.message}`);
      }

      const msg = encodeURIComponent(lines.join("\n"));
      const targetNumber = waNumber.trim() || "40734712187";
      window.open(`https://wa.me/${targetNumber.replace(/\D/g,"")}?text=${msg}`, "_blank");
      setSent(true);
    }
  };

  const handleClose = () => {
    setForm({ name: "", email: "", phone: "", message: "" });
    setMarkupPercent("");
    setMontaj("");
    setWaNumber("");
    setTouched(false);
    setSent(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="glass-card w-full max-w-lg rounded-2xl p-8"
        style={{ border: "1px solid rgba(200,169,110,0.3)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-8 anim-fade-in">
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(200,169,110,0.15)", border: "2px solid #c8a96e",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
            }}>
              <Check size={28} color="#c8a96e" />
            </div>
            <h3 className="serif" style={{ fontSize: "1.6rem", marginBottom: 8 }}>
              {sendMethod === "pdf" ? "PDF generat!" : "Cerere trimisă!"}
            </h3>
            <p style={{ color: "rgba(240,237,232,0.55)", marginBottom: 28 }}>
              {sendMethod === "pdf"
                ? "Fereastra de print s-a deschis. Alege 'Salvează ca PDF' din opțiunile de print."
                : sendMethod === "whatsapp"
                ? "WhatsApp s-a deschis. Trimite mesajul pentru a solicita oferta."
                : "Ți-am trimis oferta pe email — verifică și folderul Spam dacă nu o vezi."}
            </p>
            <button className="btn-primary w-full" onClick={handleClose}>Închide</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
              <div>
                <h3 className="serif" style={{ fontSize: "1.5rem", marginBottom: 4 }}>Solicită Ofertă</h3>
                <p style={{ color: "rgba(240,237,232,0.45)", fontSize: "0.85rem" }}>{productName}</p>
              </div>
              <button className="btn-ghost" style={{ padding: "8px" }} onClick={handleClose}>
                <X size={18} />
              </button>
            </div>

            {/* Quote summary */}
            {quote && (
              <div style={{
                background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: 12, padding: "16px 20px", marginBottom: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(240,237,232,0.6)", fontSize: "0.85rem" }}>Preț bază</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#c8a96e" }}>{formatPrice(baseTotal)}</span>
                </div>
                {(markupPct > 0 || montajEur > 0) && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 10 }}>
                    {markupPct > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.8rem" }}>Adaos {markupPct}%</span>
                        <span style={{ color: "rgba(100,200,120,0.7)", fontSize: "0.85rem" }}>+{formatPrice(markupValue)}</span>
                      </div>
                    )}
                    {montajEur > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.8rem" }}>Montaj</span>
                        <span style={{ color: "rgba(100,200,120,0.7)", fontSize: "0.85rem" }}>+{formatPrice(montajEur)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 8, borderTop: "1px solid rgba(200,169,110,0.15)" }}>
                      <span style={{ color: "rgba(240,237,232,0.6)", fontSize: "0.85rem", fontWeight: 600 }}>Total final</span>
                      <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#c8a96e" }}>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                )}
                <div style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.78rem", marginTop: 4 }}>
                  {quote.area && <>Suprafață: {quote.area} m² · </>}Subtotal: {formatPrice(quote.subtotal)} + TVA {formatPrice(quote.vat)}
                </div>
              </div>
            )}

            {/* Markup & Montaj */}
            {quote && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                    Adaos (%)
                  </label>
                  <input className="input-field" type="number" min="0" max="200" placeholder="0"
                    value={markupPercent}
                    onChange={e => setMarkupPercent(e.target.value)}
                    style={{ padding: "8px 12px", fontSize: "0.82rem" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                    Montaj (€)
                  </label>
                  <input className="input-field" type="number" min="0" placeholder="0"
                    value={montaj}
                    onChange={e => setMontaj(e.target.value)}
                    style={{ padding: "8px 12px", fontSize: "0.82rem" }} />
                </div>
              </div>
            )}

            {/* WhatsApp destination */}
            {sendMethod === "whatsapp" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.78rem", color: "rgba(37,211,102,0.7)", display: "block", marginBottom: 6 }}>
                  Trimite către (WhatsApp)
                </label>
                <input className="input-field" type="tel" placeholder="+40 7xx xxx xxx"
                  value={waNumber}
                  onChange={e => setWaNumber(e.target.value)}
                  style={{ padding: "8px 12px", fontSize: "0.82rem", borderColor: waNumber ? "rgba(37,211,102,0.3)" : undefined }} />
                {!waNumber && <div style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.35)", marginTop: 4 }}>Implicit: Glass Associates</div>}
              </div>
            )}

            {/* Send method selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", display: "block", marginBottom: 8 }}>Metodă trimitere</label>
              <div style={{ display: "grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 8 }}>
                {[
                  { key: "email", icon: <Mail size={14} />, label: "Email" },
                  { key: "whatsapp", icon: <Send size={14} />, label: "WhatsApp" },
                  { key: "pdf", icon: <FileText size={14} />, label: "PDF" },
                ].map(m => (
                  <button key={m.key} onClick={() => setSendMethod(m.key)}
                    className={sendMethod === m.key ? "btn-primary" : "btn-ghost"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", fontSize: "0.8rem" }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.name ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Nume complet <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span>
                </label>
                <input className="input-field" placeholder="Ion Popescu" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.name ? "rgba(239,68,68,0.5)" : undefined }} />
                {errors.name && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.email ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Email <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span>
                </label>
                <input className="input-field" type="email" placeholder="ion@exemplu.ro" value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.email ? "rgba(239,68,68,0.5)" : undefined }} />
                {errors.email && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.email}</div>}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.phone ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Telefon {sendMethod === "whatsapp" && <span style={{ color: "rgba(37,211,102,0.6)" }}>*</span>}
                </label>
                <input className="input-field" placeholder="07xx xxx xxx" value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.phone ? "rgba(239,68,68,0.5)" : undefined }} />
                {errors.phone && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.phone}</div>}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.message ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Mesaj / Detalii suplimentare
                </label>
                <textarea className="input-field" rows={3} placeholder="Ex: proiect rezidențial, termen de execuție..."
                  value={form.message}
                  onChange={e => { setForm({ ...form, message: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ resize: "vertical", minHeight: 80, borderColor: errors.message ? "rgba(239,68,68,0.5)" : undefined }} />
                {errors.message && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.message}</div>}
              </div>

              <button
                className="btn-primary w-full"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
                disabled={!canSubmit || sending}
                onClick={handleSend}
              >
                {sending ? (
                  <><Loader2 size={18} className="animate-spin" /> Se trimite...</>
                ) : sendMethod === "pdf" ? (
                  <><Download size={16} /> Generează PDF</>
                ) : sendMethod === "whatsapp" ? (
                  <><Send size={16} /> Deschide WhatsApp</>
                ) : (
                  <><Mail size={16} /> Trimite pe Email</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
