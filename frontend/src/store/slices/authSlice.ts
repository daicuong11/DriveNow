import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/api/auth.service'

interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true // Start with loading to check persisted auth
}

// Thunk to restore auth from persisted tokens
export const restoreAuth = createAsyncThunk('auth/restoreAuth', async (_, { rejectWithValue }) => {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (!accessToken || !refreshToken) {
      return rejectWithValue('No tokens found')
    }

    // Try to get current user info from token (decode JWT)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const user: User = {
        id: parseInt(
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub || '0'
        ),
        username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.unique_name || '',
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '',
        fullName: payload.FullName || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
        role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || ''
      }

      // Check if token is expired
      const exp = payload.exp * 1000 // Convert to milliseconds
      if (Date.now() >= exp) {
        // Token expired, try to refresh
        try {
          const response = await authService.refreshToken(refreshToken)
          localStorage.setItem('accessToken', response.accessToken)
          localStorage.setItem('refreshToken', response.refreshToken)
          return {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          return rejectWithValue('Token expired and refresh failed')
        }
      }

      return {
        user,
        accessToken,
        refreshToken
      }
    } catch (error) {
      // Failed to decode token, try to refresh
      try {
        const response = await authService.refreshToken(refreshToken)
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        return {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return rejectWithValue('Invalid token')
      }
    }
  } catch (error: any) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return rejectWithValue(error.message || 'Failed to restore auth')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      state.isLoading = false
      // Also save to localStorage
      localStorage.setItem('accessToken', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isLoading = false
      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.isLoading = false
      })
  }
})

export const { setCredentials, logout, setLoading } = authSlice.actions
export default authSlice.reducer
