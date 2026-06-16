import { readJsonBody, sendJson } from "../_lib/request.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.QUOTE_TO_EMAIL || "office@glass.associates";
const CC_EMAIL = process.env.QUOTE_CC_EMAIL || "";
const FROM_EMAIL = process.env.QUOTE_FROM_EMAIL || "oferte@glazeo.ro";

// URL-ul public al logo-ului — se ia din env sau fallback la domeniu
const LOGO_URL = process.env.LOGO_PUBLIC_URL || "https://glazeo.ro/logo.png";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const { productName, quote, config, client } = readJsonBody(req);

    if (!client?.email) {
      return sendJson(res, 400, { error: "Email client lipsește" });
    }

    const totalFormatted = quote?.total
      ? `${Number(quote.total).toLocaleString("ro-RO")} EUR`
      : "—";

    const configRows = config
      ? Object.entries(config)
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => `
            <tr>
              <td style="padding:9px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:45%;">${k}</td>
              <td style="padding:9px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">${v}</td>
            </tr>`).join("")
      : "";

    const emailHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cerere ofertă — Glazeo</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:#0f1117;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="Glazeo" height="36" style="max-width:200px;filter:invert(1);opacity:0.95;display:block;margin:0 auto;">
            <p style="margin:14px 0 0;color:#c8a96e;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Cerere de ofertă nouă</p>
          </td>
        </tr>

        <!-- ── BADGE PRODUS ── -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 0 20px;">
                  <div style="display:inline-block;background:#fef9f0;border:1px solid #f0d99a;border-radius:8px;padding:10px 18px;">
                    <span style="font-size:12px;color:#92720a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📦 ${productName || "Produs"}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── DATE CLIENT ── -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Date client</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;">
                        <span style="font-size:18px;font-weight:700;color:#111827;">${client?.name || "—"}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <a href="mailto:${client?.email}" style="font-size:14px;color:#c8a96e;text-decoration:none;">✉️ ${client?.email}</a>
                      </td>
                    </tr>
                    ${client?.phone ? `<tr><td style="padding:4px 0;font-size:14px;color:#4b5563;">📞 ${client.phone}</td></tr>` : ""}
                    ${client?.company ? `<tr><td style="padding:4px 0;font-size:14px;color:#4b5563;">🏢 ${client.company}</td></tr>` : ""}
                    ${client?.message ? `
                    <tr>
                      <td style="padding:14px 16px;margin-top:12px;background:#ffffff;border-radius:8px;border-left:3px solid #c8a96e;font-size:14px;color:#374151;font-style:italic;line-height:1.6;">
                        "${client.message}"
                      </td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── TOTAL ── -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#c8a96e;text-transform:uppercase;letter-spacing:1.5px;">Total estimat</p>
                        <p style="margin:0;font-size:28px;font-weight:800;color:#c8a96e;">${totalFormatted}</p>
                      </td>
                      <td align="right">
                        <a href="mailto:${client?.email}?subject=Ofertă ${encodeURIComponent(productName || 'produs')} — Glazeo&body=Bună ziua ${encodeURIComponent(client?.name || '')},%0A%0A"
                          style="display:inline-block;background:#c8a96e;color:#0f1117;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;white-space:nowrap;">
                          Răspunde clientului →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CONFIGURATIE ── -->
        ${configRows ? `
        <tr>
          <td style="background:#ffffff;padding:0 40px 28px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Configurație selectată</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;">
              ${configRows}
            </table>
          </td>
        </tr>` : ""}

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 32px;">
            <div style="height:1px;background:#f3f4f6;"></div>
          </td>
        </tr>

        <!-- ── SEMNĂTURĂ ── -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Logo semnătură -->
                <td width="60" valign="middle" style="padding-right:16px;">
                  <div style="width:52px;height:52px;background:#0f1117;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    <img src="${LOGO_URL}" alt="Glazeo" width="36" style="filter:invert(1);opacity:0.95;display:block;margin:8px auto;">
                  </div>
                </td>
                <!-- Text semnătură -->
                <td valign="middle">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#0f1117;">Echipa Glazeo</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Sisteme din sticlă premium</p>
                  <p style="margin:6px 0 0;">
                    <a href="https://glazeo.ro" style="font-size:12px;color:#c8a96e;text-decoration:none;">glazeo.ro</a>
                    <span style="color:#d1d5db;margin:0 6px;">·</span>
                    <a href="mailto:office@glass.associates" style="font-size:12px;color:#c8a96e;text-decoration:none;">office@glass.associates</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Acest email a fost generat automat de configuratorul Glazeo.<br>
              © ${new Date().getFullYear()} Glass Associates SRL · <a href="https://glazeo.ro" style="color:#9ca3af;">glazeo.ro</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

    // ── Trimitere Resend ──
    if (!RESEND_API_KEY) {
      console.log("=== CERERE OFERTA (dev mode — Resend lipsește) ===");
      console.log("Client:", client?.name, client?.email);
      console.log("Produs:", productName, "| Total:", quote?.total, "EUR");
      return sendJson(res, 200, { ok: true, message: "Cerere înregistrată (dev)" });
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
        subject: `[Ofertă] ${productName || "Produs"} — ${client?.name || client?.email}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error("[quote] Resend error:", err);
      // Nu returnăm eroare clientului — cererea e înregistrată
    } else {
      console.log("[quote] Email trimis cu succes via Resend");
    }

    return sendJson(res, 200, { ok: true, message: "Cerere înregistrată" });
  } catch (error) {
    console.error("Quote request error:", error);
    return sendJson(res, 500, { error: "Eroare la trimiterea cererii" });
  }
}
