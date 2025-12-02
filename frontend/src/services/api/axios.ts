import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Use Vite proxy in development
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: false
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't handle 401 for login/refresh endpoints - let the component handle it
    const isAuthEndpoint = originalRequest?.url?.includes('/Auth/login') || originalRequest?.url?.includes('/Auth/refresh')
    
    // Don't redirect if already on login page
    const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/'

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          // No refresh token, redirect to login only if not already on login page
          localStorage.removeItem('accessToken')
          if (!isOnLoginPage) {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }

        const baseURL = import.meta.env.VITE_API_URL || '/api'
        const response = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
          `${baseURL}/Auth/refresh`,
          {
            refreshToken
          }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update Redux store if available
        if (window.store) {
          const { setCredentials } = await import('../../store/slices/authSlice')
          // Try to decode user from token
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            const user = {
              id: parseInt(
                payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub || '0'
              ),
              username:
                payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.unique_name || '',
              email:
                payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email || '',
              fullName: payload.FullName || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
              role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || ''
            }
            window.store.dispatch(setCredentials({ user, accessToken, refreshToken: newRefreshToken }))
          } catch (e) {
            // If decode fails, just update token
            console.warn('Failed to decode token after refresh', e)
          }
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // Dispatch logout if store is available
        if (typeof window !== 'undefined' && window.store) {
          const { logout } = await import('../../store/slices/authSlice')
          window.store.dispatch(logout())
        }
        // Only redirect if not already on login page
        if (!isOnLoginPage) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
