import crypto from "crypto";

const TOKEN_MAX_AGE = 60 * 60 * 1000;

function readRequiredSecret(name, fallback) {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set in production`);
  }

  return fallback;
}

export function getAdminPassword() {
  return readRequiredSecret("ADMIN_PASSWORD", "change-me-dev-password");
}

function getTokenSecret() {
  return readRequiredSecret("TOKEN_SECRET", "local-dev-token-secret");
}

function signPayload(data) {
  return crypto.createHmac("sha256", getTokenSecret()).update(data).digest("hex");
}

export function generateToken() {
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + TOKEN_MAX_AGE,
    jti: crypto.randomBytes(16).toString("hex"),
  };
  const data = JSON.stringify(payload);
  const signature = signPayload(data);
  return {
    token: `${Buffer.from(data).toString("base64url")}.${signature}`,
    expiresIn: TOKEN_MAX_AGE,
  };
}

export function verifyToken(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [dataB64, signature] = parts;
  const rawData = Buffer.from(dataB64, "base64url").toString();
  const expected = signPayload(rawData);

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(rawData);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !String(authHeader).startsWith("Bearer ")) return null;
  return String(authHeader).slice(7);
}
