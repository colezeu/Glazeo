import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// ─── ADMIN AUTH ────────────────────────────────────────────────
function readRequiredSecret(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} must be set in production`);
  }
  console.warn(`[config] ${name} is missing. Using development-only fallback.`);
  return devFallback;
}

const ADMIN_PASSWORD = readRequiredSecret("ADMIN_PASSWORD", "change-me-dev-password");
const TOKEN_SECRET = readRequiredSecret("TOKEN_SECRET", crypto.randomBytes(32).toString("hex"));
const TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 oră
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

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
  activeTokens.set(payload.jti, payload.exp);
  return Buffer.from(data).toString("base64url") + "." + signature;
}

function signaturesMatch(signature, expectedSignature) {
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  return signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
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
  if (!signaturesMatch(signature, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(dataB64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    if (activeTokens.get(payload.jti) !== payload.exp) return null;
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
  req.token = token;
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
  activeTokens.delete(req.admin.jti);
  res.json({ ok: true });
});

// ─── AI CONSULTANT ─────────────────────────────────────────────
app.post("/ai-consultant", async (req, res) => {
  try {
    const { productType, message, currentConfig, conversation } = req.body || {};
    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message is too long" });
    }

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

    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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
