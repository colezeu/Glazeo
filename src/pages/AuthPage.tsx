import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage('Login reușit!')
        window.location.href = '/dashboard'
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Cont creat! Verifică-ți email-ul.')
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'A apărut o eroare');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white">
      <div className="glass-card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Autentificare' : 'Creează cont'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
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
            {loading ? 'Se procesează...' : (isLogin ? 'Autentifică-te' : 'Creează cont')}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-[#c8a96e]">{message}</p>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Nu ai cont?" : "Ai deja cont?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#c8a96e] hover:underline"
          >
            {isLogin ? 'Creează cont' : 'Autentifică-te'}
          </button>
        </p>
      </div>
    </div>
  )
}