const API_BASE_URL = process.env.API_BASE_URL;

export async function requestAIConsultant(payload) {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL must be configured before calling the AI consultant API");
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/ai-consultant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI consultant request failed with status ${response.status}`);
  }

  return response.json();
}
