import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { permissionHubService } from '../services/signalr/permissionHub'
import { updatePermissions } from '../store/slices/authSlice'
import { permissionService } from '../services/api/permission.service'
import type { RootState } from '../store/store'

export const usePermissionHub = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const isProcessingRef = useRef(false)
  const lastUpdateTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if user logs out
      permissionHubService.stopConnection()
      return
    }

    // Handle permission updates - register callback first
    const handlePermissionsUpdated = async (data: { role: string; permissionKeys: string[] }) => {
      console.log('SignalR: Received PermissionsUpdated event:', data)
      console.log('SignalR: Current user role:', user.role)
      
      // Only update if the update is for current user's role
      if (data.role !== user.role) {
        console.log('SignalR: Permission update is for different role, ignoring')
        return
      }

      // Debounce: ignore if processing or if called within 500ms
      const now = Date.now()
      if (isProcessingRef.current || (now - lastUpdateTimeRef.current < 500)) {
        console.log('SignalR: Ignoring duplicate or too frequent update')
        return
      }

      isProcessingRef.current = true
      lastUpdateTimeRef.current = now

      try {
        console.log('SignalR: Permissions updated for current user role, refreshing permissions...')
        
        // Fetch fresh permissions from API
        const freshPermissions = await permissionService.getMyPermissions()
        console.log('SignalR: Fetched fresh permissions:', freshPermissions)
        
        // Update Redux store
        dispatch(updatePermissions(freshPermissions))
        console.log('SignalR: Dispatched updatePermissions action')
        
        // Invalidate relevant queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
        
        console.log('SignalR: Permissions updated successfully')
      } catch (error) {
        console.error('SignalR: Error refreshing permissions after update:', error)
      } finally {
        isProcessingRef.current = false
      }
    }

    // Register callback before starting connection
    permissionHubService.onPermissionsUpdated(handlePermissionsUpdated)
    console.log('SignalR: Registered PermissionsUpdated callback')

    // Start connection when user is authenticated
    permissionHubService.startConnection().then(() => {
      console.log('SignalR: Connection started, waiting for permission updates...')
    }).catch((error) => {
      console.error('SignalR: Failed to start connection:', error)
    })

    return () => {
      console.log('SignalR: Cleaning up permission hub')
      permissionHubService.offPermissionsUpdated()
      isProcessingRef.current = false
    }
  }, [isAuthenticated, user, dispatch, queryClient])

  return {
    connectionState: permissionHubService.getConnectionState()
  }
}

