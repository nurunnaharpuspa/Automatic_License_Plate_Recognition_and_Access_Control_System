import { useEffect, useState } from 'react'
import { useWS } from '../context/WebSocketContext'

export function useLiveEvents(filterFn) {
  const { lastEvent } = useWS()
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!lastEvent) return
    if (!filterFn || filterFn(lastEvent)) {
      setEvents((prev) => [lastEvent, ...prev].slice(0, 200))
    }
  }, [lastEvent])

  return events
}