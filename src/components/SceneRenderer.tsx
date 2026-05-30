import { useState } from 'react'
import { Image, ChevronLeft, ChevronRight } from 'lucide-react'

interface Scene {
  id: string
  name: string
  bg: string
  baseY: number   // where the balustrade sits (as % of height)
  baseLeft: number // where it starts (as % of width)
  baseWidth: number // width (as %)
}

const SCENES: Scene[] = [
  { id: 'balcony', name: 'Balcon modern', bg: 'linear-gradient(180deg, #3a5068 0%, #4a6a85 40%, #5a7a95 60%, #6a8a9a 80%, #8a9a95 100%)', baseY: 62, baseLeft: 8, baseWidth: 84 },
  { id: 'terrace', name: 'Terasă spațioasă', bg: 'linear-gradient(180deg, #2d4a3e 0%, #3d5a4e 30%, #5a7a60 60%, #8a9a70 85%, #aaba80 100%)', baseY: 55, baseLeft: 5, baseWidth: 90 },
  { id: 'stairs', name: 'Scară interioară', bg: 'linear-gradient(180deg, #1a1a2e 0%, #2a2a3e 25%, #3a3a4a 50%, #4a4a55 75%, #555560 100%)', baseY: 45, baseLeft: 10, baseWidth: 80 },
  { id: 'pool', name: 'Lângă piscină', bg: 'linear-gradient(180deg, #1e3a5f 0%, #2e5a7f 35%, #3e7a9f 55%, #5e9ab5 80%, #8ebac5 100%)', baseY: 58, baseLeft: 6, baseWidth: 88 },
  { id: 'garden', name: 'Grădină / teren', bg: 'linear-gradient(180deg, #2d3a2e 0%, #4d5a4e 30%, #6d7a60 55%, #8d9a78 80%, #aaba90 100%)', baseY: 60, baseLeft: 4, baseWidth: 92 },
]

interface SceneRendererProps {
  length: number
  height: number
  glassType: string
  mountingType: string
  includeHandrail: boolean
  includeLed: boolean
}

export default function SceneRenderer({ length, height, glassType, mountingType, includeHandrail, includeLed }: SceneRendererProps) {
  const [sceneIdx, setSceneIdx] = useState(0)
  const scene = SCENES[sceneIdx]
  const w = length || 3
  const h = height || 0.9

  const glassAlpha = glassType === '882mm' ? 0.25 : 0.18
  const panelCount = Math.max(1, Math.ceil(w / 1.1))

  const prev = () => setSceneIdx(i => (i - 1 + SCENES.length) % SCENES.length)
  const next = () => setSceneIdx(i => (i + 1) % SCENES.length)

  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)' }}>
          Previzualizare în context {w > 0 ? `— ${w.toFixed(1)}m × ${h.toFixed(2)}m` : ''}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={prev} className="btn-ghost" style={{ padding: '4px 8px' }}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', minWidth: 100, textAlign: 'center' }}>{scene.name}</span>
          <button onClick={next} className="btn-ghost" style={{ padding: '4px 8px' }}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Scene SVG */}
      <svg viewBox="0 0 400 240" style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Sky / background gradient */}
        <defs>
          <linearGradient id={`bg-${scene.id}`} x1="0" y1="0" x2="0" y2="1">
            {scene.bg.split('), ').map((stop, i, arr) => {
              const parts = stop.replace('linear-gradient(180deg, ', '').replace(')', '').trim().split(' ')
              const color = parts[0].replace(',', '')
              const pct = parts[1] || '0%'
              const isLast = i === arr.length - 1
              return <stop key={i} offset={isLast ? '100%' : pct} stopColor={color} />
            })}
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#bg-${scene.id})`} />

        {/* Ground surface */}
        <rect x="0" y={scene.baseY * 240 / 100 + 2} width="400" height="240" fill="rgba(0,0,0,0.15)" />

        {/* Horizon line / railing hint */}
        <line x1={scene.baseLeft * 4} y1={scene.baseY * 240 / 100} x2={400 - scene.baseLeft * 4} y2={scene.baseY * 240 / 100}
          stroke="rgba(200,169,110,0.25)" strokeWidth="1.5" />

        {w > 0 && h > 0 && (
          <>
            {/* Scale: width maps to scene width, height proportional */}
            {(() => {
              const baseX = scene.baseLeft * 4
              const baseW = scene.baseWidth * 4
              const scale = baseW / w
              const railH = h * scale
              const baseY = scene.baseY * 240 / 100
              const panelW = baseW / panelCount

              return (
                <>
                  {/* Skirt */}
                  {mountingType === 'clips' && (
                    <rect x={baseX} y={baseY} width={baseW} height={Math.max(3, 0.35 * scale)}
                      fill="rgba(180,220,255,0.12)" stroke="rgba(180,220,255,0.2)" strokeWidth="0.5" />
                  )}

                  {/* Glass panels */}
                  {Array.from({ length: panelCount }, (_, i) => (
                    <rect key={i}
                      x={baseX + i * panelW + 1} y={baseY - railH}
                      width={panelW - 2} height={railH}
                      fill={`rgba(180,220,255,${glassAlpha})`}
                      stroke="rgba(180,220,255,0.35)" strokeWidth="1" />
                  ))}

                  {/* Hardware — clips */}
                  {mountingType === 'clips' && Array.from({ length: panelCount * 2 }, (_, i) => {
                    const t = (i + 0.5) / (panelCount * 2)
                    const cx = baseX + t * baseW
                    const cy = baseY + 2
                    return <circle key={i} cx={cx} cy={cy} r="2.5" fill="rgba(200,169,110,0.8)" stroke="rgba(15,17,23,0.5)" strokeWidth="0.5" />
                  })}

                  {/* Hardware — embedded */}
                  {mountingType === 'embedded' && (
                    <rect x={baseX} y={baseY - 2} width={baseW} height="4" fill="rgba(200,169,110,0.6)" />
                  )}

                  {/* Handrail */}
                  {includeHandrail && (
                    <line x1={baseX} y1={baseY - railH} x2={baseX + baseW} y2={baseY - railH}
                      stroke="rgba(200,169,110,0.8)" strokeWidth="3" strokeLinecap="round" />
                  )}

                  {/* LED glow */}
                  {includeLed && (
                    <>
                      <line x1={baseX + 3} y1={baseY - railH + 4} x2={baseX + baseW - 3} y2={baseY - railH + 4}
                        stroke="rgba(255,220,80,0.35)" strokeWidth="4" strokeLinecap="round" />
                      <line x1={baseX + 3} y1={baseY - railH + 4} x2={baseX + baseW - 3} y2={baseY - railH + 4}
                        stroke="rgba(255,240,120,0.7)" strokeWidth="1" strokeLinecap="round" />
                    </>
                  )}

                  {/* Glass reflection */}
                  <line x1={baseX + 2} y1={baseY - railH * 0.65} x2={baseX + baseW - 2} y2={baseY - railH * 0.65}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeLinecap="round" />
                </>
              )
            })()}
          </>
        )}
      </svg>

      {/* Mini scene thumbnails */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
        {SCENES.map((s, i) => (
          <button key={s.id}
            onClick={() => setSceneIdx(i)}
            style={{
              width: 40, height: 28, borderRadius: 6, border: i === sceneIdx ? '1.5px solid #c8a96e' : '1px solid rgba(255,255,255,0.1)',
              background: s.bg.split(',')[0].replace('linear-gradient(180deg, ', '').trim().split(' ')[0],
              cursor: 'pointer', opacity: i === sceneIdx ? 1 : 0.5, transition: 'all 0.2s',
            }}
            title={s.name}
          />
        ))}
      </div>
    </div>
  )
}
