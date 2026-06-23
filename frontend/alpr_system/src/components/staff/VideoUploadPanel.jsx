import { useState } from 'react'
import { uploadVideo } from '../../api/endpoints'

export default function VideoUploadPanel() {
  const [videoFile, setVideoFile] = useState(null)
  const [eventType, setEventType] = useState('ENTRY')
  const [uploading, setUploading] = useState(false)
  const [result,    setResult]    = useState(null)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!videoFile) return
    setUploading(true); setResult(null)
    const fd = new FormData()
    fd.append('video', videoFile)
    fd.append('event_type', eventType)
    try {
      await uploadVideo(fd)
      setResult({ ok: true, text: 'Processing started — watch the live feed.' })
      setVideoFile(null)
    } catch (err) {
      setResult({ ok: false, text: err.response?.data?.error || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-display font-bold text-primary">Video upload</h4>
        <p className="text-secondary text-sm mt-1">
          Upload a recorded video to run the recognition pipeline.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-2">
            Video file
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="block text-sm text-secondary
                       file:mr-4 file:py-2 file:px-4 file:rounded
                       file:border file:border-border file:bg-surface
                       file:text-secondary file:text-sm file:font-mono
                       hover:file:border-amber hover:file:text-amber
                       file:transition-colors file:cursor-pointer"
            required
          />
          {videoFile && (
            <p className="text-xs text-muted font-mono mt-1">
              {videoFile.name} — {(videoFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
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
                className={`flex-1 py-2.5 rounded text-sm font-mono border transition-colors ${
                  eventType === t
                    ? t === 'ENTRY'
                      ? 'bg-teal/10 border-teal text-teal'
                      : 'bg-amber/10 border-amber text-amber'
                    : 'border-border text-muted hover:border-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <p className={`text-sm font-mono px-3 py-2 rounded border ${
            result.ok
              ? 'text-green bg-green/10 border-green/20'
              : 'text-red   bg-red/10   border-red/20'
          }`}>
            {result.text}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !videoFile}
          className="btn-primary w-full"
        >
          {uploading ? 'Processing...' : 'Upload and process'}
        </button>
      </form>
    </div>
  )
}