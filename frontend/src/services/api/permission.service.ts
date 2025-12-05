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

  getRolePermissions: async (role: string): Promise<RolePermissionDto> => {
    const response = await api.get<{ success: boolean; data: RolePermissionDto }>(`/Permissions/role/${role}`)
    return response.data.data
  },

  updateRolePermissions: async (role: string, permissionKeys: string[]): Promise<void> => {
    await api.put(`/Permissions/role/${role}`, { role, permissionKeys })
  },

  getMyPermissions: async (): Promise<string[]> => {
    const response = await api.get<{ success: boolean; data: string[] }>('/Permissions/me')
    return response.data.data
  },

  seedPermissions: async (): Promise<void> => {
    await api.post('/Permissions/seed')
  }
}

