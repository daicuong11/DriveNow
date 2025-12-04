import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { vehicleHubService } from '../services/signalr/vehicleHub'

export const useVehicleHub = (vehicleId?: number) => {
  const queryClient = useQueryClient()
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    // Start connection
    vehicleHubService.startConnection()

    // Subscribe to vehicle list updates
    const handleListUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }

    vehicleHubService.onVehicleListUpdated(handleListUpdate)

    // Subscribe to specific vehicle if vehicleId is provided
    if (vehicleId && !isSubscribedRef.current) {
      vehicleHubService.subscribeToVehicle(vehicleId, (data) => {
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] })
        queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      })
      isSubscribedRef.current = true
    }

    return () => {
      vehicleHubService.offVehicleListUpdated(handleListUpdate)
      if (vehicleId && isSubscribedRef.current) {
        vehicleHubService.unsubscribeFromVehicle(vehicleId)
        isSubscribedRef.current = false
      }
    }
  }, [vehicleId, queryClient])

  return {
    connectionState: vehicleHubService.getConnectionState()
  }
}

