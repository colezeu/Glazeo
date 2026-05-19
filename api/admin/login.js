import { generateToken, getAdminPassword } from "../_lib/auth.js";
import { readJsonBody, sendJson } from "../_lib/request.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const { password } = readJsonBody(req);
  if (password !== getAdminPassword()) {
    return sendJson(res, 401, { error: "Parola incorecta" });
  }

  const { token, expiresIn } = generateToken();
  return sendJson(res, 200, { token, expiresIn });
}
