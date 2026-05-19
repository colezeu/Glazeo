import { readJsonBody, sendJson } from "../_lib/request.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const { productName, quote, config, client } = readJsonBody(req);

    console.log("=== CERERE OFERTA ===");
    console.log("Client:", client?.name, client?.email, client?.phone);
    console.log("Produs:", productName);
    console.log("Total:", quote?.total, "EUR");
    console.log("Config:", JSON.stringify(config));
    console.log("=====================");

    return sendJson(res, 200, { ok: true, message: "Cerere inregistrata" });
  } catch (error) {
    console.error("Quote request error:", error);
    return sendJson(res, 500, { error: "Eroare la trimiterea cererii" });
  }
}
