import { supabase } from './supabase'

export const getUserMultiplier = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 1.0

  // Verificăm profilul utilizatorului
  let { data, error } = await supabase
    .from('profiles')
    .select('price_multiplier')
    .eq('User_id', user.id)
    .single()

  // Dacă nu există profil, îl creăm automat
  if (error || !data) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ User_id: user.id, price_multiplier: 1.0 })

    if (insertError) console.error('Error creating profile:', insertError)
    return 1.0
  }

  return Number(data.price_multiplier) || 1.0
}