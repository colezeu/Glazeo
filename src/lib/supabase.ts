import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Don't crash the app if env vars are missing — Supabase calls will just fail gracefully
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables missing. Auth and project saving disabled.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)