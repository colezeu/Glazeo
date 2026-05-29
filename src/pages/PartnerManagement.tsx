import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TIER_MULTIPLIERS, getTierFromMultiplier, type PricingTier } from '../lib/user'

interface PartnerRow {
  User_id: string
  price_multiplier: number
  email: string
  projectCount: number
}

export default function PartnerManagement() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

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
        .select('price_multiplier, email')
        .eq('User_id', uid)
        .single()

      // Count their projects
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)

      enriched.push({
        User_id: uid,
        price_multiplier: profile?.price_multiplier ?? 1.0,
        email: profile?.email || uid.substring(0, 12) + '...',
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
      .eq('User_id', userId)

    if (error) {
      setMsg('Eroare: ' + error.message)
    } else {
      setPartners(prev =>
        prev.map(p => p.User_id === userId ? { ...p, price_multiplier: multiplier } : p)
      )
      setMsg(`Tier actualizat pentru ${userId.substring(0, 8)}... → ${tier} (${multiplier})`)
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

        {/* Invite box */}
        <div className="glass-card" style={{ borderRadius: 16, padding: "20px 24px", marginBottom: 28, background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.2)" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c8a96e", marginBottom: 8 }}>🔗 Cum adaugi parteneri:</div>
          <p style={{ fontSize: "0.82rem", color: "rgba(240,237,232,0.55)", marginBottom: 12, lineHeight: 1.6 }}>
            Trimite linkul de mai jos partenerului tău. Își face cont, configurează produse, apoi apare în tabelul de aici unde îi poți seta tier-ul.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              readOnly
              value="https://glazeo.vercel.app/auth"
              className="input-field"
              style={{ flex: 1, fontSize: "0.82rem", padding: "10px 14px", fontFamily: "monospace" }}
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => { navigator.clipboard.writeText('https://glazeo.vercel.app/auth'); setMsg('Link copiat! Trimite-l partenerului.'); }}
              className="btn-primary"
              style={{ padding: "10px 18px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
            >
              📋 Copiază
            </button>
          </div>
        </div>
      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)',
          color: '#c8a96e', fontSize: '0.85rem'
        }}>
          {msg}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: 'rgba(240,237,232,0.4)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Partener</th>
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
                <tr key={p.User_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 500 }}>{p.email}</div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'rgba(240,237,232,0.5)' }}>{p.projectCount}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: tier === 'volume' ? 'rgba(34,197,94,0.15)' : tier === 'partner' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
                      color: tier === 'volume' ? '#22c55e' : tier === 'partner' ? '#3b82f6' : 'rgba(240,237,232,0.6)',
                      border: `1px solid ${tier === 'volume' ? 'rgba(34,197,94,0.3)' : tier === 'partner' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      {tier === 'standard' ? 'Standard' : tier === 'partner' ? 'Partener' : tier === 'volume' ? 'Volum' : 'Personalizat'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <select
                      value={tier}
                      onChange={(e) => setTier(p.User_id, e.target.value as PricingTier)}
                      disabled={updating === p.User_id}
                      className="input-field"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <option value="standard">Standard (×1.0)</option>
                      <option value="partner">Partener (×0.85)</option>
                      <option value="volume">Volum (×0.75)</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
