import { useState } from 'react'
import WebcamCapture from './WebcamCapture'
import MobileCapture from './MobileCapture'
import VideoUploadPanel from './VideoUploadPanel'

const tabs = [
  { key: 'webcam',  label: 'Webcam'  },
  { key: 'mobile',  label: 'Mobile'  },
  { key: 'video',   label: 'Video'   },
]

export default function CameraPanel() {
  const [tab, setTab] = useState('webcam')

  return (
    <div className="flex flex-col h-full">
      {/* tab bar */}
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-amber text-amber'
                : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'webcam' && <WebcamCapture embedded />}
        {tab === 'mobile' && <MobileCapture embedded />}
        {tab === 'video'  && <VideoUploadPanel />}
      </div>
    </div>
  )
}