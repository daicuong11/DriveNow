import { useState, useEffect } from 'react'
import { Card, Checkbox, Button, Space, Divider, Typography, Row, Col, message } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { permissionService, type PermissionGroup } from '../../services/api/permission.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const { Title, Text } = Typography

interface Permission {
  key: string
  name: string
  description: string
}

interface PermissionGroup {
  title: string
  permissions: Permission[]
}

// Define all permissions in the system
const permissionGroups: PermissionGroup[] = [
  {
    title: 'Quản lý Người dùng',
    permissions: [
      { key: 'users.view', name: 'Xem danh sách người dùng', description: 'Xem danh sách tất cả người dùng' },
      { key: 'users.create', name: 'Tạo người dùng', description: 'Tạo tài khoản người dùng mới' },
      { key: 'users.edit', name: 'Sửa người dùng', description: 'Cập nhật thông tin người dùng' },
      { key: 'users.delete', name: 'Xóa người dùng', description: 'Xóa tài khoản người dùng' },
      { key: 'users.lock', name: 'Khóa/Mở khóa', description: 'Khóa hoặc mở khóa tài khoản' },
      { key: 'users.resetPassword', name: 'Đặt lại mật khẩu', description: 'Đặt lại mật khẩu cho người dùng' }
    ]
  },
  {
    title: 'Cấu hình Hệ thống',
    permissions: [
      { key: 'system.view', name: 'Xem cấu hình', description: 'Xem cấu hình hệ thống' },
      { key: 'system.edit', name: 'Sửa cấu hình', description: 'Cập nhật cấu hình hệ thống' }
    ]
  },
  {
    title: 'Danh mục Dữ liệu (Master Data)',
    permissions: [
      { key: 'masterdata.view', name: 'Xem danh mục', description: 'Xem tất cả danh mục dữ liệu' },
      { key: 'masterdata.create', name: 'Tạo danh mục', description: 'Tạo mới danh mục dữ liệu' },
      { key: 'masterdata.edit', name: 'Sửa danh mục', description: 'Cập nhật danh mục dữ liệu' },
      { key: 'masterdata.delete', name: 'Xóa danh mục', description: 'Xóa danh mục dữ liệu' },
      { key: 'masterdata.import', name: 'Import Excel', description: 'Import dữ liệu từ Excel' },
      { key: 'masterdata.export', name: 'Export Excel', description: 'Export dữ liệu ra Excel' }
    ]
  },
  {
    title: 'Quản lý Xe',
    permissions: [
      { key: 'vehicles.view', name: 'Xem danh sách xe', description: 'Xem danh sách tất cả xe' },
      { key: 'vehicles.create', name: 'Tạo xe mới', description: 'Thêm xe mới vào hệ thống' },
      { key: 'vehicles.edit', name: 'Sửa thông tin xe', description: 'Cập nhật thông tin xe' },
      { key: 'vehicles.delete', name: 'Xóa xe', description: 'Xóa xe khỏi hệ thống' },
      { key: 'vehicles.inout', name: 'Xuất/Nhập bãi', description: 'Quản lý xuất nhập bãi xe' },
      { key: 'vehicles.maintenance', name: 'Bảo dưỡng/Sửa chữa', description: 'Quản lý bảo dưỡng và sửa chữa xe' }
    ]
  },
  {
    title: 'Quản lý Cho thuê',
    permissions: [
      { key: 'rentals.view', name: 'Xem đơn thuê', description: 'Xem danh sách đơn thuê' },
      { key: 'rentals.create', name: 'Tạo đơn thuê', description: 'Tạo đơn thuê mới' },
      { key: 'rentals.edit', name: 'Sửa đơn thuê', description: 'Cập nhật đơn thuê' },
      { key: 'rentals.confirm', name: 'Xác nhận đơn', description: 'Xác nhận đơn thuê' },
      { key: 'rentals.start', name: 'Bắt đầu thuê', description: 'Bắt đầu quá trình cho thuê' },
      { key: 'rentals.complete', name: 'Hoàn thành', description: 'Hoàn thành đơn thuê' },
      { key: 'rentals.cancel', name: 'Hủy đơn', description: 'Hủy đơn thuê' },
      { key: 'rentals.promotions', name: 'Quản lý khuyến mãi', description: 'Tạo và quản lý chương trình khuyến mãi' }
    ]
  },
  {
    title: 'Hóa đơn và Thanh toán',
    permissions: [
      { key: 'invoices.view', name: 'Xem hóa đơn', description: 'Xem danh sách hóa đơn' },
      { key: 'invoices.create', name: 'Tạo hóa đơn', description: 'Tạo hóa đơn từ đơn thuê' },
      { key: 'invoices.edit', name: 'Sửa hóa đơn', description: 'Cập nhật hóa đơn' },
      { key: 'invoices.delete', name: 'Xóa hóa đơn', description: 'Xóa hóa đơn' },
      { key: 'payments.create', name: 'Tạo thanh toán', description: 'Tạo phiếu thanh toán' },
      { key: 'payments.view', name: 'Xem thanh toán', description: 'Xem lịch sử thanh toán' }
    ]
  },
  {
    title: 'Dashboard và Báo cáo',
    permissions: [
      { key: 'dashboard.view', name: 'Xem Dashboard', description: 'Xem dashboard tổng quan' },
      { key: 'reports.view', name: 'Xem báo cáo', description: 'Xem các báo cáo' },
      { key: 'reports.export', name: 'Export báo cáo', description: 'Xuất báo cáo ra file' }
    ]
  }
]

// Legacy default permissions (fallback)
const legacyDefaultRolePermissions: Record<string, string[]> = {
  Admin: [
    // All permissions
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.lock',
    'users.resetPassword',
    'system.view',
    'system.edit',
    'masterdata.view',
    'masterdata.create',
    'masterdata.edit',
    'masterdata.delete',
    'masterdata.import',
    'masterdata.export',
    'vehicles.view',
    'vehicles.create',
    'vehicles.edit',
    'vehicles.delete',
    'vehicles.inout',
    'vehicles.maintenance',
    'rentals.view',
    'rentals.create',
    'rentals.edit',
    'rentals.confirm',
    'rentals.start',
    'rentals.complete',
    'rentals.cancel',
    'rentals.promotions',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'payments.create',
    'payments.view',
    'dashboard.view',
    'reports.view',
    'reports.export'
  ],
  Employee: [
    // Limited permissions
    'masterdata.view',
    'vehicles.view',
    'vehicles.inout',
    'rentals.view',
    'rentals.create',
    'rentals.confirm',
    'rentals.start',
    'rentals.complete',
    'invoices.view',
    'payments.create',
    'payments.view',
    'dashboard.view',
    'reports.view'
  ]
}

const RolePermissionsPage = () => {
  const navigate = useNavigate()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const [selectedRole, setSelectedRole] = useState<string>('Employee')
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    Admin: [],
    Employee: []
  })

  const queryClient = useQueryClient()

  // Load role permissions from backend
  const { data: adminPermissions, isLoading: loadingAdmin } = useQuery({
    queryKey: ['rolePermissions', 'Admin'],
    queryFn: () => permissionService.getRolePermissions('Admin'),
    enabled: true
  })

  const { data: employeePermissions, isLoading: loadingEmployee } = useQuery({
    queryKey: ['rolePermissions', 'Employee'],
    queryFn: () => permissionService.getRolePermissions('Employee'),
    enabled: true
  })

  // Update local state when data loads
  useEffect(() => {
    if (adminPermissions) {
      setPermissions(prev => ({
        ...prev,
        Admin: adminPermissions.permissionKeys
      }))
    }
  }, [adminPermissions])

  useEffect(() => {
    if (employeePermissions) {
      setPermissions(prev => ({
        ...prev,
        Employee: employeePermissions.permissionKeys
      }))
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
      // Reload permissions after save
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Lưu phân quyền thất bại. Vui lòng thử lại!'))
    }
  })

  // Only Admin can access
  if (userRole !== 'Admin') {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <h2>Bạn không có quyền truy cập trang này</h2>
        <p>Chỉ quản trị viên mới có thể quản lý phân quyền.</p>
      </div>
    )
  }

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev }
      const rolePerms = [...(newPermissions[selectedRole] || [])]

      if (checked) {
        if (!rolePerms.includes(permissionKey)) {
          rolePerms.push(permissionKey)
        }
      } else {
        const index = rolePerms.indexOf(permissionKey)
        if (index > -1) {
          rolePerms.splice(index, 1)
        }
      }

      newPermissions[selectedRole] = rolePerms
      return newPermissions
    })
  }

  const handleSelectAll = (group: PermissionGroup, checked: boolean) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev }
      const rolePerms = [...(newPermissions[selectedRole] || [])]

      if (checked) {
        // Add all permissions in group
        group.permissions.forEach((perm) => {
          if (!rolePerms.includes(perm.key)) {
            rolePerms.push(perm.key)
          }
        })
      } else {
        // Remove all permissions in group
        group.permissions.forEach((perm) => {
          const index = rolePerms.indexOf(perm.key)
          if (index > -1) {
            rolePerms.splice(index, 1)
          }
        })
      }

      newPermissions[selectedRole] = rolePerms
      return newPermissions
    })
  }

  const handleSave = async () => {
    const permissionKeys = permissions[selectedRole] || []
    saveMutation.mutate({
      role: selectedRole,
      permissionKeys
    })
  }

  const handleReset = () => {
    // Reload from server
    queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole] })
    showSuccess('Đã khôi phục phân quyền từ server!')
  }

  const currentPermissions = permissions[selectedRole] || []

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Phân quyền theo Vai trò
          </Title>
        </div>
        <Space>
          <Button onClick={handleReset}>Khôi phục mặc định</Button>
          <Button type='primary' icon={<SaveOutlined />} onClick={handleSave} loading={saveMutation.isPending}>
            Lưu phân quyền
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Chọn vai trò:</Text>
          <Button
            type={selectedRole === 'Admin' ? 'primary' : 'default'}
            onClick={() => setSelectedRole('Admin')}
          >
            Quản trị viên (Admin)
          </Button>
          <Button
            type={selectedRole === 'Employee' ? 'primary' : 'default'}
            onClick={() => setSelectedRole('Employee')}
          >
            Nhân viên (Employee)
          </Button>
        </Space>
      </Card>

      {permissionGroups && permissionGroups.length > 0 ? (
        permissionGroups.map((group, groupIndex) => {
          const allChecked = group.permissions.every((perm) => currentPermissions.includes(perm.key))
          const someChecked = group.permissions.some((perm) => currentPermissions.includes(perm.key))

          return (
            <Card
              key={groupIndex}
              title={
                <div className='flex items-center justify-between'>
                  <span>{group.title}</span>
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
        })
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 20 }}>
            {(loadingAdmin || loadingEmployee) ? 'Đang tải...' : 'Chưa có dữ liệu phân quyền.'}
          </div>
        </Card>
      )}

    </div>
  )
}

export default RolePermissionsPage

