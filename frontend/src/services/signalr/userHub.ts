import * as signalR from '@microsoft/signalr'
import { getToken } from '../../utils/auth'

const getHubUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  if (apiUrl.startsWith('http')) {
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}/hubs/user`
  }
  
  return '/hubs/user'
}

class UserHubService {
  private connection: signalR.HubConnection | null = null
  private onAccountLockedCallback: ((data: { userId: number; lockedUntil: string }) => void) | null = null
  private onAccountUnlockedCallback: ((data: { userId: number; message: string }) => void) | null = null
  private onUserUpdatedCallback: ((data: { userId: number; isLocked: boolean; lockedUntil: string | null; isActive: boolean }) => void) | null = null

  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    const hubUrl = getHubUrl()
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          const token = getToken()
          return token || ''
        },
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return 2000
          } else {
            return 10000
          }
        }
      })
      .build()

    this.connection.onclose((error) => {
      console.log('UserHub SignalR connection closed', error)
    })

    this.connection.onreconnecting((error) => {
      console.log('UserHub SignalR reconnecting', error)
    })

    this.connection.onreconnected((connectionId) => {
      console.log('UserHub SignalR reconnected', connectionId)
    })

    // Listen for account locked event
    this.connection.on('AccountLocked', (data: { userId: number; lockedUntil: string }) => {
      console.log('UserHub: Received AccountLocked event:', data)
      if (this.onAccountLockedCallback) {
        this.onAccountLockedCallback(data)
      }
    })

    // Listen for account unlocked event
    this.connection.on('AccountUnlocked', (data: { userId: number; message: string }) => {
      console.log('UserHub: Received AccountUnlocked event:', data)
      if (this.onAccountUnlockedCallback) {
        this.onAccountUnlockedCallback(data)
      }
    })

    // Listen for user updated event (for Admin UI refresh)
    this.connection.on('UserUpdated', (data: { userId: number; isLocked: boolean; lockedUntil: string | null; isActive: boolean }) => {
      console.log('UserHub: Received UserUpdated event:', data)
      if (this.onUserUpdatedCallback) {
        this.onUserUpdatedCallback(data)
      }
    })

    try {
      await this.connection.start()
      console.log('UserHub SignalR connected')
    } catch (error) {
      console.error('Error starting UserHub SignalR connection:', error)
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  onAccountLocked(callback: (data: { userId: number; lockedUntil: string }) => void): void {
    this.onAccountLockedCallback = callback
  }

  offAccountLocked(): void {
    this.onAccountLockedCallback = null
  }

  onAccountUnlocked(callback: (data: { userId: number; message: string }) => void): void {
    this.onAccountUnlockedCallback = callback
  }

  offAccountUnlocked(): void {
    this.onAccountUnlockedCallback = null
  }

  onUserUpdated(callback: (data: { userId: number; isLocked: boolean; lockedUntil: string | null; isActive: boolean }) => void): void {
    this.onUserUpdatedCallback = callback
  }

  offUserUpdated(): void {
    this.onUserUpdatedCallback = null
  }

  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }
}

export const userHubService = new UserHubService()

