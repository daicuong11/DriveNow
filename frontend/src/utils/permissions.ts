import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'

/**
 * Hook to check permission (for use in components)
 * This is the recommended way to check permissions in React components
 */
export const useHasPermission = (permissionKey: string): boolean => {
  const permissions = useSelector((state: RootState) => state.auth.permissions)
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  
  // Admin has all permissions
  if (userRole === 'Admin') {
    return true
  }
  
  return permissions.includes(permissionKey)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (permissionKeys: string[]): boolean => {
  const permissions = useSelector((state: RootState) => state.auth.permissions)
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  
  // Admin has all permissions
  if (userRole === 'Admin') {
    return true
  }
  
  return permissionKeys.some(key => permissions.includes(key))
}

/**
 * Hook to check if user has all of the specified permissions
 */
export const useHasAllPermissions = (permissionKeys: string[]): boolean => {
  const permissions = useSelector((state: RootState) => state.auth.permissions)
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  
  // Admin has all permissions
  if (userRole === 'Admin') {
    return true
  }
  
  return permissionKeys.every(key => permissions.includes(key))
}

/**
 * Legacy function for non-hook usage (use useHasPermission hook instead)
 * @deprecated Use useHasPermission hook instead
 */
export const hasPermission = (permissionKey: string): boolean => {
  // This won't work properly outside of React components
  // Use useHasPermission hook instead
  console.warn('hasPermission function is deprecated. Use useHasPermission hook instead.')
  return false
}

