import * as signalR from '@microsoft/signalr'
import { getToken } from '../../utils/auth'

// Use the same base URL logic as axios service
const getHubUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  // If VITE_API_URL is a full URL (starts with http), extract base URL
  if (apiUrl.startsWith('http')) {
    // Remove /api suffix if present and add /hubs/permission
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}/hubs/permission`
  }
  
  // If relative path, use relative path for Vite proxy
  // Vite proxy will handle /hubs/* requests
  return '/hubs/permission'
}

class PermissionHubService {
  private connection: signalR.HubConnection | null = null
  private onPermissionsUpdatedCallback: ((data: { role: string; permissionKeys: string[] }) => void) | null = null

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
        // Enable all transport types for fallback
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            // Retry every 2 seconds for the first minute
            return 2000
          } else {
            // Retry every 10 seconds after the first minute
            return 10000
          }
        }
      })
      .build()

    // Connection event handlers
    this.connection.onclose((error) => {
      console.log('PermissionHub SignalR connection closed', error)
    })

    this.connection.onreconnecting((error) => {
      console.log('PermissionHub SignalR reconnecting', error)
    })

    this.connection.onreconnected((connectionId) => {
      console.log('PermissionHub SignalR reconnected', connectionId)
    })

    // Listen for permission updates - register before starting connection
    this.connection.on('PermissionsUpdated', (data: { role: string; permissionKeys: string[] }) => {
      console.log('PermissionHub: Received PermissionsUpdated event:', data)
      if (this.onPermissionsUpdatedCallback) {
        console.log('PermissionHub: Calling callback with data:', data)
        this.onPermissionsUpdatedCallback(data)
      } else {
        console.warn('PermissionHub: No callback registered for PermissionsUpdated')
      }
    })

    try {
      await this.connection.start()
      console.log('PermissionHub SignalR connected')
    } catch (error) {
      console.error('Error starting PermissionHub SignalR connection:', error)
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  onPermissionsUpdated(callback: (data: { role: string; permissionKeys: string[] }) => void): void {
    this.onPermissionsUpdatedCallback = callback
  }

  offPermissionsUpdated(): void {
    this.onPermissionsUpdatedCallback = null
  }

  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }
}

export const permissionHubService = new PermissionHubService()

