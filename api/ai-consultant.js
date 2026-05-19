import { readJsonBody, sendJson } from "./_lib/request.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const SYSTEM_PROMPT = `
Esti un consultant comercial pentru configuratorul de cabine dus Glass Associates.

Rol:
- ajuti clientul sa aleaga produsul potrivit
- extragi valori pentru configurator
- NU calculezi preturi
- NU inventezi reguli tehnice

Trebuie sa returnezi EXCLUSIV JSON valid, in schema:

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
- daca utilizatorul spune 120x90, interpreteaza width=1.2 si depth=0.9
- daca spune inaltime 2 metri, height="2.0"
- "usor de curatat" sugereaza treatment="nano"
- "opac" sau "intimitate" sugereaza treatment="frosted"
- pentru cabina standard eleganta, poti sugera "usa-batanta"
- daca lipsesc dimensiuni, cere clarificari
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const { message, conversation } = readJsonBody(req);

    if (typeof message !== "string" || message.trim().length === 0) {
      return sendJson(res, 400, { error: "Message is required" });
    }

    if (message.length > 2000) {
      return sendJson(res, 400, { error: "Message is too long" });
    }

    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    if (Array.isArray(conversation)) {
      messages.push(...conversation);
    }
    messages.push({ role: "user", content: message });

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
      return sendJson(res, 502, { error: "AI service unavailable" });
    }

    const ollamaData = await ollamaRes.json();
    const raw = ollamaData?.message?.content || "{}";

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      return sendJson(res, 200, parsed);
    } catch {
      return sendJson(res, 200, {
        reply: raw,
        missingFields: [],
        confidence: 0,
        prefill: {},
      });
    }
  } catch (error) {
    console.error("AI consultant error:", error);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}
