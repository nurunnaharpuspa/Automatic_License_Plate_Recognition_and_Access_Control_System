import { useEffect, useState } from 'react'
import { getSettings, updateSettings, uploadVideo } from '../../api/endpoints'

export default function SystemSettings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [eventType, setEventType] = useState('ENTRY')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)

  useEffect(() => { getSettings().then((r) => setSettings(r.data)) }, [])

  const handleSave = async () => {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!videoFile) return
    setUploading(true); setUploadMsg(null)
    const fd = new FormData()
    fd.append('video', videoFile)
    fd.append('event_type', eventType)
    try {
      await uploadVideo(fd)
      setUploadMsg({ ok: true, text: 'Processing started — watch the live feed.' })
      setVideoFile(null)
    } catch (err) {
      setUploadMsg({ ok: false, text: err.response?.data?.error || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  if (!settings) return (
    <div className="text-muted text-sm font-mono animate-pulse p-4">Loading settings...</div>
  )

  return (
    <div className="space-y-6">
      {/* system settings card */}
      <div className="card space-y-6">
        <h3 className="font-display font-bold text-primary text-lg">System settings</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* confidence threshold */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-muted font-mono uppercase tracking-wider">
                Confidence threshold
              </label>
              <span className="font-mono text-amber text-xs">
                {(settings.confidence_threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range" min="0.1" max="1" step="0.01"
              value={settings.confidence_threshold}
              onChange={(e) =>
                setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })
              }
              className="w-full accent-amber"
            />
            <div className="flex justify-between text-muted text-xs font-mono mt-1">
              <span>10%</span><span>100%</span>
            </div>
          </div>

          {/* frame sample rate */}
          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-2">
              Frame sample rate
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="1" max="30"
                value={settings.frame_sample_rate}
                onChange={(e) =>
                  setSettings({ ...settings, frame_sample_rate: parseInt(e.target.value) })
                }
                className="input-field w-20 font-mono text-center"
              />
              <span className="text-muted text-sm">frames skipped between samples</span>
            </div>
          </div>
        </div>

        {/* input mode */}
        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-2">
            Input mode
          </label>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 'VIDEO_UPLOAD',   label: 'Video upload' },
              { value: 'SINGLE_CAMERA',  label: 'Single camera' },
              { value: 'DUAL_CAMERA',    label: 'Dual camera' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSettings({ ...settings, input_mode: value })}
                className={`px-4 py-2 rounded text-sm font-mono border transition-colors ${
                  settings.input_mode === value
                    ? 'bg-amber/10 border-amber text-amber'
                    : 'border-border text-muted hover:border-secondary hover:text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary">
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </div>

      {/* video upload card */}
      <div className="card space-y-4">
        <h3 className="font-display font-bold text-primary text-lg">Test video upload</h3>
        <p className="text-secondary text-sm">
          Upload a video file to run the recognition pipeline. Results appear in the live feed.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-2">
              Video file
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="block text-sm text-secondary file:mr-4 file:py-2 file:px-4
                         file:rounded file:border file:border-border file:bg-surface
                         file:text-secondary file:text-sm file:font-mono
                         hover:file:border-amber hover:file:text-amber
                         file:transition-colors file:cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-2">
              Event type
            </label>
            <div className="flex gap-3">
              {['ENTRY', 'EXIT'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setEventType(t)}
                  className={`px-5 py-2 rounded text-sm font-mono border transition-colors ${
                    eventType === t
                      ? 'bg-amber/10 border-amber text-amber'
                      : 'border-border text-muted hover:border-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {uploadMsg && (
            <p className={`text-sm font-mono px-3 py-2 rounded border ${
              uploadMsg.ok
                ? 'text-green bg-green/10 border-green/20'
                : 'text-red bg-red/10 border-red/20'
            }`}>
              {uploadMsg.text}
            </p>
          )}

          <button type="submit" disabled={uploading || !videoFile} className="btn-primary">
            {uploading ? 'Uploading...' : 'Upload and process'}
          </button>
        </form>
      </div>
    </div>
  )
}