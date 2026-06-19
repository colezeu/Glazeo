// @ts-nocheck
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { launchOrderFromProject } from '../lib/quotes'
import { useNavigate } from 'react-router-dom'

interface Project {
  id: string;
  user_id: string;
  name: string;
  product_type: string;
  config: Record<string, unknown>;
  created_at: string;
}

interface Quote {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  product_name: string;
  product_type?: string;
  config: Record<string, unknown>;
  quote_total?: number;
  quote_subtotal?: number;
  quote_vat?: number;
  status: 'pending' | 'ordered' | 'rejected';
  send_method: string;
  created_at: string;
}

const PRODUCT_NAMES: Record<string, string> = {
  balustrade: 'Balustrade',
  pergola: 'Pergolă',
  shower: 'Cabină Duș',
  'terrace-multitrack': 'Multitrack',
  'terrace-frameless': 'Frameless',
  'terrace-ghilotina': 'Ghilotină',
  swingdoor: 'Uși Batante',
  sliding: 'Uși Culisante',
  partitionari: 'Partiționări',
  oglinda: 'Oglinzi',
  copertina: 'Copertină',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'În așteptare', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ordered: { label: 'Comandat', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  rejected: { label: 'Respins', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      const [projRes, quoteRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (!projRes.error) setProjects(projRes.data || [])
      if (!quoteRes.error) setQuotes(quoteRes.data || [])
      setLoading(false)
    }

    fetchAll()
  }, [navigate])

 const loadProject = (project: Project) => {
  localStorage.setItem('loadProject', JSON.stringify({
    config: project.config,
    product_type: project.product_type
  }));

  const routes: Record<string, string> = {
    balustrade: '/configurator/balustrade',
    pergola: '/configurator/pergola-copertina',
    shower: '/configurator/cabine-dus',
    'inchidere-terasa': '/configurator/inchidere-terasa',
    'terrace-multitrack': '/configurator/inchidere-terasa/multitrack',
    'terrace-frameless': '/configurator/inchidere-terasa/frameless',
    'terrace-ghilotina': '/configurator/inchidere-terasa/ghilotina',
    swingdoor: '/configurator/usi-batante',
    sliding: '/configurator/usi-culisante',
    partitionari: '/configurator/partitionari',
    oglinda: '/configurator/oglinzi',
    copertina: '/configurator/copertina',
  };

  const route = routes[project.product_type] || '/';
  navigate(route);
};

  const loadQuote = (quote: Quote) => {
    if (!quote.config || !quote.product_type) return;
    localStorage.setItem('loadProject', JSON.stringify({
      config: quote.config,
      product_type: quote.product_type
    }));

    const routes: Record<string, string> = {
      balustrade: '/configurator/balustrade',
      pergola: '/configurator/pergola-copertina',
      shower: '/configurator/cabine-dus',
      'inchidere-terasa': '/configurator/inchidere-terasa',
      'terrace-multitrack': '/configurator/inchidere-terasa/multitrack',
      'terrace-frameless': '/configurator/inchidere-terasa/frameless',
      'terrace-ghilotina': '/configurator/inchidere-terasa/ghilotina',
      swingdoor: '/configurator/usi-batante',
      sliding: '/configurator/usi-culisante',
      partitionari: '/configurator/partitionari',
      oglinda: '/configurator/oglinzi',
      copertina: '/configurator/copertina',
    };

    const route = routes[quote.product_type] || '/';
    navigate(route);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest proiect?')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      alert('Eroare la ștergere')
    } else {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const handleLaunchOrder = async (project: Project) => {
    if (!confirm(`Lansezi comanda pentru "${project.name}"? Oferta va apărea în panoul de administrare.`)) return
    try {
      await launchOrderFromProject(project)
      alert('✅ Comandă lansată! O vei vedea în secțiunea "Oferte solicitate".')
      // Refresh quotes list
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (data) setQuotes(data)
      }
    } catch (e: any) {
      alert('Eroare: ' + (e.message || 'Nu s-a putut lansa comanda'))
    }
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această ofertă?')) return
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) {
      alert('Eroare la ștergere')
    } else {
      setQuotes(quotes.filter(q => q.id !== id))
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Se încarcă...</div>

  const hasProjects = projects.length > 0;
  const hasQuotes = quotes.length > 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Proiectele mele</h1>

        {!hasProjects && !hasQuotes ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">Nu ai proiecte sau oferte salvate încă.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary mt-6"
            >
              Creează primul proiect
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Proiecte salvate */}
            {hasProjects && (
              <>
                <h2 className="text-sm uppercase tracking-wider text-gray-500 mt-4 mb-2">Proiecte salvate</h2>
                {projects.map((p) => (
                  <div key={p.id} className="glass-card p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-gray-400">
                        {PRODUCT_NAMES[p.product_type] || p.product_type} • {new Date(p.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => loadProject(p)} className="btn-primary px-6">Încarcă</button>
                      <button onClick={() => handleLaunchOrder(p)} className="btn-primary px-6" style={{ background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}>Comandă</button>
                      <button onClick={() => deleteProject(p.id)} className="btn-ghost px-4 text-red-400 hover:text-red-500">Șterge</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Oferte */}
            {hasQuotes && (
              <>
                <h2 className="text-sm uppercase tracking-wider text-gray-500 mt-8 mb-2">Oferte solicitate</h2>
                {quotes.map((q) => {
                  const st = STATUS_LABELS[q.status] || STATUS_LABELS.pending;
                  return (
                    <div key={q.id} className="glass-card p-6 flex justify-between items-center">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <h3 className="font-semibold text-lg">{q.product_name}</h3>
                          <span style={{
                            padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                            background: st.bg, color: st.color, border: `1px solid ${st.color}33`
                          }}>{st.label}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {q.quote_total ? <span style={{ color: '#c8a96e', fontWeight: 600 }}>{q.quote_total}€</span> : '—'}
                          {' · '}{new Date(q.created_at).toLocaleDateString('ro-RO')}
                          {' · '}{q.send_method === 'email' ? '📧' : q.send_method === 'whatsapp' ? '📱' : '📄'} {q.client_name}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {q.config && q.product_type && (
                          <button onClick={() => loadQuote(q)} className="btn-primary px-6">Reconfigurează</button>
                        )}
                        <button onClick={() => deleteQuote(q.id)} className="btn-ghost px-4 text-red-400 hover:text-red-500">Șterge</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
