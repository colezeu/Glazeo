import { readJsonBody, sendJson } from "../_lib/request.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.QUOTE_TO_EMAIL || "office@glass.associates";
const CC_EMAIL = process.env.QUOTE_CC_EMAIL || "";
const FROM_EMAIL = process.env.QUOTE_FROM_EMAIL || "oferte@glazeo.ro";

function formatConfig(config) {
  if (!config || typeof config !== "object") return "—";
  return Object.entries(config)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `  • ${k}: ${v}`)
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const { productName, quote, config, client } = readJsonBody(req);

    // Validare minimă
    if (!client?.email) {
      return sendJson(res, 400, { error: "Email client lipsește" });
    }

    const totalFormatted = quote?.total
      ? `${Number(quote.total).toLocaleString("ro-RO")} EUR`
      : "—";

    const emailHtml = `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f1117;padding:28px 36px;text-align:center;">
            <img src="https://glazeo.ro/logo.png" alt="Glazeo" height="32" style="filter:invert(1);opacity:0.95;" onerror="this.style.display='none'">
            <p style="color:#c8a96e;font-size:12px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Cerere de ofertă</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 24px;font-size:20px;color:#0f1117;">Cerere nouă: ${productName || "Produs necunoscut"}</h2>

            <!-- Client -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fb;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Date client</p>
                <p style="margin:4px 0;font-size:15px;"><strong>${client?.name || "—"}</strong></p>
                <p style="margin:4px 0;font-size:14px;color:#444;">📧 <a href="mailto:${client?.email}" style="color:#c8a96e;">${client?.email}</a></p>
                ${client?.phone ? `<p style="margin:4px 0;font-size:14px;color:#444;">📞 ${client.phone}</p>` : ""}
                ${client?.company ? `<p style="margin:4px 0;font-size:14px;color:#444;">🏢 ${client.company}</p>` : ""}
                ${client?.message ? `<p style="margin:12px 0 0;font-size:14px;color:#444;font-style:italic;">"${client.message}"</p>` : ""}
              </td></tr>
            </table>

            <!-- Produs & Preț -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="50%" style="padding-right:12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fb;border-radius:8px;padding:20px;">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Produs</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#0f1117;">${productName || "—"}</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding-left:12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;padding:20px;">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#c8a96e;text-transform:uppercase;letter-spacing:1px;">Total estimat</p>
                      <p style="margin:0;font-size:22px;font-weight:700;color:#c8a96e;">${totalFormatted}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Configurație -->
            ${config ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fb;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Configurație selectată</p>
                ${Object.entries(config)
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([k, v]) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #eee;padding:8px 0;">
                    <tr>
                      <td style="font-size:13px;color:#666;width:45%;">${k}</td>
                      <td style="font-size:13px;color:#0f1117;font-weight:500;">${v}</td>
                    </tr>
                  </table>`).join("")}
              </td></tr>
            </table>` : ""}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="mailto:${client?.email}?subject=Ofertă ${productName || 'produs'} - Glazeo&body=Bună ziua ${client?.name || ''},%0A%0AVă mulțumim pentru cererea de ofertă."
                    style="display:inline-block;background:#c8a96e;color:#0f1117;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
                    Răspunde clientului
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f5;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">Glazeo — Sisteme din sticlă • <a href="https://glazeo.ro" style="color:#c8a96e;">glazeo.ro</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Trimite prin Resend
    if (!RESEND_API_KEY) {
      // Fără Resend configurat — logăm și returnăm OK (dev mode)
      console.log("=== CERERE OFERTA (Resend nedisponibil) ===");
      console.log("Client:", client?.name, client?.email, client?.phone);
      console.log("Produs:", productName);
      console.log("Total:", quote?.total, "EUR");
      console.log("Config:", JSON.stringify(config, null, 2));
      console.warn("[quote] RESEND_API_KEY lipsește — emailul nu a fost trimis");
      return sendJson(res, 200, { ok: true, message: "Cerere înregistrată (dev mode)" });
    }

    const recipients = [TO_EMAIL];
    if (CC_EMAIL) recipients.push(CC_EMAIL);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        reply_to: client?.email,
        subject: `[Ofertă nouă] ${productName || "Produs"} — ${client?.name || client?.email}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error("[quote] Resend error:", err);
      // Nu întoarce eroare clientului — cererea a ajuns, emailul e problema noastră
    } else {
      console.log("[quote] Email trimis cu succes via Resend");
    }

    return sendJson(res, 200, { ok: true, message: "Cerere înregistrată" });
  } catch (error) {
    console.error("Quote request error:", error);
    return sendJson(res, 500, { error: "Eroare la trimiterea cererii" });
  }
}
