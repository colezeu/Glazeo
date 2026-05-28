import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

interface SaveProjectModalProps {
  productType: string
  config: Record<string, unknown>
  onClose: () => void
  onSaved?: () => void
}

export default function SaveProjectModal({ productType, config, onClose, onSaved }: SaveProjectModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Te rog introduce un nume pentru proiect.')
      return
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Trebuie sa fii autentificat.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      product_type: productType,
      config,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    onSaved?.()
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Salveaza proiect</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <p className="text-[#c8a96e] text-center py-4">Proiect salvat!</p>
        ) : (
          <>
            <input
              type="text"
              placeholder="Nume proiect (ex: Vila Popescu)"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className="input-field w-full mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
