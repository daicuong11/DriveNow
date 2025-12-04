import * as signalR from '@microsoft/signalr'
import { getToken } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const API_URL = import.meta.env.VITE_API_URL || '/api'

class VehicleHubService {
  private connection: signalR.HubConnection | null = null

  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    // Use API_URL if available, otherwise construct from API_BASE_URL
    const hubUrl = API_URL.startsWith('http') 
      ? `${API_URL.replace('/api', '')}/hubs/vehicle`
      : `${API_BASE_URL}/hubs/vehicle`
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          const token = getToken()
          return token || ''
        }
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
      console.log('SignalR connection closed', error)
    })

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting', error)
    })

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected', connectionId)
    })

    try {
      await this.connection.start()
      console.log('SignalR connected')
    } catch (error) {
      console.error('Error starting SignalR connection:', error)
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  async subscribeToVehicle(vehicleId: number, callback: (data: any) => void): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection()
    }

    if (this.connection) {
      await this.connection.invoke('SubscribeToVehicle', vehicleId)
      this.connection.on('VehicleUpdated', callback)
      this.connection.on('VehicleDeleted', callback)
    }
  }

  async unsubscribeFromVehicle(vehicleId: number): Promise<void> {
    if (this.connection) {
      await this.connection.invoke('UnsubscribeFromVehicle', vehicleId)
      this.connection.off('VehicleUpdated')
      this.connection.off('VehicleDeleted')
    }
  }

  onVehicleListUpdated(callback: () => void): void {
    if (this.connection) {
      this.connection.on('VehicleListUpdated', callback)
    }
  }

  offVehicleListUpdated(callback: () => void): void {
    if (this.connection) {
      this.connection.off('VehicleListUpdated', callback)
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null
  }
}

export const vehicleHubService = new VehicleHubService()

