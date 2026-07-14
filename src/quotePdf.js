import { apiUrl } from "./api";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

/** Formatare defalcare completă pentru partiționări (coduri) */
export function formatPartitionDetails(quote, config) {
  if (!quote || !quote.kitCodes) return [];
  const q = quote.kitCodes;
  const lines = [];
  lines.push("");
  lines.push("--- Defalcare Feronerie ---");
  if (quote.nrPanouri) lines.push(`Panouri: ${quote.nrPanouri} × ${quote.eachMm || '?'}mm`);
  if (quote.costU) {
    const bareU = Math.ceil((quote.mLUcumparat || 3) / 3);
    lines.push(`Profil U (${q.profilU?.code || '11.6800.100.24'}): ${quote.costU}€ — ${bareU * 2} bare × 3m`);
  }
  if (quote.costL) {
    const bareL = Math.ceil((quote.mLLcumparat || 3) / 3);
    lines.push(`Profil L (${q.profilL?.code || '10.6970.100.24'}): ${quote.costL}€ — ${bareL * 2} bare × 3m`);
  }
  if (quote.costGarnituri) lines.push(`Garnituri UP2 (${q.garnitura?.code || '71.ND10.002.00'}): ${quote.costGarnituri}€`);
  if (quote.costImbinare > 0) lines.push(`Profile îmbinare H 90° (${q.imbinare?.code || '22.6P10.090.03'}): ${quote.costImbinare}€`);
  if (quote.costUsa > 0) lines.push(`Ușă: ${quote.costUsa}€`);
  lines.push("--------------------------------------");
  return lines;
}

function createQuoteEmail({ productName, quote, config, clientInfo }) {
  const partDetails = formatPartitionDetails(quote, config);
  const lines = [
    `Client: ${clientInfo?.name || "-"}`,
    clientInfo?.email ? `Email: ${clientInfo.email}` : null,
    clientInfo?.phone ? `Telefon: ${clientInfo.phone}` : null,
    "",
    `Produs: ${productName}`,
    quote?.total ? `Total estimat: ${quote.total} EUR` : null,
    quote?.subtotal ? `Subtotal: ${quote.subtotal} EUR` : null,
    quote?.vat ? `TVA: ${quote.vat} EUR` : null,
    "",
    "Configuratie:",
    ...Object.entries(config || {}).filter(([k]) => k !== 'dims' && k !== 'tipUsa').map(([key, value]) => `${key}: ${value}`),
    config?.dims?.width ? `Lățime: ${config.dims.width}m` : null,
    config?.dims?.height ? `Înălțime: ${config.dims.height}m` : null,
    ...partDetails,
    clientInfo?.message ? "" : null,
    clientInfo?.message ? `Mesaj: ${clientInfo.message}` : null,
  ].filter(line => line !== null);
  return { subject: `Cerere oferta - ${productName}`, body: lines.join("\n") };
}

function openMailFallback(payload) {
  const { subject, body } = createQuoteEmail(payload);
  const params = new URLSearchParams({ subject, body, cc: 'srldigima@gmail.com' });
  window.location.href = `mailto:office@glass.associates?${params.toString()}`;
  return { ok: true, fallback: "mailto" };
}

function buildConfigLines(config, quote) {
  const lines = [];
  if (!config) return lines;

  if (config.dims?.width && typeof config.dims === 'object') {
    if (config.dims.width) lines.push(`Lățime: ${config.dims.width}m`);
    if (config.dims.height) lines.push(`Înălțime: ${config.dims.height}m`);
    if (config.dims.depth) lines.push(`Adâncime: ${config.dims.depth}m`);
  }
  if (config.length) lines.push(`Lungime: ${config.length}m`);
  if (config.width) lines.push(`Lățime: ${config.width}m`);
  if (config.height) lines.push(`Înălțime: ${config.height}m`);

  if (config.sections && Array.isArray(config.sections)) {
    const totalW = config.sections.reduce((s, sec) => s + (parseFloat(sec.width) || 0), 0);
    lines.push(`Lungime totală: ${totalW.toFixed(1)}m · ${config.sections.length} secțiuni`);
  }

  if (config.glassType) lines.push(`Sticlă: ${config.glassType}`);
  if (config.glass) lines.push(`Sticlă: ${config.glass}`);
  if (config.hardware) lines.push(`Feronerie: ${config.hardware}`);
  if (config.system) lines.push(`Sistem: ${config.system}`);
  if (config.nrCanate) lines.push(`Canate: ${config.nrCanate}`);
  if (config.nrPanouri) lines.push(`Panouri: ${config.nrPanouri} × ${quote?.eachMm || config.nrPanouri * 700}mm`);

  if (config.includeLed || config.inclLed) lines.push(`LED: Da`);
  if (config.inclDegivrare) lines.push(`Degivrare: Da`);
  if (config.incuietoare) lines.push(`Încuietoare: Da`);
  if (config.manerScoica) lines.push(`Mâner scoică: Da`);
  if (config.manerRectangular) lines.push(`Mâner rectangular: Da`);
  if (config.vopsireRAL) lines.push(`Vopsire RAL: Da`);
  if (config.profileLaterale) lines.push(`Profile laterale: Da`);
  if (config.blocator) lines.push(`Blocator interior: Da`);

  return lines;
}

export function generateQuotePDF({ productName, quote, config, clientInfo, previewSvg }) {
  const today = new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" });
  const offerId = Date.now().toString(36).toUpperCase();
  const configLines = buildConfigLines(config, quote);

  // Price calculations
  const baseTotal = quote?.subtotal || quote?.total || 0;
  const vatAmount = quote?.vat || 0;
  const markupPct = quote?.markupPercent || 0;
  const markupVal = quote?.markupValue || 0;
  const montajVal = quote?.montaj || 0;
  const finalTotal = quote?.finalTotal || quote?.total || 0;

  const safeProductName = escapeHtml(productName);
  const safeClientName = escapeHtml(clientInfo?.name || "—");
  const safeClientEmail = escapeHtml(clientInfo?.email || "");
  const safeClientPhone = escapeHtml(clientInfo?.phone || "");
  const safeClientMsg = escapeHtml(clientInfo?.message || "");

  const logoUrl = `${window.location.origin}/logo.png`;

  const priceRows = [];
  if (baseTotal > 0) priceRows.push({ label: "Preț produs", value: `${baseTotal}€`, cls: "" });
  if (vatAmount > 0) priceRows.push({ label: "TVA (21%)", value: `${vatAmount}€`, cls: "sub" });
  if (markupVal > 0) priceRows.push({ label: `Adaos (${markupPct}%)`, value: `+${markupVal}€`, cls: "extra" });
  if (montajVal > 0) priceRows.push({ label: "Transport și montaj", value: `+${montajVal}€`, cls: "extra" });
  priceRows.push({ label: "TOTAL (cu TVA inclus)", value: `${finalTotal}€`, cls: "total" });

  // Payment: 50% advance + 50% before delivery

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Ofertă ${safeProductName} — Glass Associates</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; padding: 50px 60px; max-width: 820px; margin: 0 auto; line-height: 1.6; }
    .cover { text-align: center; padding: 60px 0 40px; border-bottom: 2px solid #c8a96e; margin-bottom: 40px; }
    .cover img { width: 300px; height: auto; margin-bottom: 16px; }
    .cover h1 { font-size: 1.6rem; color: #1a1a2e; margin-bottom: 8px; font-weight: 700; }
    .cover p { font-size: 0.95rem; color: #666; max-width: 500px; margin: 0 auto; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 1rem; color: #c8a96e; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .meta { font-size: 0.85rem; color: #888; margin-bottom: 8px; }
    .meta strong { color: #1a1a2e; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 0.85rem; }
    .info-grid .lbl { color: #888; }
    .info-grid .val { color: #1a1a2e; font-weight: 500; }
    .config-list { font-size: 0.85rem; }
    .config-list li { margin-bottom: 3px; color: #444; list-style: none; }
    .config-list li::before { content: "• "; color: #c8a96e; }
    table.price { width: 100%; border-collapse: collapse; margin-top: 12px; }
    table.price td { padding: 10px 0; font-size: 0.9rem; border-bottom: 1px solid #f0f0f0; }
    table.price td:last-child { text-align: right; font-weight: 600; }
    table.price .sub td { color: #888; font-weight: 400; }
    table.price .extra td { color: #16a34a; font-weight: 600; }
    table.price .total td { font-size: 1.25rem; font-weight: 700; color: #c8a96e; border-top: 2px solid #c8a96e; padding-top: 14px; }
    .discount-box { background: #fdf8f0; border: 1px solid #f0d9a0; border-radius: 10px; padding: 16px 20px; margin-top: 16px; }
    .discount-box h3 { font-size: 0.85rem; color: #b8860b; margin-bottom: 10px; }
    .discount-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0; }
    .discount-row .pct { color: #16a34a; font-weight: 600; }
    .discount-row .prc { color: #1a1a2e; font-weight: 700; }
    .preview-box { text-align: center; padding: 16px; background: #fafafa; border-radius: 8px; border: 1px solid #eee; margin-top: 12px; }
    .preview-box svg { max-width: 100%; height: auto; }
    .client-box { background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
    .client-box p { font-size: 0.85rem; margin-bottom: 3px; }
    .trust-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; }
    .trust-item { padding: 8px 12px; border-left: 3px solid #c8a96e; background: #fdfaf5; border-radius: 0 6px 6px 0; }
    .trust-item .risk { color: #c0392b; font-weight: 600; }
    .trust-item .fix { color: #16a34a; }
    .steps { display: flex; gap: 12px; flex-wrap: wrap; }
    .step { flex: 1; min-width: 100px; text-align: center; font-size: 0.78rem; padding: 10px 8px; background: #f8f8f8; border-radius: 8px; }
    .step .num { width: 28px; height: 28px; border-radius: 50%; background: #c8a96e; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 6px; font-size: 0.75rem; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 0.7rem; color: #999; text-align: center; }
    .footer strong { color: #666; }
    .page-break { page-break-before: always; margin-top: 40px; }
    @media print {
      body { padding: 30px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- COVER -->
  <div class="cover">
    <img src="${logoUrl}" alt="Glass Associates">
    <h1>Ofertă de preț</h1>
    <p>Soluție personalizată, fără improvizații. Fiecare proiect este tratat ca o investiție pe termen lung, cu responsabilitate asumată.</p>
  </div>

  <!-- META -->
  <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
    <div class="meta">
      <strong>Ofertă #${offerId}</strong><br>
      Data: ${today}<br>
      Valabilă 30 zile
    </div>
    <div class="meta" style="text-align:right;">
      <strong>Glass Associates</strong><br>
      office@glass.associates<br>
      glass.associates
    </div>
  </div>

  <!-- 1. CLIENT -->
  ${clientInfo ? `
  <div class="section">
    <h2>1. Date Client</h2>
    <div class="client-box">
      <p><strong>${safeClientName}</strong></p>
      ${safeClientEmail ? `<p>Email: ${safeClientEmail}</p>` : ""}
      ${safeClientPhone ? `<p>Telefon: ${safeClientPhone}</p>` : ""}
      ${safeClientMsg ? `<p style="margin-top:6px;font-style:italic;">"${safeClientMsg}"</p>` : ""}
    </div>
  </div>` : ""}

  <!-- 2. SOLUȚIA -->
  <div class="section">
    <h2>2. Soluția recomandată</h2>
    <div class="info-grid">
      <div><span class="lbl">Produs:</span> <span class="val">${safeProductName}</span></div>
      ${configLines.map(l => `<div><span class="lbl">${escapeHtml(l)}</span></div>`).join("")}
    </div>
  </div>

  <!-- 3. SCHIȚĂ 2D -->
  ${previewSvg ? `
  <div class="section">
    <h2>3. Schiță 2D</h2>
    <div class="preview-box">${previewSvg}</div>
  </div>` : ""}

  <!-- 4. PREȚ -->
  <div class="section">
    <h2>4. Preț &amp; condiții de plată</h2>
    <table class="price">
      ${priceRows.map(r => `<tr class="${r.cls}"><td>${r.label}</td><td>${r.value}</td></tr>`).join("")}
    </table>

    <div class="discount-box">
      <h3>Condiții de plată</h3>
      <div class="discount-row"><span>Avans 50% la lansare + 50% înainte de livrare</span><span class="prc">${finalTotal}€</span></div>
    </div>

    <p style="font-size:0.75rem;color:#999;margin-top:12px;">Prețurile nu includ ridicarea la etaj (dacă este cazul). Plata se face în lei la cursul BNR din ziua plății. Ofertă valabilă 30 zile.</p>
  </div>

  <!-- 5. ELIMINAREA RISCULUI -->
  <div class="section">
    <h2>5. Eliminarea riscului</h2>
    <div class="trust-grid">
      <div class="trust-item"><span class="risk">✖️ "Nu știu dacă e compatibil"</span><br><span class="fix">✔️ Consultanță gratuită și proiectare înainte de execuție</span></div>
      <div class="trust-item"><span class="risk">✖️ "Mi se promite și se livrează altceva"</span><br><span class="fix">✔️ Specificații clare, contract ferm</span></div>
      <div class="trust-item"><span class="risk">✖️ "Plătesc avans și nu primesc produsul"</span><br><span class="fix">✔️ Documentație prin contracte și facturi fiscale</span></div>
      <div class="trust-item"><span class="risk">✖️ "Montajul nu va fi corect"</span><br><span class="fix">✔️ Echipe specializate, control pe fiecare etapă</span></div>
      <div class="trust-item"><span class="risk">✖️ "Vor apărea infiltrații"</span><br><span class="fix">✔️ Sisteme de drenaj și etanșare verificate la predare</span></div>
      <div class="trust-item"><span class="risk">✖️ "Nu primesc suport după montaj"</span><br><span class="fix">✔️ Service post-vânzare, răspuns în 24h</span></div>
    </div>
  </div>

  <!-- 6. GARANȚII -->
  <div class="section">
    <h2>6. Garanții</h2>
    <div class="info-grid">
      <div><span class="lbl">Garanție de conformitate:</span> <span class="val">Soluția respectă specificațiile agreate</span></div>
      <div><span class="lbl">Garanție de montaj:</span> <span class="val">Montaj corect, conform standardelor</span></div>
      <div><span class="lbl">Garanție de funcționalitate:</span> <span class="val">Produs verificat și funcțional la predare</span></div>
      <div><span class="lbl">Termen de garanție:</span> <span class="val">24 luni</span></div>
    </div>
  </div>

  <!-- 7. PAȘII URMĂTORI -->
  <div class="section">
    <h2>7. Pașii următori</h2>
    <div class="steps">
      <div class="step"><div class="num">1</div>Confirmare ofertă</div>
      <div class="step"><div class="num">2</div>Semnare contract</div>
      <div class="step"><div class="num">3</div>Proiectare &amp; validare</div>
      <div class="step"><div class="num">4</div>Producție</div>
      <div class="step"><div class="num">5</div>Montaj &amp; verificare</div>
      <div class="step"><div class="num">6</div>Predare finală</div>
    </div>
    <p style="font-size:0.8rem;color:#888;margin-top:12px;">Termen de livrare și montaj: 3-4 săptămâni de la confirmare, în funcție de complexitate.</p>
  </div>

  <!-- 8. CGV -->
  <div class="page-break">
    <h2 style="font-size:0.9rem;color:#444;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">8. Condiții Generale de Vânzare</h2>
    <div style="font-size:0.72rem;color:#666;line-height:1.6;">
      <p style="margin-bottom:6px;"><strong>1. Caracter estimativ.</strong> Ofertele generate automat au caracter orientativ. Prețurile și configurațiile reprezintă estimări preliminare. Ne rezervăm dreptul de revizuire în cazul erorilor de sistem sau variațiilor de preț.</p>
      <p style="margin-bottom:6px;"><strong>2. Încheierea contractului.</strong> Contractul se consideră încheiat după confirmarea scrisă și acceptul explicit al Clientului asupra condițiilor finale.</p>
      <p style="margin-bottom:6px;"><strong>3. Prețuri și plată.</strong> Prețurile sunt exprimate în EUR sau RON, fără TVA dacă nu se specifică altfel. Se poate solicita avans, plată integrală sau plăți etapizate.</p>
      <p style="margin-bottom:6px;"><strong>4. Produse personalizate.</strong> Majoritatea produselor sunt la comandă. Clientul e responsabil pentru corectitudinea dimensiunilor. După lansarea în producție, modificările nu mai sunt posibile.</p>
      <p style="margin-bottom:6px;"><strong>5. Livrare.</strong> Termenele sunt estimative. Întârzierile cauzate de furnizori sau condiții meteo nu sunt imputabile.</p>
      <p style="margin-bottom:6px;"><strong>6. Retur.</strong> Produsele personalizate nu pot fi returnate, conform legislației.</p>
      <p style="margin-bottom:6px;"><strong>7. Garanție.</strong> Produsele beneficiază de garanția legală. Reclamațiile se fac în 48h de la recepție. Uzura normală exclude garanția.</p>
      <p style="margin-bottom:6px;"><strong>8. Protecția datelor.</strong> Datele personale sunt prelucrate conform GDPR.</p>
      <p style="margin-bottom:6px;"><strong>9. Legea aplicabilă.</strong> Guvernate de legea română.</p>
    </div>
  </div>

  <div class="footer">
    <p><strong>Glass Associates</strong> — Sticlă structurală, balustrade, cabine duș, pergole, copertine</p>
    <p>Email: office@glass.associates &nbsp;|&nbsp; Web: glass.associates</p>
    <p style="margin-top:6px;">Oferta este valabilă 30 de zile. Prețurile nu includ transportul și montajul decât dacă este specificat.</p>
  </div>

  <div class="no-print" style="margin-top:32px;text-align:center;">
    <button onclick="window.print()" style="padding:14px 40px;background:#c8a96e;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:700;">
      🖨️ Printează / Salvează PDF
    </button>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export async function sendQuoteEmail({ productName, quote, config, clientInfo }) {
  const payload = { productName, quote, config, clientInfo };
  try {
    const res = await fetch(apiUrl("/quote/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, quote, config, client: clientInfo }),
    });
    if (!res.ok) return openMailFallback(payload);
    return res.json();
  } catch {
    return openMailFallback(payload);
  }
}
