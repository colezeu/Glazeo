import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface Project {
  id: string;
  user_id: string;
  name: string;
  product_type: string;
  config: Record<string, unknown>;
  created_at: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setProjects(data || [])
      }
      setLoading(false)
    }

    fetchProjects()
  }, [navigate])

 const loadProject = (project: Project) => {
  // Salvează configurația în localStorage
  localStorage.setItem('loadProject', JSON.stringify({
    config: project.config,
    product_type: project.product_type
  }));

  // Redirecționează la configuratorul corespunzător
  const routes: Record<string, string> = {
    balustrade: '/configurator/balustrade',
    pergola: '/configurator/pergola',
    'cabine-dus': '/configurator/cabine-dus',
    'inchidere-terasa': '/configurator/inchidere-terasa',
    'usi-batante': '/configurator/usi-batante',
    'usi-culisante': '/configurator/usi-culisante',
    partitionari: '/configurator/partitionari',
    oglinzi: '/configurator/oglinzi',
    copertina: '/configurator/copertina',
  };

  const route = routes[project.product_type] || '/';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Se încarcă...</div>

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Proiectele mele</h1>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">Nu ai proiecte salvate încă.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary mt-6"
            >
              Creează primul proiect
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="glass-card p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-400">
                    {project.product_type} • {new Date(project.created_at).toLocaleDateString('ro-RO')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => loadProject(project)}
                    className="btn-primary px-6"
                  >
                    Încarcă
                  </button>
                  <button 
                    onClick={() => deleteProject(project.id)}
                    className="btn-ghost px-4 text-red-400 hover:text-red-500"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}