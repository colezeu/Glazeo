import { useState, useEffect } from 'react'
import { fetchQuotes, updateQuoteStatus, type QuoteData } from '../lib/quotes'
import { formatPrice } from '../ConfiguratorShared'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'În așteptare', color: '#f59e0b' },
  accepted: { label: 'Acceptată',    color: '#22c55e' },
  rejected: { label: 'Respinsă',     color: '#ef4444' },
  ordered:  { label: 'Comandă fermă',color: '#3b82f6' },
}

export default function QuotesAdmin() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
            { key: 'accepted', label: 'Acceptate' },
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 400 }}>Client</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 400 }}>Produs</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 400 }}>Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 400 }}>Metodă</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 400 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 400 }}>Dată</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q: any) => {
                    const st = STATUS_LABELS[q.status] || STATUS_LABELS.pending
                    return (
                      <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{q.client_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)' }}>{q.client_email}</div>
                          {q.client_phone && <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)' }}>{q.client_phone}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>{q.product_name}</div>
                          {q.config && Object.keys(q.config).length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)', marginTop: 2 }}>
                              {Object.entries(q.config).filter(([_,v]) => v && v !== false).slice(0, 3).map(([k, v]) =>
                                typeof v === 'object' ? null : `${k}: ${v}`
                              ).filter(Boolean).join(' · ')}
                            </div>
                          )}
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
                          <select
                            value={q.status}
                            onChange={(e) => handleStatus(q.id, e.target.value)}
                            style={{
                              background: `${st.color}18`,
                              border: `1px solid ${st.color}44`,
                              color: st.color,
                              borderRadius: 8,
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k} style={{ background: '#1a1a2e', color: v.color }}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.78rem', color: 'rgba(240,237,232,0.35)' }}>
                          {q.created_at ? format(new Date(q.created_at), 'dd MMM yyyy', { locale: ro }) : '—'}
                        </td>
                      </tr>
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
