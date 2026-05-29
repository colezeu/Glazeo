import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Download, RefreshCw, X, MousePointerClick } from 'lucide-react'

interface Point { x: number; y: number }

interface PhotoRendererProps {
  length: number       // real length in meters
  height: number       // real height in meters
  glassType: string    // "662mm" | "882mm" etc.
  mountingType: string // "clips" | "mini-montanti" | "embedded" | "profile"
  includeHandrail: boolean
  includeLed: boolean
  glassShape: string   // "dreapta" | "forma"
  profileShape?: string // "U" | "L" | "Y"
}

export default function PhotoRenderer({
  length, height, glassType, mountingType, includeHandrail, includeLed, glassShape, profileShape,
}: PhotoRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [mode, setMode] = useState<'upload' | 'mark' | 'render'>('upload')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const isValid = length > 0 && height > 0

  // Load image from file
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setPoints([])
        setMode('mark')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  // Get canvas coords from mouse event
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // Click to place points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'mark') return
    const pt = getCanvasPoint(e)
    if (points.length < 2) {
      setPoints(prev => [...prev, pt])
      if (points.length === 1) setMode('render')
    }
  }

  // Drag points to adjust
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'render' || points.length < 2) return
    const pt = getCanvasPoint(e)
    const threshold = 15
    for (let i = 0; i < points.length; i++) {
      const dx = pt.x - points[i].x, dy = pt.y - points[i].y
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        setDraggingIdx(i)
        return
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIdx === null) return
    const pt = getCanvasPoint(e)
    setPoints(prev => prev.map((p, i) => i === draggingIdx ? pt : p))
  }

  const handleMouseUp = () => setDraggingIdx(null)

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')!
    const cw = canvas.width = 700
    const ch = canvas.height = Math.round(cw * (image.height / image.width))

    // Draw photo
    ctx.drawImage(image, 0, 0, cw, ch)

    if (!isValid) return

    // Draw points
    points.forEach((pt, i) => {
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = draggingIdx === i ? '#f0ede8' : '#c8a96e'
      ctx.fill()
      ctx.strokeStyle = '#0f1117'
      ctx.lineWidth = 2
      ctx.stroke()
      // Label
      ctx.fillStyle = '#0f1117'
      ctx.font = 'bold 11px DM Sans'
      ctx.textAlign = 'center'
      ctx.fillText(i === 0 ? 'Start' : 'End', pt.x, pt.y - 16)
    })

    if (points.length < 2) return

    const [a, b] = points
    const pxDist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
    if (pxDist < 10) return

    // Calculate scale: real length in meters → pixels
    const metersPerPx = length / pxDist
    const railHeight = height / metersPerPx
    const panelCount = Math.max(1, Math.ceil(length / 1.1))
    const panelPx = pxDist / panelCount

    // Angle of the line
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const perpX = -Math.sin(angle)
    const perpY = Math.cos(angle)

    // Glass tint
    const glassAlpha = glassType === '882mm' ? 0.25 : 0.18

    // Draw panels
    for (let i = 0; i < panelCount; i++) {
      const x1 = a.x + i * panelPx * Math.cos(angle)
      const y1 = a.y + i * panelPx * Math.sin(angle)
      const x2 = a.x + (i + 1) * panelPx * Math.cos(angle)
      const y2 = a.y + (i + 1) * panelPx * Math.sin(angle)

      // Glass panel
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x2 + perpX * railHeight, y2 + perpY * railHeight)
      ctx.lineTo(x1 + perpX * railHeight, y1 + perpY * railHeight)
      ctx.closePath()
      ctx.fillStyle = `rgba(180,220,255,${glassAlpha})`
      ctx.fill()
      ctx.strokeStyle = 'rgba(180,220,255,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Glass shape - ramp
      if (glassShape === 'forma' && i < panelCount - 1) {
        const nextY = a.y + ((i + 1) / panelCount) * (b.y - a.y)
        const rampDelta = (nextY - y1) * 0.15
        // Slight visual ramp effect
        ctx.fillStyle = `rgba(180,220,255,${glassAlpha * 0.5})`
      }
    }

    // Skirt
    const skirtH = mountingType === 'clips' ? 0.35 / metersPerPx : (mountingType === 'embedded' && profileShape === 'Y' ? 0.10 / metersPerPx : 0)
    if (skirtH > 0) {
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.lineTo(b.x + perpX * skirtH, b.y + perpY * skirtH)
      ctx.lineTo(a.x + perpX * skirtH, a.y + perpY * skirtH)
      ctx.closePath()
      ctx.fillStyle = 'rgba(180,220,255,0.15)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(180,220,255,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Handrail
    if (includeHandrail) {
      const hrY1 = a.y + perpY * railHeight
      const hrX1 = a.x + perpX * railHeight
      const hrY2 = b.y + perpY * railHeight
      const hrX2 = b.x + perpX * railHeight
      ctx.beginPath()
      ctx.moveTo(hrX1, hrY1)
      ctx.lineTo(hrX2, hrY2)
      ctx.strokeStyle = 'rgba(200,169,110,0.9)'
      ctx.lineWidth = Math.max(3, 6 / metersPerPx * 0.2)
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // LED glow
    if (includeLed) {
      const ledY1 = a.y + perpY * (0.01 / metersPerPx)
      const ledX1 = a.x + perpX * (0.01 / metersPerPx)
      const ledY2 = b.y + perpY * (0.01 / metersPerPx)
      const ledX2 = b.x + perpX * (0.01 / metersPerPx)
      // Glow
      ctx.beginPath()
      ctx.moveTo(ledX1, ledY1)
      ctx.lineTo(ledX2, ledY2)
      ctx.strokeStyle = 'rgba(255,220,80,0.5)'
      ctx.lineWidth = 6
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,240,120,0.9)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Hardware indicators
    if (mountingType === 'clips') {
      for (let i = 0; i < panelCount; i++) {
        for (let j = 0; j < 2; j++) {
          const t = (i + 0.3 + j * 0.4) / panelCount
          const cx = a.x + t * (b.x - a.x) + perpX * skirtH * 0.5
          const cy = a.y + t * (b.y - a.y) + perpY * skirtH * 0.5
          ctx.beginPath()
          ctx.arc(cx, cy, 3, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(200,169,110,0.9)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(15,17,23,0.8)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    } else if (mountingType === 'embedded') {
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.lineTo(b.x + perpX * 4, b.y + perpY * 4)
      ctx.lineTo(a.x + perpX * 4, a.y + perpY * 4)
      ctx.closePath()
      ctx.fillStyle = 'rgba(200,169,110,0.7)'
      ctx.fill()
    }

    // Reflection line
    ctx.beginPath()
    ctx.moveTo(a.x + perpX * railHeight * 0.25, a.y + perpY * railHeight * 0.25)
    ctx.lineTo(b.x + perpX * railHeight * 0.25, b.y + perpY * railHeight * 0.25)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 2
    ctx.stroke()

  }, [image, points, length, height, glassType, mountingType, includeHandrail, includeLed, glassShape, profileShape, isValid, draggingIdx])

  // Download rendered image
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'balustrada-preview.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // Reset
  const handleReset = () => {
    setImage(null)
    setPoints([])
    setMode('upload')
  }

  if (mode === 'upload') {
    return (
      <div className="glass-card" style={{ borderRadius: 20, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', marginBottom: 16 }}>
          Randare foto reală
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed rgba(200,169,110,0.3)', borderRadius: 16,
            padding: '40px 24px', cursor: 'pointer',
            background: 'rgba(200,169,110,0.04)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.6)'; e.currentTarget.style.background = 'rgba(200,169,110,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)'; e.currentTarget.style.background = 'rgba(200,169,110,0.04)' }}
        >
          <Upload size={28} color="#c8a96e" style={{ marginBottom: 12, opacity: 0.7 }} />
          <div style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.85rem', marginBottom: 6 }}>
            Încarcă o poză cu locul tău
          </div>
          <div style={{ color: 'rgba(240,237,232,0.25)', fontSize: '0.75rem' }}>
            Click sau drag & drop · JPG, PNG
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        {!isValid && (
          <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'rgba(239,68,68,0.6)' }}>
            Completează dimensiunile înainte de randare
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)' }}>
          Randare foto {mode === 'mark' ? '— apasă Start și End' : points.length === 2 ? `— ${length.toFixed(1)}m × ${height.toFixed(2)}m` : ''}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {mode === 'render' && (
            <>
              <button onClick={handleDownload} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '4px 10px' }}>
                <Download size={12} /> Descarcă
              </button>
              <button onClick={() => { setPoints([]); setMode('mark') }} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '4px 10px' }}>
                <MousePointerClick size={12} /> Repoziționează
              </button>
            </>
          )}
          <button onClick={handleReset} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '4px 10px', color: 'rgba(239,68,68,0.6)' }}>
            <X size={12} /> Nouă poză
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%', borderRadius: 12, cursor: mode === 'mark' ? 'crosshair' : mode === 'render' ? 'grab' : 'default',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      {mode === 'mark' && (
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.78rem', color: 'rgba(200,169,110,0.7)' }}>
          🖱️ Apasă unde începe balustrada, apoi unde se termină. Poți trage punctele după.
        </div>
      )}
    </div>
  )
}
