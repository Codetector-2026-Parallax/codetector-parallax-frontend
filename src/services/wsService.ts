import { WS_BASE_URL, getStoredToken } from "./apiClient"
import type { WsLeaderboardUpdatedEvent, WsStageClearedEvent, WsSyncStateEvent } from "../types/game"

type WsEventListener = (
  event: WsStageClearedEvent | WsSyncStateEvent | WsLeaderboardUpdatedEvent | Record<string, unknown>
) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private listeners: Set<WsEventListener> = new Set()
  private pingInterval: number | null = null
  private reconnectTimeout: number | null = null
  private isExplicitlyClosed = false

  public connect(): void {
    this.isExplicitlyClosed = false
    const token = getStoredToken()
    const wsUrl = token
      ? `${WS_BASE_URL}/ws/team?token=${encodeURIComponent(token)}`
      : `${WS_BASE_URL}/ws/leaderboard`

    try {
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        this.startHeartbeat()
      }

      this.socket.onmessage = (event) => {
        try {
          if (event.data === "pong") return
          const data = JSON.parse(event.data)
          this.listeners.forEach((listener) => listener(data))
        } catch {
          // not json
        }
      }

      this.socket.onclose = () => {
        this.cleanup()
        if (!this.isExplicitlyClosed) {
          // Auto reconnect after 3 seconds
          this.reconnectTimeout = window.setTimeout(() => {
            this.connect()
          }, 3000)
        }
      }

      this.socket.onerror = () => {
        this.socket?.close()
      }
    } catch {
      // ignore
    }
  }

  public subscribe(listener: WsEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true
    this.cleanup()
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  private startHeartbeat(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send("ping")
      }
    }, 25000)
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }
}

export const wsService = new WebSocketService()
