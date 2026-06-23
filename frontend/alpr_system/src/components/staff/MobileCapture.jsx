import { useEffect, useRef, useState } from 'react'
import api from '../../api/axios'

const CAMERA_ID   = 'mobile-camera'
const INTERVAL_MS = 2000

export default function MobileCapture({ embedded = false }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const timerRef   = useRef(null)

  const [active,      setActive]      = useState(false)
  const [eventType,   setEventType]   = useState('ENTRY')
  const [status,      setStatus]      = useState('idle')
  const [frameCount,  setFrameCount]  = useState(0)
  const [lastResult,  setLastResult]  = useState(null)
  const [facingMode,  setFacingMode]  = useState('environment')

  const startCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setStatus('streaming'); setActive(true)
      timerRef.current = setInterval(captureAndSend, INTERVAL_MS)
    } catch (err) {
      setStatus('error')
      setLastResult({ ok: false, msg: `Camera error: ${err.message}` })
    }
  }

  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (videoRef.current)  videoRef.current.srcObject = null
    streamRef.current = timerRef.current = null
    setActive(false); setStatus('idle'); setFrameCount(0)
  }

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    if (active) { stopCamera(); setTimeout(startCamera, 300) }
  }

  const captureAndSend = () => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const fd = new FormData()
      fd.append('frame', blob, 'frame.jpg')
      fd.append('event_type', eventType)
      try {
        await api.post(`/recognition/frame/${CAMERA_ID}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setFrameCount((c) => c + 1)
        setLastResult({ ok: true, time: new Date().toLocaleTimeString() })
      } catch (err) {
        setLastResult({ ok: false, msg: err.response?.data?.error || 'Frame rejected' })
      }
    }, 'image/jpeg', 0.85)
  }

  useEffect(() => () => stopCamera(), [])

  const inner = (
    <div className="space-y-4">
      <div className="relative bg-surface border border-border rounded-lg overflow-hidden"
           style={{ aspectRatio: '16/6' }}>
        <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm font-mono">Tap start to activate</p>
          </div>
        )}
        {active && <>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-bg/80 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
            <span className="text-xs font-mono text-primary">{frameCount} sent</span>
          </div>
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono border bg-bg/80 ${
            eventType === 'ENTRY' ? 'text-teal border-teal/30' : 'text-amber border-amber/30'
          }`}>{eventType}</div>
        </>}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        {['ENTRY', 'EXIT'].map((t) => (
          <button key={t} onClick={() => setEventType(t)}
            className={`flex-1 py-2 rounded text-sm font-mono border transition-colors ${
              eventType === t
                ? t === 'ENTRY' ? 'bg-teal/10 border-teal text-teal' : 'bg-amber/10 border-amber text-amber'
                : 'border-border text-muted hover:border-secondary'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {!active
          ? <button onClick={startCamera} className="btn-primary flex-1">Start</button>
          : <button onClick={stopCamera}  className="btn-danger flex-1">Stop</button>
        }
        <button onClick={flipCamera} className="btn-ghost px-3" title="Flip">⇄</button>
        <div className="flex items-center gap-1.5 ml-1">
          <span className={`w-2 h-2 rounded-full ${
            status === 'streaming' ? 'bg-green animate-pulse-slow' :
            status === 'error' ? 'bg-red' : 'bg-muted'
          }`} />
          <span className="text-xs font-mono text-muted capitalize">{status}</span>
        </div>
      </div>

      {lastResult && (
        <p className={`text-xs font-mono px-3 py-2 rounded border ${
          lastResult.ok ? 'text-green bg-green/10 border-green/20' : 'text-red bg-red/10 border-red/20'
        }`}>
          {lastResult.ok ? `Sent at ${lastResult.time}` : lastResult.msg}
        </p>
      )}

      <p className="text-xs text-muted font-mono">
        Open on phone · Session-based · {facingMode === 'environment' ? 'Rear' : 'Front'} camera
      </p>
    </div>
  )

  if (embedded) return inner
  return <div className="card">{inner}</div>
}