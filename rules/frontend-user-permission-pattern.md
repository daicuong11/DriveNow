# Frontend User và Permission Management Pattern

## Mục đích

File này mô tả pattern chuẩn để implement hệ thống quản lý người dùng và phân quyền (User & Permission Management) trong frontend. Pattern này bao gồm:

- Permission-based UI rendering (thay vì chỉ Role-based)
- Real-time permission updates với SignalR (PermissionHub)
- Real-time user status updates với SignalR (UserHub) - lock/unlock tài khoản
- Redux store integration
- Permission checking hooks
- Role Permissions Management Page
- Force logout khi tài khoản bị khóa

**Version:** 1.1  
**Last Updated:** 2025-12-05

---

## PHẦN 1: REDUX STORE INTEGRATION

### 1.1. AuthSlice Updates

**Location:** `frontend/src/store/slices/authSlice.ts`

**Pattern:**

```typescript
interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: string
  permissions: string[] // Added
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[] // Added
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  permissions: [], // Initialized
  isAuthenticated: false,
  isLoading: true
}

// In setCredentials action:
setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string; permissions?: string[] }>) => {
  state.user = action.payload.user
  state.accessToken = action.payload.accessToken
  state.refreshToken = action.payload.refreshToken
  state.isAuthenticated = true
  state.isLoading = false
  state.permissions = action.payload.permissions || action.payload.user.permissions || []
  
  // Save to localStorage
  localStorage.setItem('accessToken', action.payload.accessToken)
  localStorage.setItem('refreshToken', action.payload.refreshToken)
  if (action.payload.permissions) {
    localStorage.setItem('permissions', JSON.stringify(action.payload.permissions))
  }
}

// Add updatePermissions action:
updatePermissions: (state, action: PayloadAction<string[]>) => {
  state.permissions = action.payload
  localStorage.setItem('permissions', JSON.stringify(action.payload))
}

// In logout action:
logout: (state) => {
  state.user = null
  state.accessToken = null
  state.refreshToken = null
  state.permissions = [] // Clear permissions
  state.isAuthenticated = false
  state.isLoading = false
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('permissions') // Clear permissions
}
```

**Key Points:**
- `permissions` được lưu trong cả `User` object và `AuthState` root level
- `updatePermissions` action để cập nhật permissions real-time (từ SignalR)
- Permissions được lưu vào localStorage để persist

### 1.2. Login Integration

**Location:** `frontend/src/pages/auth/Login.tsx`

**Pattern:**

```typescript
const response = await authService.login(username, password)

dispatch(
  setCredentials({
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    permissions: response.permissions // Include permissions from login response
  })
)
```

**Key Points:**
- Pass `permissions` từ login response vào `setCredentials`

---

## PHẦN 2: PERMISSION UTILITIES

### 2.1. Permission Hooks

**Location:** `frontend/src/utils/permissions.ts`

**Pattern:**

```typescript
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
```

**Key Points:**
- Admin luôn return `true` (có tất cả permissions)
- Employee check trong `permissions` array
- Dùng hooks thay vì functions để có reactivity với Redux store

---

## PHẦN 3: PERMISSION SERVICE

### 3.1. Permission API Service

**Location:** `frontend/src/services/api/permission.service.ts`

**Pattern:**

```typescript
import api from './axios'

export interface Permission {
  id: number
  key: string
  name: string
  description: string
  category: string
  sortOrder: number
}

export interface PermissionGroup {
  title: string
  permissions: Permission[]
}

export interface RolePermissionDto {
  role: string
  permissionKeys: string[]
}

export interface UpdateRolePermissionsRequest {
  role: string
  permissionKeys: string[]
}

export const permissionService = {
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<{ success: boolean; data: Permission[] }>('/Permissions')
    return response.data.data
  },

  getPermissionGroups: async (): Promise<PermissionGroup[]> => {
    const response = await api.get<{ success: boolean; data: PermissionGroup[] }>('/Permissions/groups')
    return response.data.data
  },

  getRolePermissions: async (roleName: string): Promise<RolePermissionDto> => {
    const response = await api.get<{ success: boolean; data: RolePermissionDto }>(`/Permissions/role/${roleName}`)
    return response.data.data
  },

  updateRolePermissions: async (request: UpdateRolePermissionsRequest): Promise<void> => {
    await api.put(`/Permissions/role/${request.role}`, request)
  },

  getMyPermissions: async (): Promise<string[]> => {
    const response = await api.get<{ success: boolean; data: string[] }>('/Permissions/me')
    return response.data.data
  },

  seedPermissions: async (): Promise<void> => {
    await api.post('/Permissions/seed')
  }
}
```

**Key Points:**
- Tất cả methods return typed responses
- `getMyPermissions` không cần Admin role (chỉ cần authenticated)

---

## PHẦN 4: SIGNALR INTEGRATION

### 4.1. PermissionHub Service

**Location:** `frontend/src/services/signalr/permissionHub.ts`

**Pattern:**

```typescript
import * as signalR from '@microsoft/signalr'
import { getToken } from '../../utils/auth'

const getHubUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  // If VITE_API_URL is a full URL (starts with http), extract base URL
  if (apiUrl.startsWith('http')) {
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}/hubs/permission`
  }
  
  // If relative path, use relative path for Vite proxy
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

    // Listen for permission updates
    this.connection.on('PermissionsUpdated', (data: { role: string; permissionKeys: string[] }) => {
      console.log('PermissionHub: Received PermissionsUpdated event:', data)
      if (this.onPermissionsUpdatedCallback) {
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
```

**Key Points:**
- Singleton service pattern
- Auto-reconnect với exponential backoff
- Support multiple transport types (WebSockets, ServerSentEvents, LongPolling)
- Callback pattern để register/unregister handlers

### 4.2. usePermissionHub Hook

**Location:** `frontend/src/hooks/usePermissionHub.ts`

**Pattern:**

```typescript
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
      permissionHubService.stopConnection()
      return
    }

    // Handle permission updates - register callback first
    const handlePermissionsUpdated = async (data: { role: string; permissionKeys: string[] }) => {
      // Only update if the update is for current user's role
      if (data.role !== user.role) {
        return
      }

      // Debounce: ignore if processing or if called within 500ms
      const now = Date.now()
      if (isProcessingRef.current || (now - lastUpdateTimeRef.current < 500)) {
        return
      }

      isProcessingRef.current = true
      lastUpdateTimeRef.current = now

      try {
        // Fetch fresh permissions from API
        const freshPermissions = await permissionService.getMyPermissions()
        
        // Update Redux store
        dispatch(updatePermissions(freshPermissions))
        
        // Invalidate relevant queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
      } catch (error) {
        console.error('SignalR: Error refreshing permissions after update:', error)
      } finally {
        isProcessingRef.current = false
      }
    }

    // Register callback before starting connection
    permissionHubService.onPermissionsUpdated(handlePermissionsUpdated)

    // Start connection when user is authenticated
    permissionHubService.startConnection()

    return () => {
      permissionHubService.offPermissionsUpdated()
      isProcessingRef.current = false
    }
  }, [isAuthenticated, user, dispatch, queryClient])

  return {
    connectionState: permissionHubService.getConnectionState()
  }
}
```

**Key Points:**
- Debounce để tránh gọi API nhiều lần (500ms)
- `isProcessingRef` để tránh xử lý đồng thời
- Chỉ xử lý updates cho role của current user
- Fetch fresh permissions từ API thay vì dùng data từ SignalR message
- Invalidate queries để refresh UI

### 4.3. App.tsx Integration

**Location:** `frontend/src/App.tsx`

**Pattern:**

```typescript
import { usePermissionHub } from './hooks/usePermissionHub'

function App() {
  usePermissionHub() // Start SignalR connection when app loads
  
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <BrowserRouter>
          <AuthInitializer>
            <AppLayout />
            <ToastContainer ... />
          </AuthInitializer>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
```

**Key Points:**
- Gọi `usePermissionHub()` ở root level để connection được maintain trong suốt app lifecycle

### 4.4. UserHub Service

**Location:** `frontend/src/services/signalr/userHub.ts`

**Pattern:**

```typescript
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

    // Connection event handlers
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
```

**Key Points:**
- Singleton service pattern tương tự PermissionHubService
- Lắng nghe 3 events: `AccountLocked`, `AccountUnlocked`, `UserUpdated`
- Callback pattern để register/unregister handlers

### 4.5. useUserHub Hook

**Location:** `frontend/src/hooks/useUserHub.ts`

**Pattern:**

```typescript
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
```

**Key Points:**
- Khi nhận `AccountLocked` cho current user: hiển thị error, dispatch logout, clear queries, redirect về login
- Khi nhận `AccountUnlocked`: hiển thị warning notification
- Khi nhận `UserUpdated`: invalidate `users` query để refresh Admin UI
- Cleanup callbacks khi component unmount

### 4.6. App.tsx Integration (Updated)

**Location:** `frontend/src/App.tsx`

**Pattern:**

```typescript
import { usePermissionHub } from './hooks/usePermissionHub'
import { useUserHub } from './hooks/useUserHub'

function AppContent() {
  // Initialize Permission Hub for real-time permission updates
  usePermissionHub()
  // Initialize User Hub for real-time user status updates (lock/unlock)
  useUserHub()
  
  return (
    <>
      <AppLayout />
      <ToastContainer ... />
    </>
  )
}
```

**Key Points:**
- Gọi cả `usePermissionHub()` và `useUserHub()` ở root level
- Cả hai connections được maintain trong suốt app lifecycle

### 4.7. Vite Proxy Configuration

**Location:** `frontend/vite.config.ts`

**Pattern:**

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7291',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/hubs': {
        target: 'https://localhost:7291',
        changeOrigin: true,
        secure: false,
        ws: true // Important for WebSocket support
      }
    }
  }
})
```

**Key Points:**
- Proxy `/hubs` với `ws: true` để support WebSocket connections
- `secure: false` để allow self-signed certificates

---

## PHẦN 5: ROLE PERMISSIONS MANAGEMENT PAGE

### 5.1. RolePermissionsPage

**Location:** `frontend/src/pages/users/RolePermissionsPage.tsx`

**Key Features:**
- Hiển thị permissions theo groups (categories)
- Checkbox để tick/bỏ tick permissions
- "Chọn tất cả" cho mỗi group
- Hiển thị số lượng permissions đã phân quyền: `Tên nhóm (x/y)`
- "Khôi phục mặc định" chỉ reset local state (không gọi API)
- "Lưu phân quyền" mới gọi API và gửi SignalR message
- Dấu (*) trong title khi có thay đổi chưa lưu
- Ctrl+S để lưu

**Pattern:**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { Card, Checkbox, Button, Space, Typography, Row, Col } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { permissionService } from '../../services/api/permission.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Define permission groups (static, matches backend categories)
const permissionGroups: PermissionGroup[] = [
  {
    title: 'Quản lý Người dùng',
    permissions: [
      { key: 'users.view', name: 'Xem danh sách người dùng', description: '...' },
      // ... more permissions
    ]
  },
  // ... more groups
]

// Default permissions for each role
const legacyDefaultRolePermissions: Record<string, string[]> = {
  Admin: [/* all permissions */],
  Employee: [/* limited permissions */]
}

const RolePermissionsPage = () => {
  const navigate = useNavigate()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const [selectedRole, setSelectedRole] = useState<string>('Employee')
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    Admin: [],
    Employee: []
  })
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, string[]>>({
    Admin: [],
    Employee: []
  })

  const queryClient = useQueryClient()

  // Load role permissions from backend
  const { data: adminPermissions } = useQuery({
    queryKey: ['rolePermissions', 'Admin'],
    queryFn: () => permissionService.getRolePermissions('Admin'),
    enabled: true
  })

  const { data: employeePermissions } = useQuery({
    queryKey: ['rolePermissions', 'Employee'],
    queryFn: () => permissionService.getRolePermissions('Employee'),
    enabled: true
  })

  // Update local state when data loads
  useEffect(() => {
    if (adminPermissions) {
      const adminPerms = adminPermissions.permissionKeys
      setPermissions((prev) => ({ ...prev, Admin: adminPerms }))
      setOriginalPermissions((prev) => ({ ...prev, Admin: [...adminPerms] }))
    }
  }, [adminPermissions])

  useEffect(() => {
    if (employeePermissions) {
      const employeePerms = employeePermissions.permissionKeys
      setPermissions((prev) => ({ ...prev, Employee: employeePerms }))
      setOriginalPermissions((prev) => ({ ...prev, Employee: [...employeePerms] }))
    }
  }, [employeePermissions])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { role: string; permissionKeys: string[] }) => {
      await permissionService.updateRolePermissions(data.role, data.permissionKeys)
    },
    onSuccess: () => {
      showSuccess('Lưu phân quyền thành công!')
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
    },
    onError: (error: unknown) => {
      showError(getErrorMessage(error, 'Lưu phân quyền thất bại. Vui lòng thử lại!'))
    }
  })

  const handleSave = useCallback(() => {
    const permissionKeys = permissions[selectedRole] || []
    saveMutation.mutate(
      {
        role: selectedRole,
        permissionKeys
      },
      {
        onSuccess: () => {
          // Update original permissions after save
          setOriginalPermissions((prev) => ({
            ...prev,
            [selectedRole]: [...permissionKeys]
          }))
        }
      }
    )
  }, [selectedRole, permissions, saveMutation])

  // Handle Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const currentPerms = permissions[selectedRole] || []
        const originalPerms = originalPermissions[selectedRole] || []
        const hasChanges = JSON.stringify([...currentPerms].sort()) !== JSON.stringify([...originalPerms].sort())
        if (!saveMutation.isPending && hasChanges) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveMutation.isPending, selectedRole, permissions, originalPermissions, handleSave])

  const handleReset = () => {
    // Reset to default permissions (only in local state, not saved yet)
    const defaultPermissions = legacyDefaultRolePermissions[selectedRole] || []
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: [...defaultPermissions]
    }))
  }

  const currentPermissions = permissions[selectedRole] || []
  const originalRolePermissions = originalPermissions[selectedRole] || []
  const hasUnsavedChanges = JSON.stringify([...currentPermissions].sort()) !== JSON.stringify([...originalRolePermissions].sort())

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Phân quyền theo Vai trò{hasUnsavedChanges ? ' (*)' : ''}
          </Title>
        </div>
        <Space>
          <Button onClick={handleReset}>Khôi phục mặc định</Button>
          <Button type='primary' icon={<SaveOutlined />} onClick={handleSave} loading={saveMutation.isPending}>
            Lưu phân quyền
          </Button>
        </Space>
      </div>

      {/* Role selector */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Chọn vai trò:</Text>
          <Button type={selectedRole === 'Admin' ? 'primary' : 'default'} onClick={() => setSelectedRole('Admin')}>
            Quản trị viên (Admin)
          </Button>
          <Button type={selectedRole === 'Employee' ? 'primary' : 'default'} onClick={() => setSelectedRole('Employee')}>
            Nhân viên (Employee)
          </Button>
        </Space>
      </Card>

      {/* Permission groups */}
      {permissionGroups.map((group, groupIndex) => {
        const allChecked = group.permissions.every((perm) => currentPermissions.includes(perm.key))
        const someChecked = group.permissions.some((perm) => currentPermissions.includes(perm.key))
        const checkedCount = group.permissions.filter((perm) => currentPermissions.includes(perm.key)).length

        return (
          <Card
            key={groupIndex}
            title={
              <div className='flex items-center justify-between'>
                <span>
                  {group.title} ({checkedCount}/{group.permissions.length})
                </span>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={(e) => handleSelectAll(group, e.target.checked)}
                >
                  Chọn tất cả
                </Checkbox>
              </div>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              {group.permissions.map((permission) => {
                const isChecked = currentPermissions.includes(permission.key)
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={permission.key}>
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{permission.name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{permission.description}</div>
                      </div>
                    </Checkbox>
                  </Col>
                )
              })}
            </Row>
          </Card>
        )
      })}
    </div>
  )
}
```

**Key Points:**
- Track `originalPermissions` để detect unsaved changes
- "Khôi phục mặc định" chỉ reset local state
- "Lưu phân quyền" mới gọi API
- Hiển thị `(x/y)` trong title của mỗi group
- Dấu (*) trong page title khi có unsaved changes
- Ctrl+S để lưu

---

## PHẦN 6: UI PERMISSION CHECKING

### 6.1. Replace isAdmin Checks

**Pattern:**

```typescript
// OLD (Role-based):
const isAdmin = userRole === 'Admin'
{isAdmin && <Button>Delete</Button>}

// NEW (Permission-based):
const canDelete = useHasPermission('invoices.delete')
{canDelete && <Button>Delete</Button>}
```

### 6.2. Sidebar Menu Filtering

**Location:** `frontend/src/components/layout/Sidebar.tsx`

**Pattern:**

```typescript
import { useHasPermission } from '../../utils/permissions'

const Sidebar = () => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const permissions = useSelector((state: RootState) => state.auth.permissions)
  
  // Permission checks
  const hasDashboardView = useHasPermission('dashboard.view')
  const hasVehiclesView = useHasPermission('vehicles.view')
  const hasRentalsView = useHasPermission('rentals.view')
  // ... more permission checks

  // Filter menu items based on permissions
  const allMenuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = []
    
    // Dashboard
    if (hasDashboardView) {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: 'dashboard.view'
      })
    }
    
    // Vehicles
    if (hasVehiclesView) {
      items.push({
        key: 'vehicles',
        icon: <CarOutlined />,
        label: 'Quản lý Xe',
        permission: 'vehicles.view',
        children: [
          { key: '/vehicles', label: 'Danh sách Xe', permission: 'vehicles.view' },
          { key: '/vehicles/in-out', label: 'Xuất/Nhập Bãi', permission: 'vehicles.inout' },
          { key: '/vehicles/maintenance', label: 'Bảo dưỡng/Sửa chữa', permission: 'vehicles.maintenance' }
        ].filter(item => !item.permission || permissions.includes(item.permission) || userRole === 'Admin')
      })
    }
    
    // ... more menu items
    
    return items
  }, [hasDashboardView, hasVehiclesView, hasRentalsView, permissions, userRole])

  // ... render menu
}
```

**Key Points:**
- Dùng `useHasPermission` để check permissions
- Filter menu items và children dựa trên permissions
- Admin vẫn có thể thấy tất cả (check `userRole === 'Admin'`)

### 6.3. Page-Level Permission Checks

**Pattern:**

```typescript
import { useHasPermission } from '../../utils/permissions'

const VehiclesPage = () => {
  const canCreate = useHasPermission('vehicles.create')
  const canEdit = useHasPermission('vehicles.edit')
  const canDelete = useHasPermission('vehicles.delete')
  const canImport = useHasPermission('masterdata.import')
  const canExport = useHasPermission('masterdata.export')

  return (
    <div>
      <Space>
        {canCreate && <Button onClick={handleAdd}>Thêm mới</Button>}
        {canImport && <ImportButton ... />}
        {canExport && <ExportButton ... />}
      </Space>
      
      <CustomTable
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />
    </div>
  )
}
```

**Key Points:**
- Check permissions cho từng action (create, edit, delete, import, export)
- Hide buttons/actions nếu không có permission
- Pass `undefined` cho handlers nếu không có permission

---

## PHẦN 7: ERROR HANDLING

### 7.1. 403 Forbidden Handling

**Location:** `frontend/src/utils/errorHandler.ts`

**Pattern:**

```typescript
export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện chức năng này'
    }
    // ... other status codes
  }
  return defaultMessage
}
```

**Key Points:**
- 403 errors hiển thị message rõ ràng về quyền truy cập
- Không hiển thị generic "Tạo mới thất bại" cho 403

---

## PHẦN 8: COMMON PITFALLS VÀ BEST PRACTICES

### 8.1. Multiple API Calls

**Problem:** Khi update permissions, frontend gọi `/api/Permissions/me` nhiều lần.

**Solution:**
- Debounce trong `usePermissionHub` (500ms)
- `isProcessingRef` để tránh xử lý đồng thời
- Backend chỉ gửi SignalR message đến role group (không gửi đến từng user group)

### 8.2. SignalR Connection Issues

**Problem:** SignalR không connect được, lỗi 401 hoặc connection refused.

**Solution:**
- Đảm bảo Vite proxy có `/hubs` với `ws: true`
- `getHubUrl()` trả về relative path `/hubs/permission` khi dùng proxy
- Backend `OnMessageReceived` xử lý token từ query string
- SignalR hubs được map SAU `UseAuthentication()` và `UseAuthorization()`

### 8.3. Permission Updates Not Reflecting

**Problem:** Sau khi admin update permissions, employee UI không cập nhật.

**Solution:**
- Đảm bảo `usePermissionHub` được gọi ở root level (`App.tsx`)
- Check `data.role === user.role` trước khi update
- Fetch fresh permissions từ API thay vì dùng data từ SignalR message
- Invalidate queries để refresh UI

### 8.4. Sidebar Not Updating

**Problem:** Sidebar menu không cập nhật khi permissions thay đổi.

**Solution:**
- `useMemo` dependencies phải include `permissions` array
- Dùng `useHasPermission` hooks thay vì check trực tiếp `permissions.includes()`
- Invalidate queries sau khi update permissions

### 8.5. Account Locked Not Force Logout

**Problem:** Khi Admin khóa tài khoản, user vẫn có thể sử dụng hệ thống.

**Solution:**
- Đảm bảo `useUserHub` được gọi ở root level (`App.tsx`)
- Check `data.userId === user.id` trước khi xử lý `AccountLocked` event
- Dispatch `logout()` và `queryClient.clear()` ngay lập tức
- Redirect về `/login` với `replace: true` để không thể quay lại

---

## PHẦN 9: TESTING CHECKLIST

- [ ] Permissions được load vào Redux store khi login
- [ ] `useHasPermission` hook hoạt động đúng
- [ ] Admin có tất cả permissions (return true)
- [ ] Employee chỉ có permissions được assign
- [ ] Sidebar menu filter đúng dựa trên permissions
- [ ] Buttons/actions ẩn khi không có permission
- [ ] PermissionHub SignalR connection thành công khi login
- [ ] Permissions được cập nhật real-time khi admin thay đổi
- [ ] RolePermissionsPage hiển thị đúng permissions
- [ ] "Khôi phục mặc định" chỉ reset local state
- [ ] "Lưu phân quyền" gọi API và gửi SignalR message
- [ ] Dấu (*) hiển thị khi có unsaved changes
- [ ] Ctrl+S lưu permissions thành công
- [ ] 403 errors hiển thị message đúng
- [ ] UserHub SignalR connection thành công khi login
- [ ] Khi Admin khóa tài khoản, user nhận `AccountLocked` event
- [ ] User bị force logout ngay lập tức khi nhận `AccountLocked`
- [ ] User được redirect về login page khi bị khóa
- [ ] Admin UI refresh khi lock/unlock user (qua `UserUpdated` event)
- [ ] User nhận notification khi account được unlock

---

## PHẦN 10: VERSION HISTORY

- **v1.0 (2025-12-05)**: Initial version với full implementation pattern
- **v1.1 (2025-12-05)**: Added UserHub service, useUserHub hook, và SignalR integration cho lock/unlock tài khoản

