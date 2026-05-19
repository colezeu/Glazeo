import { sendJson } from "../_lib/request.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  return sendJson(res, 200, { ok: true });
}
