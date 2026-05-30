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

function createQuoteEmail({ productName, quote, config, clientInfo }) {
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
    ...Object.entries(config || {}).map(([key, value]) => `${key}: ${value}`),
    clientInfo?.message ? "" : null,
    clientInfo?.message ? `Mesaj: ${clientInfo.message}` : null,
  ].filter(line => line !== null);

  return {
    subject: `Cerere oferta - ${productName}`,
    body: lines.join("\n"),
  };
}

function openMailFallback(payload) {
  const { subject, body } = createQuoteEmail(payload);
  const params = new URLSearchParams({ subject, body });
  window.location.href = `mailto:office@glass.associates?${params.toString()}`;
  return { ok: true, fallback: "mailto" };
}

/**
 * Generare PDF ofertă - client side, fără dependențe externe
 * Creează un HTML frumos și deschide print dialog
 */
export function generateQuotePDF({ productName, quote, config, clientInfo }) {
  const today = new Date().toLocaleDateString("ro-RO", {
    year: "numeric", month: "long", day: "numeric"
  });

  const configDetails = [];
  const priceBreakdown = [];

  if (config) {
    // Dimensiuni
    if (config.length) configDetails.push(`Lungime: ${config.length}m`);
    if (config.width) configDetails.push(`Lățime: ${config.width}m`);
    if (config.depth) configDetails.push(`Adâncime: ${config.depth}m`);
    if (config.height) configDetails.push(`Înălțime: ${config.height}m`);
    if (config.dims?.width && typeof config.dims === 'object') {
      if (config.dims.width) configDetails.push(`Lungime: ${config.dims.width}m`);
      if (config.dims.height) configDetails.push(`Înălțime: ${config.dims.height}m`);
      if (config.dims.depth) configDetails.push(`Adâncime: ${config.dims.depth}m`);
    }

    // Multitrack sections
    if (config.sections && Array.isArray(config.sections)) {
      const totalW = config.sections.reduce((s, sec) => s + (parseFloat(sec.width) || 0), 0);
      configDetails.push(`Lungime totală: ${totalW.toFixed(1)}m`);
      configDetails.push(`Nr. secțiuni: ${config.sections.length}`);
      configDetails.push(`Total canate: ${config.totalCanate || config.sections.reduce((s, sec) => s + (sec.nrCanate || 0), 0)}`);
      config.sections.forEach((sec, i) => {
        configDetails.push(`  Secțiunea ${i + 1}: ${sec.width || '—'}m × ${sec.nrCanate || '—'} canate`);
      });
    }

    // Sticlă
    if (config.glassType) configDetails.push(`Tip sticlă: ${config.glassType}`);
    if (config.glassShape) configDetails.push(`Formă sticlă: ${config.glassShape}`);
    if (config.glass) configDetails.push(`Tip sticlă: ${config.glass}`);

    // Sistem / feronerie
    if (config.hardware) configDetails.push(`Feronerie: ${config.hardware}`);
    if (config.system) configDetails.push(`Sistem: ${config.system}`);
    if (config.mountingType) configDetails.push(`Tip montaj: ${config.mountingType}`);

    // Terasă specifics
    if (config.nrCanate) configDetails.push(`Număr canate: ${config.nrCanate}`);
    if (config.deschidereMijloc) configDetails.push(`Deschidere: la mijloc`);
    if (config.sineNeintrerupte) configDetails.push(`Șine neîntrerupte: Da (+35%)`);

    // Profile / handrail
    if (config.profileShape) configDetails.push(`Formă profil: ${config.profileShape}`);
    if (config.handrail && config.handrail !== "none") {
      const handrailNames = { "handrail-structurala": "Structurală Aluminiu", "handrail-rotunda": "Rotundă Inox", "handrail-patrata": "Pătrată Inox", "handrail-slim": "Slim Aluminiu" };
      configDetails.push(`Mână curentă: ${handrailNames[config.handrail] || config.handrail}`);
    }

    // Accesorii bifate
    if (config.includeLed || config.inclLed) configDetails.push(`Iluminare LED: Da`);
    if (config.inclDegivrare) configDetails.push(`Degivrare: Da`);
    if (config.type) {
      const copNames = { "copertina-tiranti": "Cu tiranți", "copertina-fara-1.2": "Fără tiranți max 1.2m", "copertina-fara-1.5": "Fără tiranți max 1.5m" };
      if (copNames[config.type]) configDetails.push(`Tip copertină: ${copNames[config.type]}`);
    }
    if (config.incuietoare) configDetails.push(`Încuietoare cu cheie: Da`);
    if (config.profileLaterale) configDetails.push(`Profile laterale etanșare: Da`);
    if (config.vopsireRAL) configDetails.push(`Vopsire electrostatică RAL: Da`);
    if (config.manerScoica) configDetails.push(`Mâner scoică: Da`);
    if (config.manerRectangular) configDetails.push(`Mâner rectangular inox: Da`);
    if (config.inclManere) configDetails.push(`Mânere inox: Da`);
    if (config.inclIncuietoare) configDetails.push(`Încuietoare: Da`);
    if (config.inclBlocator || config.blocator) configDetails.push(`Blocator interior: Da`);
    if (config.inclCaroiaj) configDetails.push(`Profile caroiaj: Da`);
    if (config.inclTowel) configDetails.push(`Port prosop: Da`);
    if (config.inclSeat) configDetails.push(`Scaun rabatabil: Da`);
    if (config.inclDez) configDetails.push(`Sistem dezghețare: Da`);
    if (config.inclMob) configDetails.push(`Mobilier integrat: Da`);
    if (config.inclPan) configDetails.push(`Panouri laterale: Da`);
    if (config.inclAntiAburire) configDetails.push(`Anti-aburire: Da`);
    if (config.inclUsaBatanta) configDetails.push(`Ușă batantă: Da`);
    if (config.inclUsaCulisanta) configDetails.push(`Ușă culisantă: Da`);

    // Altele
    if (config.enclosure) configDetails.push(`Tip cabină: ${config.enclosure}`);
    if (config.treatment) configDetails.push(`Tratament: ${config.treatment}`);
    if (config.shape) configDetails.push(`Formă: ${config.shape}`);
    if (config.mirrorType) configDetails.push(`Tip oglindă: ${config.mirrorType}`);
    if (config.thickness) configDetails.push(`Grosime: ${config.thickness}`);
    if (config.edge) configDetails.push(`Margine: ${config.edge}`);
  }

  // Price breakdown lines
  if (quote) {
    if (quote.area) priceBreakdown.push({ label: "Suprafață totală", value: `${quote.area} m²` });
    if (quote.glassP != null) priceBreakdown.push({ label: "Cost sticlă", value: `${quote.glassP}€` });
    if (quote.glassPrice) priceBreakdown.push({ label: "Sticlă", value: `${quote.glassPrice}€` });
    if (quote.hwPrice) priceBreakdown.push({ label: "Feronerie", value: `${quote.hwPrice}€` });
    if (quote.hardwareP != null) priceBreakdown.push({ label: "Feronerie & sistem", value: `${quote.hardwareP}€` });
    if (quote.sysP) priceBreakdown.push({ label: "Sistem", value: `${quote.sysP}€` });
    if (quote.encP) priceBreakdown.push({ label: "Tip cabină", value: `${quote.encP}€` });
    if (quote.treatP) priceBreakdown.push({ label: "Tratament", value: `${quote.treatP}€` });
    if (quote.taxaForma) priceBreakdown.push({ label: "Taxă formă", value: `${quote.taxaForma}€` });
    if (quote.handrailP) priceBreakdown.push({ label: "Mână curentă", value: `${quote.handrailP}€` });
    if (quote.ledP) priceBreakdown.push({ label: "LED", value: `${quote.ledP}€` });
    if (quote.towelP) priceBreakdown.push({ label: "Port prosop", value: `${quote.towelP}€` });
    if (quote.seatP) priceBreakdown.push({ label: "Scaun", value: `${quote.seatP}€` });
    if (quote.optP) priceBreakdown.push({ label: "Accesorii", value: `${quote.optP}€` });
    if (quote.typeP) priceBreakdown.push({ label: "Structură", value: `${quote.typeP}€` });
    if (quote.structP) priceBreakdown.push({ label: "Structură", value: `${quote.structP}€` });
    if (quote.glP) priceBreakdown.push({ label: "Sticlă", value: `${quote.glP}€` });
    if (quote.ledP2) priceBreakdown.push({ label: "LED", value: `${quote.ledP2}€` });
    if (quote.dezP) priceBreakdown.push({ label: "Dezghețare", value: `${quote.dezP}€` });
    if (quote.degP) priceBreakdown.push({ label: "Degivrare", value: `${quote.degP}€` });
    if (quote.mobP) priceBreakdown.push({ label: "Mobilier", value: `${quote.mobP}€` });
    if (quote.panP) priceBreakdown.push({ label: "Panouri lat.", value: `${quote.panP}€` });
    if (quote.carP) priceBreakdown.push({ label: "Caroiaj", value: `${quote.carP}€` });
  }

  const safeProductName = escapeHtml(productName);
  const logoUrl = `${window.location.origin}/logo.png`;
  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Ofertă ${safeProductName} — Glass Associates</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #c8a96e; }
    .logo { width: 260px; height: auto; display: block; }
    .logo-sub { font-size: 0.75rem; color: #888; letter-spacing: 2px; text-transform: uppercase; }
    .meta { text-align: right; font-size: 0.85rem; color: #666; }
    .meta strong { color: #1a1a2e; }
    h2 { font-size: 1.1rem; color: #c8a96e; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 28px; }
    .config-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .config-item { font-size: 0.9rem; padding: 6px 0; border-bottom: 1px solid #eee; }
    .config-item span { color: #666; }
    .lines { width: 100%; border-collapse: collapse; }
    .lines td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    .lines td:last-child { text-align: right; font-weight: 600; }
    .lines .total td { font-size: 1.2rem; font-weight: 700; color: #c8a96e; border-top: 2px solid #c8a96e; border-bottom: none; padding-top: 14px; }
    .lines .subtotal td { font-size: 0.85rem; color: #888; }
    .client-info { background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .client-info p { font-size: 0.85rem; margin-bottom: 4px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.75rem; color: #999; text-align: center; }
    .footer a { color: #c8a96e; text-decoration: none; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <img class="logo" src="${logoUrl}" alt="Glass Associates">
      <div class="logo-sub">Sticlă Structurală & Balustrade</div>
    </div>
    <div class="meta">
      <strong>Ofertă #${Date.now().toString(36).toUpperCase()}</strong><br>
      Data: ${today}<br>
      Valabilă 30 zile
    </div>
  </div>

  <div class="section">
    <h2>Produs</h2>
    <p style="font-size: 1.1rem; font-weight: 600;">${safeProductName}</p>
  </div>

  ${clientInfo ? `
  <div class="section">
    <h2>Client</h2>
    <div class="client-info">
      <p><strong>${escapeHtml(clientInfo.name || "—")}</strong></p>
      ${clientInfo.email ? `<p>Email: ${escapeHtml(clientInfo.email)}</p>` : ""}
      ${clientInfo.phone ? `<p>Telefon: ${escapeHtml(clientInfo.phone)}</p>` : ""}
      ${clientInfo.message ? `<p style="margin-top:8px; font-style:italic;">"${escapeHtml(clientInfo.message)}"</p>` : ""}
    </div>
  </div>
  ` : ""}

  ${configDetails.length > 0 ? `
  <div class="section">
    <h2>Configurație</h2>
    <div class="config-list">
      ${configDetails.map(d => `<div class="config-item"><span>•</span> ${escapeHtml(d)}</div>`).join("")}
    </div>
  </div>
  ` : ""}

  ${quote ? `
  <div class="section">
    <h2>Detaliu Preț</h2>
    <table class="lines">
      ${priceBreakdown.map(l => `<tr><td>${escapeHtml(l.label)}</td><td>${escapeHtml(l.value)}</td></tr>`).join("")}
      <tr class="subtotal"><td colspan="2" style="text-align:right; padding:8px 0;">
        Subtotal: ${quote.subtotal}€ &nbsp;•&nbsp; TVA: ${quote.vat}€
      </td></tr>
      <tr class="total">
        <td>TOTAL</td>
        <td>${quote.total}€</td>
      </tr>
    </table>
  </div>
  ` : ""}

  <div class="footer" style="text-align: left; font-size: 0.7rem; color: #666; line-height: 1.5; border-top: 1px solid #999; padding-top: 16px; margin-top: 40px; page-break-before: always;">
    <h3 style="font-size: 0.8rem; color: #444; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Condiții Generale de Vânzare</h3>

    <p style="margin-bottom: 6px;"><strong>1. Informații generale.</strong> Prezentele Condiții Generale de Vânzare reglementează raporturile contractuale dintre Glass Associates („Vânzătorul”) și orice persoană fizică sau juridică („Clientul”) care solicită sau acceptă o ofertă. Aplicabilitatea se extinde inclusiv asupra ofertelor generate automat prin website.</p>
    <p style="margin-bottom: 6px;"><strong>2. Caracter estimativ.</strong> Ofertele generate automat au caracter orientativ și neangajant. Prețurile, configurațiile și termenele reprezintă estimări preliminare. Glass Associates își rezervă dreptul de a revizui oferta în cazul datelor incomplete, erorilor de sistem sau variațiilor de preț ale materialelor.</p>
    <p style="margin-bottom: 6px;"><strong>3. Încheierea contractului.</strong> Contractul se consideră încheiat exclusiv după confirmarea scrisă a Glass Associates și acceptul explicit al Clientului asupra condițiilor comerciale finale.</p>
    <p style="margin-bottom: 6px;"><strong>4. Prețuri și plată.</strong> Prețurile sunt exprimate în EUR sau RON, fără TVA. Glass Associates poate solicita avans, plată integrală sau plăți etapizate. Neachitarea la termen poate duce la suspendare sau anulare.</p>
    <p style="margin-bottom: 6px;"><strong>5. Produse personalizate.</strong> Majoritatea produselor sunt realizate la comandă. Clientul este responsabil pentru corectitudinea dimensiunilor comunicate. După lansarea în producție, modificările sau anulările nu mai sunt posibile.</p>
    <p style="margin-bottom: 6px;"><strong>6. Livrare.</strong> Termenele sunt estimative. Întârzierile cauzate de furnizori, transportatori sau condiții meteo nu sunt imputabile Glass Associates. Transportul nu este inclus în preț decât dacă se specifică expres.</p>
    <p style="margin-bottom: 6px;"><strong>7. Retur.</strong> Produsele personalizate nu pot fi returnate, conform legislației în vigoare.</p>
    <p style="margin-bottom: 6px;"><strong>8. Garanție.</strong> Produsele beneficiază de garanția legală de conformitate. Reclamațiile pentru defecte vizibile trebuie formulate în 48 de ore de la recepție. Uzura normală sau intervențiile neautorizate exclud garanția.</p>
    <p style="margin-bottom: 6px;"><strong>9. Limitarea răspunderii.</strong> Răspunderea Glass Associates este limitată la valoarea comenzii achitate. Glass Associates nu răspunde pentru pierderi indirecte sau daune colaterale.</p>
    <p style="margin-bottom: 6px;"><strong>10. Forța majoră.</strong> Exonerează părțile de răspundere pe durata existenței acesteia, conform legislației române.</p>
    <p style="margin-bottom: 6px;"><strong>11. Protecția datelor.</strong> Datele personale sunt prelucrate conform GDPR și politicii de confidențialitate Glass Associates.</p>
    <p style="margin-bottom: 6px;"><strong>12. Legea aplicabilă.</strong> Prezentele CGV sunt guvernate de legea română. Litigiile se soluționează de instanțele competente din România.</p>
    <p style="margin-top: 8px; font-style: italic;">Versiunea în vigoare la data confirmării comenzii este cea aplicabilă.</p>
  </div>

  <div class="footer" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 0.75rem; color: #999; text-align: center;">
    <p><strong>Glass Associates</strong> — Sticlă structurală, balustrade, cabine duș, pergole, copertine</p>
    <p>Email: office@glass.associates &nbsp;|&nbsp; Web: glass.associates</p>
    <p style="margin-top: 8px;">Această ofertă este valabilă 30 de zile de la data emiterii. Prețurile nu includ transportul și montajul decât dacă este specificat.</p>
  </div>

  <div class="no-print" style="margin-top: 32px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 32px; background: #c8a96e; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;">
      🖨️ Printează / Salvează PDF
    </button>
  </div>
</body>
</html>`;

  // Deschide într-o fereastră nouă pentru print/save PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Trimite cerere ofertă prin email (backend API)
 */
export async function sendQuoteEmail({ productName, quote, config, clientInfo }) {
  const payload = { productName, quote, config, clientInfo };

  try {
    const res = await fetch(apiUrl("/quote/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        quote,
        config,
        client: clientInfo,
      }),
    });

    if (!res.ok) {
      return openMailFallback(payload);
    }

    return res.json();
  } catch {
    return openMailFallback(payload);
  }
}
