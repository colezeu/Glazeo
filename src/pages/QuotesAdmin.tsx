// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { fetchQuotes, updateQuoteStatus, type QuoteData } from '../lib/quotes'
import { formatPrice } from '../ConfiguratorShared'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { generateQuotePDF, formatPartitionDetails } from '../quotePdf'

function formatBreakdown(breakdown: any, config: any, quote: any) {
  // Partiționări — recalculează mereu din config (nu depinde de _breakdown)
  if (config?.system === 'simpla') {
    return recalculatePartition(config);
  }
  
  // Dacă există breakdown salvat, folosește-l
  if (breakdown?.kitCodes) return formatPartitionDetails(breakdown, config);
  
  const lines: string[] = [];
  lines.push('--- Detalii Ofertă ---');
  
  if (breakdown) {
    for (const [key, val] of Object.entries(breakdown)) {
      if (key === 'kitCodes' || typeof val === 'object') continue;
      if (key === 'subtotal' || key === 'vat' || key === 'total') continue;
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      lines.push(`${label}: ${val}`);
    }
  }
  
  if (config) {
    // Dimensiuni
    if (config.dims) {
      if (config.dims.width) lines.push(`Lățime: ${config.dims.width}m`);
      if (config.dims.height) lines.push(`Înălțime: ${config.dims.height}m`);
      if (config.dims.depth) lines.push(`Adâncime: ${config.dims.depth}m`);
    }
    if (config.length) lines.push(`Lungime: ${config.length}m`);
    if (config.width && !config.dims) lines.push(`Lățime: ${config.width}m`);
    if (config.height && !config.dims) lines.push(`Înălțime: ${config.height}m`);
    if (config.depth && !config.dims) lines.push(`Adâncime: ${config.depth}m`);
    
    // Tip produs
    if (config.doorType) lines.push(`Tip ușă: ${config.doorType}`);
    if (config.variant) lines.push(`Varianta: ${config.variant}`);
    if (config.typology) lines.push(`Tipologie: ${config.typology}`);
    if (config.mount) lines.push(`Montaj: ${config.mount}`);
    if (config.carucioare) lines.push(`Cărucioare: ${config.carucioare}`);
    if (config.kit) lines.push(`Kit: ${config.kit}`);
    if (config.system) lines.push(`Sistem: ${config.system}`);
    if (config.type) lines.push(`Tip: ${config.type}`);
    if (config.enclosure) lines.push(`Tip cabină: ${config.enclosure}`);
    if (config.hardware) lines.push(`Feronerie: ${config.hardware}`);
    
    // Sticlă
    if (config.glass) lines.push(`Sticlă: ${config.glass}`);
    if (config.glassType) lines.push(`Sticlă: ${config.glassType}`);
    if (config.glassShape) lines.push(`Formă sticlă: ${config.glassShape}`);
    if (config.treatment) lines.push(`Tratament: ${config.treatment}`);
    if (config.hardwareFinish) lines.push(`Finisaj: ${config.hardwareFinish}`);
    
    // Opțiuni bifate
    const boolOpts: Record<string, string> = {
      inclManer: 'Mâner inox', inclInc: 'Încuietoare', inclAmortizor: 'Amortizor',
      inclSincron: 'Sincronizare', inclProfilOrnamental: 'Profil ornamental',
      inclLed: 'LED', inclMob: 'Mobilier', inclPan: 'Panouri laterale',
      inclDegivrare: 'Degivrare', inclAntiAburire: 'Anti-aburire',
      inclUsaBatanta: 'Ușă batantă', inclUsaCulisanta: 'Ușă culisantă',
      incuietoare: 'Încuietoare', vopsireRAL: 'Vopsire RAL',
      manerScoica: 'Mâner scoică', manerRectangular: 'Mâner rectangular',
      profileLaterale: 'Profile laterale', blocator: 'Blocator',
      deschidereMijloc: 'Deschidere la mijloc', sineNeintrerupte: 'Șine neîntrerupte',
      inclTowel: 'Port prosop', inclSeat: 'Scaun rabatabil',
    };
    const activeOpts = Object.entries(boolOpts)
      .filter(([k]) => config[k] === true || config[k] === 'Da')
      .map(([_, v]) => v);
    if (activeOpts.length > 0) lines.push(`Opțiuni: ${activeOpts.join(', ')}`);
    
    // Ușă (partiționări)
    if (config.tipUsa && config.tipUsa !== 'none') 
      lines.push(`Ușă: ${config.tipUsa === 'usa-simpla' ? 'Simplă (amortizor)' : 'Toc aluminiu'}`);
    
    // Secțiuni / canate
    if (config.sections) lines.push(`Secțiuni: ${Array.isArray(config.sections) ? config.sections.length : '—'}`);
    if (config.nrCanate) lines.push(`Nr. canate: ${config.nrCanate}`);
    if (config.totalCanate) lines.push(`Total canate: ${config.totalCanate}`);
    
    // Alte
    if (config.mirrorType) lines.push(`Tip oglindă: ${config.mirrorType}`);
    if (config.shape) lines.push(`Formă: ${config.shape}`);
    if (config.thickness) lines.push(`Grosime: ${config.thickness}`);
    if (config.edge) lines.push(`Margine: ${config.edge}`);
    if (config.profileShape) lines.push(`Formă profil: ${config.profileShape}`);
    if (config.handrail && config.handrail !== 'none') lines.push(`Mână curentă: ${config.handrail}`);
  }
  
  if (quote?.quote_subtotal) lines.push(`Subtotal: ${quote.quote_subtotal}€`);
  if (quote?.quote_vat) lines.push(`TVA: ${quote.quote_vat}€`);
  if (quote?.quote_total) lines.push(`Total: ${quote.quote_total}€`);
  
  lines.push('------------------------');
  return lines;
}

function recalculatePartition(config: any) {
  const w = parseFloat(config.dims?.width) || 0;
  const h = parseFloat(config.dims?.height) || 0;
  const area = w * h;
  
  // Prețuri Standard (NET × 1.50) — sincronizate cu catalog.json
  const BAR = 3;
  const pU = 9.92, pL = 12.20, pG = 0.97, pI = 13.81;
  const glassPrices: Record<string, number> = { '10mm-clar': 65, '10mm-satinat': 105 };
  const glassP = glassPrices[config.glass] || 65;
  
  const mLU = Math.ceil(w / BAR) * BAR;
  const mLL = Math.ceil(h / BAR) * BAR;
  const costU = 2 * mLU * pU;
  const costL = 2 * mLL * pL;
  const perimetru = 2*w + 2*h;
  const costG = 2 * perimetru * pG;
  const costS = area * glassP;
  
  // Panouri
  const wMm = w * 1000;
  const nrPanouri = Math.max(1, Math.ceil(wMm / 980));
  const eachMm = Math.round(wMm / nrPanouri);
  const nrImb = Math.max(0, nrPanouri - 1);
  const bareImb = Math.ceil(h / BAR);
  const costI = nrImb * bareImb * pI;
  
  // Ușă
  let costUsa = 0, usaName = '';
  if (config.tipUsa === 'usa-simpla') { costUsa = 294; usaName = 'Ușă simplă (amortizor)'; }
  else if (config.tipUsa === 'usa-toc') { costUsa = 371; usaName = 'Ușă cu toc aluminiu'; }
  if (!config.tipUsa && config.inclUsaBatanta) { costUsa = 294; usaName = 'Ușă batantă'; }
  if (!config.tipUsa && config.inclUsaCulisanta) { costUsa = 371; usaName = 'Ușă culisantă'; }
  
  const totalF = costU + costL + costG + costS + costI + costUsa;
  
  const lines: string[] = [];
  lines.push('');
  lines.push('--- Defalcare Partiționare (recalculat) ---');
  lines.push(`Dimensiuni: ${w}m × ${h}m = ${area.toFixed(2)}m²`);
  lines.push(`Panouri: ${nrPanouri} × ${eachMm}mm`);
  lines.push(`Profile U (sus+jos): ${costU.toFixed(0)}€ — ${mLU*2}m cumpărat (bare 3m), necesar ${(w*2).toFixed(1)}m`);
  lines.push(`Profile L (stânga+dreapta): ${costL.toFixed(0)}€ — ${mLL*2}m cumpărat (bare 3m), necesar ${(h*2).toFixed(1)}m`);
  lines.push(`Garnituri UP2: ${costG.toFixed(0)}€ (perimetru ${perimetru.toFixed(1)}m × 2 fețe)`);
  lines.push(`Sticlă: ${costS.toFixed(0)}€ (${glassP}€/m²)`);
  if (costI > 0) lines.push(`Profile îmbinare H 90°: ${costI.toFixed(0)}€ — ${nrImb * bareImb} bare × 3m`);
  if (costUsa > 0) lines.push(`${usaName}: ${costUsa}€`);
  lines.push(`---`);
  lines.push(`Total feronerie: ${totalF.toFixed(0)}€`);
  lines.push('------------------------------------------');
  return lines;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'În așteptare', color: '#f59e0b' },
  ordered:  { label: 'Comandă fermă',color: '#3b82f6' },
  rejected: { label: 'Respinsă',     color: '#ef4444' },
}

export default function QuotesAdmin() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    setLoading(true)
    const data = await fetchQuotes()
    setQuotes(data)
    setLoading(false)
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateQuoteStatus(id, status as any)
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q))
    } catch (e) {
      console.error(e)
    }
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-[#c8a96e]">Se încarcă...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#f0ede8', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: 4 }}>
              Administrare
            </p>
            <h1 className="serif" style={{ fontSize: '1.8rem', fontWeight: 400 }}>Oferte & Cereri</h1>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)' }}>
            {quotes.length} oferte
          </span>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Toate' },
            { key: 'pending', label: 'În așteptare' },
            { key: 'ordered', label: 'Comenzi ferme' },
            { key: 'rejected', label: 'Respinse' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={filter === tab.key ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
          <button onClick={loadQuotes} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: 'auto' }}>
            🔄 Reîncarcă
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'rgba(240,237,232,0.3)' }}>
            Nici o ofertă {filter !== 'all' ? 'cu acest status' : ''}
          </div>
        ) : (
          <div className="glass-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 8px', width: 30 }}></th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 400 }}>Client</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 400 }}>Produs</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 400 }}>Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 400 }}>Metodă</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 400 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 400 }}>Dată</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 400 }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q: any) => {
                    const st = STATUS_LABELS[q.status] || STATUS_LABELS.pending
                    const hasBreakdown = true
                    return (
                      <React.Fragment key={q.id}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {hasBreakdown && (
                              <button onClick={() => toggleExpand(q.id)}
                                style={{ background: 'none', border: 'none', color: '#c8a96e', cursor: 'pointer', padding: 0 }}>
                                {expanded.has(q.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{q.client_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)' }}>{q.client_email}</div>
                            {q.client_phone && <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)' }}>{q.client_phone}</div>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div>{q.product_name}</div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#c8a96e' }}>
                            {q.quote_total ? formatPrice(q.quote_total) : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase' }}>
                              {q.send_method}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <select value={q.status} onChange={(e) => handleStatus(q.id, e.target.value)}
                              style={{
                                background: `${st.color}18`, border: `1px solid ${st.color}44`,
                                color: st.color, borderRadius: 8, padding: '4px 10px',
                                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              }}>
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k} style={{ background: '#1a1a2e', color: v.color }}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.78rem', color: 'rgba(240,237,232,0.35)' }}>
                            {q.created_at ? format(new Date(q.created_at), 'dd MMM yyyy', { locale: ro }) : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button onClick={() => {
                              generateQuotePDF({
                                productName: q.product_name,
                                quote: { subtotal: q.quote_subtotal || 0, vat: q.quote_vat || 0, total: q.quote_total || 0 },
                                config: q.config || {},
                                clientInfo: { name: q.client_name, email: q.client_email, phone: q.client_phone, message: q.client_message },
                              });
                            }}
                              style={{
                                background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)',
                                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                color: '#c8a96e', fontSize: '0.78rem',
                              }}
                              title="Descarcă PDF">
                              <FileText size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                        {expanded.has(q.id) && hasBreakdown && (
                          <tr key={`${q.id}-details`} style={{ background: 'rgba(200,169,110,0.04)' }}>
                            <td colSpan={8} style={{ padding: '12px 24px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {formatBreakdown(q.config?._breakdown, q.config, { quote_subtotal: q.quote_subtotal, quote_vat: q.quote_vat, quote_total: q.quote_total }).join('\n')}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
