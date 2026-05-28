import { useState, useRef, useEffect } from "react";
import { Bot, User, Send, Loader2, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { apiUrl } from "./api";

const AI_TIMEOUT = 15000; // 15 secunde timeout

export default function AIConsultant({ productType, currentConfig, onApplyPrefill }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Salut! Sunt consultantul Glass Associates. Spune-mi ce anume cauți și ce dimensiuni ai nevoie, și te voi ajuta să configurezi produsul perfect. 🏠",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrefill, setLastPrefill] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(null); // null = checking, true/false
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Verifică dacă AI-ul e disponibil
  useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await fetch(apiUrl("/ai-consultant"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productType, message: "ping", currentConfig: {} }),
          signal: AbortSignal.timeout(5000),
        });
        setAiAvailable(res.ok);
      } catch {
        setAiAvailable(false);
      }
    };
    checkAI();
  }, [productType]);

  // Auto-scroll la ultimul mesaj
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    // Creez AbortController pentru timeout
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout automat
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AI_TIMEOUT);

    try {
      const res = await fetch(apiUrl("/ai-consultant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          message: text,
          currentConfig,
          conversation: nextMessages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Am analizat cererea ta. Pot să te ajut cu ceva anume?",
      }]);

      if (data.prefill) {
        setLastPrefill(data.prefill);
      }
    } catch (err) {
      clearTimeout(timeoutId);

      let errorMsg;
      if (err.name === "AbortError") {
        errorMsg = "Consultantul AI a durat prea mult să răspundă. Încearcă din nou cu un mesaj mai scurt.";
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        errorMsg = "Nu mă pot conecta la serverul AI. Asigură-te că server-ul local (Ollama) rulează pe portul 3001.";
        setAiAvailable(false);
      } else {
        errorMsg = "A apărut o problemă. Încearcă din nou.";
      }

      setError(errorMsg);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMsg,
        isError: true,
      }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: 520,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(200,169,110,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot size={16} color="#c8a96e" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Consultant AI</div>
          <div style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4 }}>
            {aiAvailable === null ? (
              <><Loader2 size={10} className="animate-spin" /> Se verifică...</>
            ) : aiAvailable ? (
              <><Wifi size={10} color="#22c55e" /> Online</>
            ) : (
              <><WifiOff size={10} color="#ef4444" /> Offline — Folosește configuratorul manual</>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: 200, maxHeight: 340,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user"
                ? "rgba(200,169,110,0.2)"
                : msg.isError
                ? "rgba(239,68,68,0.1)"
                : "rgba(255,255,255,0.06)",
              fontSize: "0.85rem",
              lineHeight: 1.55,
              color: msg.isError ? "#fca5a5" : "#f0ede8",
            }}>
              {msg.isError && <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: "middle", color: "#ef4444" }} />}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
              background: "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Loader2 size={14} className="animate-spin" color="#c8a96e" />
              <span style={{ fontSize: "0.82rem", color: "rgba(240,237,232,0.5)" }}>Se gândește...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prefill suggestion */}
      {lastPrefill && onApplyPrefill && (
        <div style={{
          padding: "10px 18px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(200,169,110,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "0.78rem", color: "rgba(240,237,232,0.5)" }}>
            ✨ AI a detectat valori pentru configurație
          </span>
          <button
            onClick={() => onApplyPrefill(lastPrefill)}
            style={{
              padding: "6px 14px", borderRadius: 8,
              background: "rgba(200,169,110,0.2)", border: "1px solid rgba(200,169,110,0.4)",
              color: "#c8a96e", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Aplică sugestia
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "12px 18px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={aiAvailable === false ? "AI offline — configurează manual" : "Scrie un mesaj..."}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#f0ede8", fontSize: "0.85rem", outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 14px", borderRadius: 10, border: "none",
            background: loading || !input.trim() ? "rgba(200,169,110,0.2)" : "#c8a96e",
            color: loading || !input.trim() ? "rgba(200,169,110,0.4)" : "#0f1117",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
