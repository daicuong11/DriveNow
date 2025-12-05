import api from './axios'
import { LoginRequest, LoginResponse, User } from '../../types/auth.types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/Auth/login', data)
    return response.data.data
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/Auth/refresh', { refreshToken })
    return response.data.data
  },

  forgotPassword: async (email: string): Promise<{ data?: { token: string } }> => {
    const response = await api.post<{ success: boolean; data?: { token: string }; message: string }>('/Auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/Auth/reset-password', { token, newPassword })
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/Auth/change-password', {
      currentPassword,
      newPassword
    })
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/Auth/logout', { refreshToken })
  }
}
