import { readJsonBody, sendJson } from "./_lib/request.js";
import { AI_CONSULTANT_SYSTEM_PROMPT } from "../../shared/ai-consultant-prompt.js";

// Suportă Anthropic (default), OpenAI sau Ollama (dev local)
const AI_PROVIDER = process.env.AI_PROVIDER || "anthropic"; // "anthropic" | "openai" | "ollama"
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function callAnthropic(messages) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY lipsește");

  // Extrage system prompt și mesajele user/assistant
  const userMessages = messages.filter(m => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // rapid și ieftin pentru chat
      max_tokens: 512,
      system: AI_CONSULTANT_SYSTEM_PROMPT,
      messages: userMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "{}";
}

async function callOpenAI(messages) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY lipsește");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function callOllama(messages) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const data = await res.json();
  return data?.message?.content || "{}";
}

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

    // Construiește istoricul conversației
    const messages = [{ role: "system", content: AI_CONSULTANT_SYSTEM_PROMPT }];
    if (Array.isArray(conversation)) {
      // Păstrăm max ultimele 10 mesaje pentru a limita tokenii
      const recent = conversation.slice(-10).filter(m => m.role !== "system");
      messages.push(...recent);
    }
    messages.push({ role: "user", content: message });

    let raw;
    if (AI_PROVIDER === "anthropic") {
      raw = await callAnthropic(messages);
    } else if (AI_PROVIDER === "openai") {
      raw = await callOpenAI(messages);
    } else {
      raw = await callOllama(messages);
    }

    // Parsează JSON din răspuns
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      return sendJson(res, 200, parsed);
    } catch {
      // Fallback dacă modelul nu returnează JSON valid
      return sendJson(res, 200, {
        reply: raw,
        missingFields: [],
        confidence: 0,
        prefill: {},
      });
    }
  } catch (error) {
    console.error("AI consultant error:", error);
    return sendJson(res, 502, { error: "Serviciul AI este temporar indisponibil" });
  }
}
