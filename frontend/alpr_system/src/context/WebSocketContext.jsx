import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const WSContext = createContext(null)

export function WebSocketProvider({ children }) {
  const { user } = useAuth()
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (!user) return
    const token = localStorage.getItem('access')
    if (!token) return

  const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

  const socket = new WebSocket(
    `${WS_BASE}/ws/events/?token=${token}`
  )
    wsRef.current = socket

    socket.onopen = () => {
      setConnected(true)
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    socket.onclose = (e) => {
      setConnected(false)
      // don't reconnect on auth failure (code 4001)
      if (e.code !== 4001) {
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    }

    socket.onerror = () => {
      socket.close()
    }

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setLastEvent(data)
      } catch {
        // ignore malformed messages
      }
    }
  }, [user])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return (
    <WSContext.Provider value={{ lastEvent, connected }}>
      {children}
    </WSContext.Provider>
  )
}

export const useWS = () => useContext(WSContext)