import { supabase } from './supabase'

export interface QuoteData {
  client_name: string
  client_email: string
  client_phone?: string
  client_message?: string
  product_name: string
  product_type?: string
  config?: Record<string, unknown>
  quote_total?: number
  quote_subtotal?: number
  quote_vat?: number
  send_method: 'email' | 'whatsapp' | 'pdf'
}

export async function saveQuote(data: QuoteData) {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('quotes').insert({
    user_id: user?.id || null,
    ...data,
    status: 'pending',
  })

  if (error) {
    console.error('Failed to save quote:', error)
    // Don't throw — saving the quote is secondary to the user action
  }

  return { saved: !error }
}

export async function fetchQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch quotes:', error)
    return []
  }

  return data || []
}

export async function updateQuoteStatus(id: string, status: 'pending' | 'accepted' | 'rejected' | 'ordered') {
  const { error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  return { ok: true }
}
