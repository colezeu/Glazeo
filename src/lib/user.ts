import { supabase } from './supabase'

export type PricingTier = 'standard' | 'partner' | 'volume' | 'personalizat'

export const TIER_MULTIPLIERS: Record<PricingTier, number> = {
  standard: 1.0,
  partner: 0.85,
  volume: 0.75,
  personalizat: 0, // setat manual
}

export function getTierFromMultiplier(m: number): PricingTier {
  if (m >= 1.0) return 'standard'
  if (m >= 0.85) return 'partner'
  if (m >= 0.75) return 'volume'
  return 'personalizat'
}

export interface UserProfile {
  tier: PricingTier
  multiplier: number
}

export const getUserMultiplier = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 1.0

  let { data, error } = await supabase
    .from('profiles')
    .select('price_multiplier')
    .eq('User_id', user.id)
    .single()

  if (error || !data) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ User_id: user.id, price_multiplier: 1.0 })

    if (insertError) console.error('Error creating profile:', insertError)
    return 1.0
  }

  return Number(data.price_multiplier) || 1.0
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const m = await getUserMultiplier()
  return { tier: getTierFromMultiplier(m), multiplier: m }
}
