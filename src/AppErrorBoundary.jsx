import React from "react";
import { Link } from "react-router-dom";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("UI render error:", error);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 560, width: "100%", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(255,255,255,0.04)", borderRadius: 18, padding: "28px" }}>
          <img src="/logo.png" alt="Glass Associates" style={{ height: 28, filter: "invert(1)", opacity: 0.95, marginBottom: 20 }} />
          <h1 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Pagina a întâmpinat o eroare</h1>
          <p style={{ color: "rgba(240,237,232,0.62)", lineHeight: 1.6, marginBottom: 16 }}>
            Am oprit randarea ca să nu rămână ecranul alb. Mesajul tehnic este afișat mai jos și ne ajută să vedem exact ce a crăpat.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.82rem", color: "#fda4af", background: "rgba(15,17,23,0.7)", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <Link to="/" style={{ color: "#c8a96e", textDecoration: "none", fontWeight: 600 }}>
            Înapoi la homepage
          </Link>
        </div>
      </div>
    );
  }
}
