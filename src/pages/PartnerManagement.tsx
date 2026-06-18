// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TIER_MULTIPLIERS, getTierFromMultiplier, type PricingTier } from '../lib/user'

/** Tier badge pill */
function TierBadge({ tier }: { tier: PricingTier }) {
  const colors: Record<string, { bg: string; border: string; color: string }> = {
    volume: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22c55e' },
    partner: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6' },
    standard: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.6)' },
    personalizat: { bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.2)', color: '#c8a96e' },
  }
  const c = colors[tier] || colors.standard
  const labels: Record<string, string> = { volume: 'Volum', partner: 'Partener', standard: 'Standard', personalizat: 'Pers.' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {labels[tier] || tier}
    </span>
  )
}

interface PartnerRow {
  user_id: string
  price_multiplier: number
  email: string
  name: string
  projectCount: number
}

export default function PartnerManagement() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const saveName = async (userId: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('user_id', userId)
    if (error) return setMsg('❌ Update: ' + error.message)
    const { data } = await supabase.from('profiles').select('name').eq('user_id', userId).single()
    setMsg('✅ Salvat. DB confirmă: ' + (data?.name || '(gol)'))
    if (data?.name === trimmed) {
      setPartners(prev => prev.map(x => x.user_id === userId ? { ...x, name: trimmed } : x))
    }
  }

  const fetchPartners = async () => {
    // Get unique users from projects table (RLS-safe)
    const { data, error } = await supabase
      .from('projects')
      .select('user_id')

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // Get unique user IDs
    const userIds = [...new Set((data || []).map(p => p.user_id))]

    // Get their profiles
    const enriched: PartnerRow[] = []
    for (const uid of userIds) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('price_multiplier, email, name')
        .eq('user_id', uid)
        .single()

      // Count their projects
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)

      enriched.push({
        user_id: uid,
        price_multiplier: profile?.price_multiplier ?? 1.0,
        email: profile?.email || uid.substring(0, 12) + '...',
        name: profile?.name || '',
        projectCount: count || 0,
      })
    }

    setPartners(enriched)
    setLoading(false)
  }

  const setTier = async (userId: string, tier: PricingTier) => {
    setUpdating(userId)
    setMsg('')
    const multiplier = TIER_MULTIPLIERS[tier]

    const { error } = await supabase
      .from('profiles')
      .update({ price_multiplier: multiplier })
      .eq('user_id', userId)

    if (error) {
      setMsg('Eroare: ' + error.message)
    } else {
      setPartners(prev =>
        prev.map(p => p.user_id === userId ? { ...p, price_multiplier: multiplier } : p)
      )
      setMsg(`Tier actualizat pentru ${userId.substring(0, 8)}... → ${tier} (${multiplier})`)
    }
    setUpdating(null)
  }

  const deletePartner = async (userId: string) => {
    if (!confirm(`Ștergi acest partener? Profilul va fi șters (proiectele rămân).`)) return
    setUpdating(userId)
    setMsg('')
    const { error } = await supabase.from('profiles').delete().eq('user_id', userId)
    if (error) {
      setMsg('Eroare ștergere: ' + error.message)
    } else {
      setPartners(prev => prev.filter(p => p.user_id !== userId))
      setMsg('Partener șters.')
    }
    setUpdating(null)
  }

  useEffect(() => { fetchPartners() }, [])

  if (loading) return <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-gray-400">Se încarcă partenerii...</div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(240,237,232,0.5)", textDecoration: "none", fontSize: "0.85rem", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Înapoi la Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">👥 Gestionare Parteneri</h1>
        <p className="text-gray-400 mb-4" style={{ fontSize: "0.9rem" }}>Setează tier-ul de preț pentru fiecare partener.</p>

        {msg && <div style={{ marginBottom: 16, fontSize: "0.85rem", color: "#22c55e", textAlign: "center" }}>{msg}</div>}

      {/* Desktop table — hidden on mobile */}
      <div className="hidden md:block" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(240,237,232,0.4)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nume</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(240,237,232,0.4)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Proiecte</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(240,237,232,0.4)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Tier</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', color: 'rgba(240,237,232,0.4)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acțiune</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 8px', textAlign: 'center', color: 'rgba(240,237,232,0.3)' }}>
                  Niciun partener. Partenerii apar aici după ce își fac cont și salvează un proiect.
                </td>
              </tr>
            )}
            {partners.map(p => {
              const tier = getTierFromMultiplier(p.price_multiplier)
              return (
                <tr key={p.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={p.name}
                        placeholder="Nume..."
                        className="input-field"
                        style={{ padding: '6px 10px', fontSize: '0.82rem', width: 130 }}
                        onChange={(e) => {
                          setPartners(prev => prev.map(x => x.user_id === p.user_id ? { ...x, name: e.target.value } : x))
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') saveName(p.user_id, (e.target as HTMLInputElement).value)
                        }}
                      />
                      <button onClick={() => saveName(p.user_id, p.name)} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>💾</button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'rgba(240,237,232,0.5)' }}>{p.projectCount}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <TierBadge tier={tier} />
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <select value={tier} onChange={(e) => setTier(p.user_id, e.target.value as PricingTier)} disabled={updating === p.user_id}
                      className="input-field" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                      <option value="standard">Standard (×1.0)</option>
                      <option value="partner">Partener (×0.85)</option>
                      <option value="volume">Volum (×0.75)</option>
                    </select>
                    <button onClick={() => deletePartner(p.user_id)} disabled={updating === p.user_id}
                      style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="Șterge partener">🗑</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — hidden on desktop */}
      <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {partners.length === 0 && (
          <div style={{ padding: '32px 8px', textAlign: 'center', color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>
            Niciun partener. Partenerii apar aici după ce își fac cont și salvează un proiect.
          </div>
        )}
        {partners.map(p => {
          const tier = getTierFromMultiplier(p.price_multiplier)
          return (
            <div key={p.user_id} className="glass-card" style={{ borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={p.name}
                  placeholder="Nume..."
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                  onChange={(e) => setPartners(prev => prev.map(x => x.user_id === p.user_id ? { ...x, name: e.target.value } : x))}
                  onKeyDown={(e) => e.key === 'Enter' && saveName(p.user_id, (e.target as HTMLInputElement).value)}
                />
                <button onClick={() => saveName(p.user_id, p.name)} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>💾</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <TierBadge tier={tier} />
                  <span style={{ marginLeft: 10, fontSize: '0.8rem', color: 'rgba(240,237,232,0.4)' }}>{p.projectCount} proiecte</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select value={tier} onChange={(e) => setTier(p.user_id, e.target.value as PricingTier)} disabled={updating === p.user_id}
                    className="input-field" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                    <option value="standard">Standard</option>
                    <option value="partner">Partener</option>
                    <option value="volume">Volum</option>
                  </select>
                  <button onClick={() => deletePartner(p.user_id)} disabled={updating === p.user_id}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                    title="Șterge partener">🗑</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
