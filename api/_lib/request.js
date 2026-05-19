export function readJsonBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

export function sendJson(res, status, payload) {
  res.status(status).json(payload);
}
