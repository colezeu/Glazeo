// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { Save, Download, Upload, Lock, LogOut, Check, AlertTriangle } from "lucide-react";
import { apiUrl } from "./api";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [saving, setSaving] = useState(false);

  // Verifică dacă există token salvat în localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("ga_admin_token");
    if (savedToken) {
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (tok) => {
    try {
      const res = await fetch(apiUrl("/admin/verify"), {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        setToken(tok);
        setAuthenticated(true);
        loadCatalog();
      } else {
        localStorage.removeItem("ga_admin_token");
      }
    } catch {
      localStorage.removeItem("ga_admin_token");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(apiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Parolă incorectă");
      }
      const data = await res.json();
      localStorage.setItem("ga_admin_token", data.token);
      setToken(data.token);
      setAuthenticated(true);
      loadCatalog();
    } catch (err) {
      setLoginError(err.message || "Eroare de conexiune la server");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/admin/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem("ga_admin_token");
    setToken(null);
    setAuthenticated(false);
    setPassword("");
  };

  const loadCatalog = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch("/catalog.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCatalog(data);
        return;
      } catch (err) {
        if (i === retries - 1) {
          setStatus({ type: "error", msg: `Nu s-a putut încărca catalogul (${retries} încercări)` });
        } else {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: "", msg: "" });
    try {
      // Salvăm în localStorage ca backup (persistă între sesiuni)
      localStorage.setItem("ga_catalog_backup", JSON.stringify(catalog, null, 2));
      setStatus({ type: "success", msg: "Catalog salvat local (backup). Pe server, salvează fișierul descărcat peste catalog.json din repo." });
    } catch {
      setStatus({ type: "error", msg: "Eroare la salvare" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setCatalog(data);
        setStatus({ type: "success", msg: "Catalog importat cu succes" });
      } catch {
        setStatus({ type: "error", msg: "Fișier JSON invalid" });
      }
    };
    reader.readAsText(file);
  };

  const updatePrice = (category, subcategory, field, value) => {
    if (!catalog) return;
    const updated = { ...catalog };
    if (updated[category]?.[subcategory]) {
      updated[category][subcategory][field] = parseFloat(value) || 0;
      setCatalog(updated);
    }
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0ede8" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, backdropFilter: "blur(20px)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(200,169,110,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Lock size={24} color="#c8a96e" />
            </div>
            <img src="/logo.png" alt="Glass Associates" style={{ height: 28, maxWidth: "100%", objectFit: "contain", filter: "invert(1)", opacity: 0.95, margin: "0 auto" }} />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginTop: 16 }}>Admin Catalog</h2>
            <p style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.85rem", marginTop: 8 }}>Introduceți parola pentru a accesa panoul de administrare</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "rgba(240,237,232,0.5)", marginBottom: 8 }}>Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: loginError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)", color: "#f0ede8", fontSize: "0.95rem",
                  outline: "none", boxSizing: "border-box"
                }}
              />
              {loginError && (
                <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={12} /> {loginError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loginLoading || !password}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loginLoading || !password ? "rgba(200,169,110,0.3)" : "#c8a96e",
                color: "#0f1117", fontWeight: 700, fontSize: "0.95rem", cursor: loginLoading || !password ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {loginLoading ? "Se verifică..." : <>Autentificare <Lock size={14} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── ADMIN PANEL ─────────────────────────────────────────────
  if (!catalog) return <div style={{ color: "#f0ede8", padding: 40 }}>Se încarcă catalogul...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8", padding: "32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Admin Catalog</h1>
            <p style={{ color: "rgba(240,237,232,0.4)", fontSize: "0.85rem", marginTop: 4 }}>Editați prețurile din catalog</p>
          </div>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(240,237,232,0.5)", cursor: "pointer", fontSize: "0.82rem" }}>
            <LogOut size={14} /> Deconectare
          </button>
        </div>

        {/* Status */}
        {status.msg && (
          <div style={{
            padding: "12px 20px", borderRadius: 12, marginBottom: 24, fontSize: "0.85rem",
            background: status.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${status.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: status.type === "success" ? "#22c55e" : "#ef4444",
            display: "flex", alignItems: "center", gap: 8
          }}>
            {status.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
            {status.msg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={14} /> {saving ? "Se salvează..." : "Salvează"}
          </button>
          <button onClick={handleExport} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={14} /> Export JSON
          </button>
          <label className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <Upload size={14} /> Import JSON
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>

        {/* Catalog sections */}
        {Object.entries(catalog).map(([catKey, catVal]) => (
          <div key={catKey} style={{ marginBottom: 40, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "#c8a96e", textTransform: "uppercase", letterSpacing: "0.05em" }}>{catKey}</h2>
            {Object.entries(catVal).map(([subKey, subVal]) => (
              <div key={subKey} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12 }}>{subKey}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {Object.entries(subVal).map(([field, val]) => (
                    <div key={field}>
                      <label style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>{field}</label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => updatePrice(catKey, subKey, field, e.target.value)}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                          color: "#f0ede8", fontSize: "0.85rem", outline: "none", boxSizing: "border-box"
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
