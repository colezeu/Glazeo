import { readJsonBody, sendJson } from "./_lib/request.js";
import { AI_CONSULTANT_SYSTEM_PROMPT } from "../../shared/ai-consultant-prompt.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

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

    const messages = [{ role: "system", content: AI_CONSULTANT_SYSTEM_PROMPT }];
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
