import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ─── ADMIN AUTH ────────────────────────────────────────────────
// Parola e citită din variabila de mediu (fallback pentru dev)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "glass2026";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "glass-associates-secret-key-2026";
const TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 oră

// Store în memorie pentru token-uri active (suficient pentru un singur admin)
const activeTokens = new Map();

function generateToken() {
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + TOKEN_MAX_AGE,
    jti: crypto.randomBytes(16).toString("hex"),
  };
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("hex");
  return Buffer.from(data).toString("base64url") + "." + signature;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [dataB64, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(Buffer.from(dataB64, "base64url").toString())
    .digest("hex");
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(dataB64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.admin = payload;
  next();
}

// POST /admin/login — primește { password }, returnează { token }
app.post("/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Parolă incorectă" });
  }
  const token = generateToken();
  res.json({ token, expiresIn: TOKEN_MAX_AGE });
});

// POST /admin/verify — verifică dacă token-ul e valid
app.post("/admin/verify", authMiddleware, (req, res) => {
  res.json({ valid: true });
});

// POST /admin/logout — invalidate token (opțional, client șterge)
app.post("/admin/logout", authMiddleware, (req, res) => {
  res.json({ ok: true });
});

// ─── AI CONSULTANT ─────────────────────────────────────────────
app.post("/ai-consultant", async (req, res) => {
  try {
    const { productType, message, currentConfig, conversation } = req.body || {};

    const systemPrompt = `
Ești un consultant comercial pentru configuratorul de cabine duș Glass Associates.

Rol:
- ajuți clientul să aleagă produsul potrivit
- extragi valori pentru configurator
- NU calculezi prețuri
- NU inventezi reguli tehnice

Trebuie să returnezi EXCLUSIV JSON valid, în schema:

{
  "reply": "string",
  "missingFields": ["string"],
  "confidence": 0.0,
  "prefill": {
    "width": "number|null",
    "depth": "number|null",
    "height": "number|string|null",
    "enclosure": "paravan-fix-profil|paravan-fix-punctual|paravan-mobil|usa-batanta|usa-culisanta-vedere|usa-culisanta-sina|null",
    "glassType": "8mm|10mm|null",
    "treatment": "clear|frosted|nano|null",
    "options": {
      "towelBar": false,
      "seat": false,
      "led": false
    }
  }
}

Reguli de interpretare:
- dacă utilizatorul spune 120x90, interpretează width=1.2 și depth=0.9
- dacă spune înălțime 2 metri, height="2.0"
- "ușor de curățat" sugerează treatment="nano"
- "opac" sau "intimitate" sugerează treatment="frosted"
- pentru cabină standard elegantă, poți sugera "usa-batanta"
- dacă lipsesc dimensiuni, cere clarificări
`;

    const messages = [{ role: "system", content: systemPrompt }];
    if (Array.isArray(conversation)) {
      messages.push(...conversation);
    }
    messages.push({ role: "user", content: message || "" });

    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        stream: false,
        messages,
      }),
    });

    if (!ollamaRes.ok) {
      return res.status(502).json({ error: "AI service unavailable" });
    }

    const ollamaData = await ollamaRes.json();
    const raw = ollamaData?.message?.content || "{}";
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = { reply: raw, missingFields: [], confidence: 0, prefill: {} };
    }

    res.json(parsed);
  } catch (err) {
    console.error("AI consultant error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── QUOTE REQUEST (email) ──────────────────────────────────────
app.post("/quote/request", async (req, res) => {
  try {
    const { productName, quote, config, client } = req.body || {};

    // În producție: integrare cu SendGrid / Resend / Nodemailer
    // Pentru moment, logăm cererea și returnăm succes
    console.log("=== CERERE OFERTĂ ===");
    console.log("Client:", client?.name, client?.email, client?.phone);
    console.log("Produs:", productName);
    console.log("Total:", quote?.total, "€");
    console.log("Config:", JSON.stringify(config));
    console.log("=====================");

    // TODO: Integrare email service
    // const emailBody = generateEmailTemplate({ productName, quote, config, client });
    // await sendEmail({ to: "office@glassassociates.ro", subject: `Ofertă ${productName} — ${client?.name}`, html: emailBody });

    res.json({ ok: true, message: "Cerere înregistrată" });
  } catch (err) {
    console.error("Quote request error:", err);
    res.status(500).json({ error: "Eroare la trimiterea cererii" });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Glass Associates API running on :${PORT}`);
});
