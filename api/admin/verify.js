import { readBearerToken, verifyToken } from "../_lib/auth.js";
import { sendJson } from "../_lib/request.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const token = readBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return sendJson(res, 401, { error: "Invalid or expired token" });
  }

  return sendJson(res, 200, { valid: true });
}
