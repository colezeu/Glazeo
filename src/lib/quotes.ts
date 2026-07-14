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
  markup_percent?: number
  markup_value?: number
  montaj?: number
  wa_recipient?: string
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

export async function updateQuoteStatus(id: string, status: 'pending' | 'ordered' | 'rejected') {
  const { error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  return { ok: true }
}

/** Lansează o comandă fermă dintr-un proiect salvat */
export async function launchOrderFromProject(project: {
  id: string
  name: string
  product_type: string
  config: Record<string, unknown>
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Trebuie să fii autentificat')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('user_id', user.id)
    .single()

  const productNames: Record<string, string> = {
    balustrade: 'Balustrade',
    pergola: 'Pergolă',
    shower: 'Cabină Duș',
    'inchidere-terasa': 'Închidere Terasă',
    'terrace-multitrack': 'Multitrack',
    'terrace-frameless': 'Frameless',
    'terrace-ghilotina': 'Ghilotină',
    swingdoor: 'Uși Batante',
    sliding: 'Uși Culisante',
    partitionari: 'Partiționări',
    oglinda: 'Oglinzi',
    copertina: 'Copertină',
  }

  const { error } = await supabase.from('quotes').insert({
    user_id: user.id,
    client_name: profile?.name || user.email || 'Client',
    client_email: profile?.email || user.email || '',
    product_name: `${productNames[project.product_type] || project.product_type} — ${project.name}`,
    product_type: project.product_type,
    config: project.config,
    status: 'pending',
    send_method: 'email',
  })

  if (error) throw error
  return { ok: true }
}
