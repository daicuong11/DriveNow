import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userHubService } from '../services/signalr/userHub'
import { logout } from '../store/slices/authSlice'
import { showError, showWarning } from '../utils/notifications'
import type { RootState } from '../store/store'

export const useUserHub = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      userHubService.stopConnection()
      return
    }

    // Handle account locked event - force logout
    const handleAccountLocked = (data: { userId: number; lockedUntil: string }) => {
      console.log('UserHub: Account locked for user:', data.userId)
      
      // Check if this is for the current user
      if (data.userId === user.id) {
        const lockedUntilDate = new Date(data.lockedUntil)
        const message = `Tài khoản của bạn đã bị khóa đến ${lockedUntilDate.toLocaleString('vi-VN')}. Vui lòng liên hệ quản trị viên.`
        
        showError(message)
        
        // Force logout immediately
        dispatch(logout())
        queryClient.clear()
        
        // Redirect to login
        navigate('/login', { replace: true })
      }
    }

    // Handle account unlocked event (optional - just show notification)
    const handleAccountUnlocked = (data: { userId: number; message: string }) => {
      console.log('UserHub: Account unlocked for user:', data.userId)
      
      if (data.userId === user.id) {
        showWarning(data.message)
      }
    }

    // Handle user updated event (for Admin UI refresh)
    const handleUserUpdated = (data: { userId: number; isLocked: boolean; lockedUntil: string | null; isActive: boolean }) => {
      console.log('UserHub: User updated:', data)
      
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }

    // Register callbacks
    userHubService.onAccountLocked(handleAccountLocked)
    userHubService.onAccountUnlocked(handleAccountUnlocked)
    userHubService.onUserUpdated(handleUserUpdated)

    // Start connection
    userHubService.startConnection().catch((error) => {
      console.error('UserHub: Failed to start connection:', error)
    })

    return () => {
      userHubService.offAccountLocked()
      userHubService.offAccountUnlocked()
      userHubService.offUserUpdated()
    }
  }, [isAuthenticated, user, dispatch, queryClient, navigate])

  return {
    connectionState: userHubService.getConnectionState()
  }
}

