// @ts-nocheck
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'office@glass.associates';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Email comes from validated JWT — cannot be forged client-side
      setIsAdmin(user.email === ADMIN_EMAIL);
      setLoading(false);
    })
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white">Se încarcă...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
