import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  // Auto-redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/home', { replace: true })
    })
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Loghează login-ul
      supabase.from('partner_activity').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        email,
        event: 'login'
      }).then(() => {})
      navigate('/home', { replace: true })
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'A apărut o eroare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white">
      <div className="glass-card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Autentificare</h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Accesul este permis doar partenerilor autorizați.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
            required
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Se procesează...' : 'Autentifică-te'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('?') ? 'text-red-400' : 'text-[#c8a96e]'}`}>
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-gray-600 leading-relaxed">
          Nu ai cont? Solicită accesul la{' '}
          <a href="mailto:office@glass.associates" className="text-[#c8a96e] hover:underline">
            office@glass.associates
          </a>
        </p>
      </div>
    </div>
  )
}
