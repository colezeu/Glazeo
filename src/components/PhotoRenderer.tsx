// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Download, X, MousePointerClick } from 'lucide-react'

interface Point { x: number; y: number }

interface PhotoRendererProps {
  length: number; height: number; glassType: string; mountingType: string
  includeHandrail: boolean; includeLed: boolean; glassShape: string; profileShape?: string
}

export default function PhotoRenderer(props: PhotoRendererProps) {
  const { length, height, glassType, mountingType, includeHandrail, includeLed, profileShape } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [corners, setCorners] = useState<Point[]>([])  // 4 points: bottom-left, bottom-right, top-right, top-left
  const [mode, setMode] = useState<'upload' | 'mark' | 'render'>('upload')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const isValid = length > 0 && height > 0

  const handleFile = useCallback((file: File) => {
    const r = new FileReader()
    r.onload = (e) => { const img = new Image(); img.onload = () => { setImage(img); setCorners([]); setMode('mark') }; img.src = e.target?.result as string }
    r.readAsDataURL(file)
  }, [])

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'mark') return
    const pt = getPoint(e)
    if (corners.length < 4) {
      setCorners(prev => [...prev, pt])
      if (corners.length === 3) setMode('render')
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'render' || corners.length < 4) return
    const pt = getPoint(e)
    for (let i = 0; i < 4; i++) {
      if (Math.hypot(pt.x - corners[i].x, pt.y - corners[i].y) < 18) { setDraggingIdx(i); return }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIdx === null) return
    setCorners(prev => prev.map((p, i) => i === draggingIdx ? getPoint(e) : p))
  }
  const handleMouseUp = () => setDraggingIdx(null)

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')!
    canvas.width = 700
    canvas.height = Math.round(700 * (image.height / image.width))
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    if (!isValid) return

    // Draw corner markers with order labels
    const labels = ['Jos stg', 'Jos dr', 'Sus dr', 'Sus stg']
    corners.forEach((pt, i) => {
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, draggingIdx === i ? 12 : 9, 0, Math.PI * 2)
      ctx.fillStyle = draggingIdx === i ? '#f0ede8' : '#c8a96e'
      ctx.fill()
      ctx.strokeStyle = '#0f1117'; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.fillStyle = '#0f1117'; ctx.font = 'bold 10px DM Sans'; ctx.textAlign = 'center'
      ctx.fillText(labels[i], pt.x, pt.y - 15)
    })

    if (corners.length < 4) return

    const [bl, br, tr, tl] = corners  // bottom-left, bottom-right, top-right, top-left
    const panelCount = Math.max(1, Math.ceil(length / 1.1))

    // Interpolate between bottom edge and top edge for panel divisions
    const lerp = (t: number, p1: Point, p2: Point) => ({ x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) })

    // Draw glass — realistic tint (subtle gray-green, like real tempered glass)
    const glassAlpha = glassType === '882mm' ? 0.16 : 0.10
    ctx.beginPath()
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y)
    ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y)
    ctx.closePath()
    ctx.fillStyle = `rgba(120,135,125,${glassAlpha})`
    ctx.fill()
    // Edge — subtle darker greenish
    ctx.strokeStyle = 'rgba(80,95,85,0.3)'; ctx.lineWidth = 2; ctx.stroke()
    // Inner edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
    ctx.stroke()

    // Panel dividers
    if (panelCount > 1) {
      for (let i = 1; i < panelCount; i++) {
        const t = i / panelCount
        const bottom = lerp(t, bl, br)
        const top = lerp(t, tl, tr)
        ctx.beginPath(); ctx.moveTo(bottom.x, bottom.y); ctx.lineTo(top.x, top.y)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5; ctx.stroke()
        // Dark line next to divider for depth
        ctx.beginPath(); ctx.moveTo(bottom.x + 1.5, bottom.y); ctx.lineTo(top.x + 1.5, top.y)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke()
      }
    }

    // Bottom edge — darker shadow for grounding
    ctx.beginPath()
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y)
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2.5; ctx.stroke()

    // Top edge — subtle light catch
    ctx.beginPath()
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke()

    // Skirt (below bottom edge)
    if (mountingType === 'clips') {
      const skirt = 0.15 // fixed visual offset
      // Extend downward from bottom corners
      const sx = (tl.x - bl.x + tr.x - br.x) / 2 * skirt
      const sy = (tl.y - bl.y + tr.y - br.y) / 2 * skirt + 8
      ctx.beginPath()
      ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y)
      ctx.lineTo(br.x + sx, br.y + sy); ctx.lineTo(bl.x + sx, bl.y + sy)
      ctx.closePath()
      ctx.fillStyle = 'rgba(120,135,125,0.04)'; ctx.fill()
      // Buttons (clips)
      for (let i = 0; i < panelCount; i++) {
        for (let j = 0; j < 2; j++) {
          const t = (i + 0.3 + j * 0.4) / panelCount
          const p = lerp(t, bl, br)
          ctx.beginPath()
          ctx.arc(p.x + sx * 0.5, p.y + sy * 0.5, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(200,169,110,0.85)'; ctx.fill()
          ctx.strokeStyle = 'rgba(15,17,23,0.6)'; ctx.lineWidth = 1; ctx.stroke()
        }
      }
    } else if (mountingType === 'embedded') {
      const sx = (tl.x - bl.x + tr.x - br.x) / 2 * 0.08
      const sy = (tl.y - bl.y + tr.y - br.y) / 2 * 0.08 + 6
      ctx.beginPath()
      ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y)
      ctx.lineTo(br.x + sx, br.y + sy); ctx.lineTo(bl.x + sx, bl.y + sy)
      ctx.closePath()
      ctx.fillStyle = 'rgba(200,169,110,0.5)'; ctx.fill()
    }

    // Handrail (top edge)
    if (includeHandrail) {
      ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y)
      ctx.strokeStyle = 'rgba(200,169,110,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke()
    }

    // LED glow
    if (includeLed) {
      const inset = 0.03
      const l1 = lerp(inset, tl, bl), l2 = lerp(inset, tr, br)
      ctx.beginPath(); ctx.moveTo(l1.x, l1.y); ctx.lineTo(l2.x, l2.y)
      ctx.strokeStyle = 'rgba(255,220,80,0.35)'; ctx.lineWidth = 5; ctx.stroke()
      ctx.strokeStyle = 'rgba(255,240,120,0.8)'; ctx.lineWidth = 1.5; ctx.stroke()
    }

    // Glass reflections — multiple subtle lines for realism
    // Main highlight at 1/3 from top
    const h1 = lerp(0.3, tl, bl), h2 = lerp(0.3, tr, br)
    ctx.beginPath(); ctx.moveTo(h1.x, h1.y); ctx.lineTo(h2.x, h2.y)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
    // Secondary faint reflection at 2/3
    const s1 = lerp(0.65, tl, bl), s2 = lerp(0.65, tr, br)
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke()
    // Bottom — faint darker line for depth
    const d1 = lerp(0.05, tl, bl), d2 = lerp(0.05, tr, br)
    ctx.beginPath(); ctx.moveTo(d1.x, d1.y); ctx.lineTo(d2.x, d2.y)
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke()

  }, [image, corners, length, height, glassType, mountingType, includeHandrail, includeLed, profileShape, isValid, draggingIdx])

  const handleDownload = () => {
    const c = canvasRef.current; if (!c) return
    const a = document.createElement('a'); a.download = 'balustrada-preview.png'; a.href = c.toDataURL('image/png'); a.click()
  }
  const handleReset = () => { setImage(null); setCorners([]); setMode('upload') }

  if (mode === 'upload') {
    return (
      <div className="glass-card" style={{ borderRadius: 20, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', marginBottom: 16 }}>Randare foto reală</div>
        <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed rgba(200,169,110,0.3)', borderRadius: 16, padding: '40px 24px', cursor: 'pointer', background: 'rgba(200,169,110,0.04)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.6)'; e.currentTarget.style.background = 'rgba(200,169,110,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)'; e.currentTarget.style.background = 'rgba(200,169,110,0.04)' }}>
          <Upload size={28} color="#c8a96e" style={{ marginBottom: 12, opacity: 0.7 }} />
          <div style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.85rem', marginBottom: 6 }}>Încarcă o poză cu locul tău</div>
          <div style={{ color: 'rgba(240,237,232,0.25)', fontSize: '0.75rem' }}>Click sau drag & drop · JPG, PNG</div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        {!isValid && <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'rgba(239,68,68,0.6)' }}>Completează dimensiunile înainte de randare</div>}
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)' }}>
          Randare foto {mode === 'mark' ? `— apasă cele 4 colțuri (${corners.length}/4)` : corners.length === 4 ? `— ${length.toFixed(1)}m × ${height.toFixed(2)}m` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {mode === 'render' && (
            <>
              <button onClick={handleDownload} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', padding: '4px 10px' }}><Download size={12} /> Descarcă</button>
              <button onClick={() => { setCorners([]); setMode('mark') }} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', padding: '4px 10px' }}><MousePointerClick size={12} /> Repoziționează</button>
            </>
          )}
          <button onClick={handleReset} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', padding: '4px 10px', color: 'rgba(239,68,68,0.6)' }}><X size={12} /> Nouă poză</button>
        </div>
      </div>
      <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{ width: '100%', borderRadius: 12, cursor: mode === 'mark' ? 'crosshair' : 'grab', border: '1px solid rgba(255,255,255,0.08)' }} />
      {mode === 'mark' && (
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.78rem', color: 'rgba(200,169,110,0.7)' }}>
          🖱️ Apasă cele 4 colțuri în ordine: <b>jos stânga → jos dreapta → sus dreapta → sus stânga</b>. Poți trage punctele după.
        </div>
      )}
    </div>
  )
}
