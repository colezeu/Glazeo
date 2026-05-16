import { useState } from "react";
import { X, Send, Check, Loader2 } from "lucide-react";
import { validateForm } from "./validation";

export default function QuoteModal({ isOpen, onClose, quote, productName, config }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  // Validare
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

    // Validează complet la submit
    const check = validateForm({
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    });
    if (!check.valid) return;

    setSending(true);
    // Simulate API call - in production connect to email service
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  const handleClose = () => {
    setForm({ name: "", email: "", phone: "", message: "" });
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
              background: "rgba(200,169,110,0.15)",
              border: "2px solid #c8a96e",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <Check size={28} color="#c8a96e" />
            </div>
            <h3 className="serif" style={{ fontSize: "1.6rem", marginBottom: 8 }}>Cerere trimisă!</h3>
            <p style={{ color: "rgba(240,237,232,0.55)", marginBottom: 28 }}>
              Vă vom contacta în maxim 24 de ore cu o ofertă detaliată.
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
                background: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 24
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(240,237,232,0.6)", fontSize: "0.85rem" }}>Total estimat</span>
                  <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#c8a96e" }}>{quote.total}€</span>
                </div>
                {quote.area && (
                  <div style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.78rem", marginTop: 4 }}>
                    Suprafață: {quote.area} m² · Subtotal: {quote.subtotal}€ + TVA {quote.vat}€
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.name ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Nume complet <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="Ion Popescu"
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.name ? "rgba(239,68,68,0.5)" : undefined }}
                />
                {errors.name && (
                  <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.name}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.email ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Email <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="ion@exemplu.ro"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.email ? "rgba(239,68,68,0.5)" : undefined }}
                />
                {errors.email && (
                  <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.email}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.phone ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Telefon
                </label>
                <input
                  className="input-field"
                  placeholder="07xx xxx xxx"
                  value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ borderColor: errors.phone ? "rgba(239,68,68,0.5)" : undefined }}
                />
                {errors.phone && (
                  <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.phone}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: errors.message ? "#ef4444" : "rgba(240,237,232,0.5)", display: "block", marginBottom: 6 }}>
                  Mesaj / Detalii suplimentare
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Ex: proiect rezidențial, termen de execuție..."
                  value={form.message}
                  onChange={e => { setForm({ ...form, message: e.target.value }); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  style={{ resize: "vertical", minHeight: 80, borderColor: errors.message ? "rgba(239,68,68,0.5)" : undefined }}
                />
                {errors.message && (
                  <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>{errors.message}</div>
                )}
              </div>

              <button
                className="btn-primary w-full"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
                disabled={!canSubmit || sending}
                onClick={handleSend}
              >
                {sending ? (
                  <><Loader2 size={18} className="animate-spin" /> Se trimite...</>
                ) : (
                  <><Send size={16} /> Trimite Cererea</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
