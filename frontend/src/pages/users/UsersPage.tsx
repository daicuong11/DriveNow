import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Popconfirm, Badge, Tag } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined, EyeOutlined, LockOutlined, UnlockOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import dayjs from 'dayjs'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'

interface User {
  id: number
  username: string
  email: string
  fullName: string
  phone?: string
  role: string
  isActive: boolean
  isLocked: boolean
  lockedUntil?: string
  lastLoginDate?: string
  failedLoginAttempts: number
  employeeId?: number
  employeeName?: string
  createdDate: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const UsersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchTerm = useDebounce(searchInput, 500)
  const searchInputRef = useRef<string>('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | number | boolean | undefined>>({})
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDescending, setSortDescending] = useState(false)
  const [filterResetTrigger, setFilterResetTrigger] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<User[]>([])

  useEffect(() => {
    if (searchInputRef.current !== '') {
      setSearchTerm(searchInputRef.current)
      searchInputRef.current = ''
    } else {
      setSearchTerm(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  const filterConfigs: FilterConfig[] = [
    {
      key: 'filterRole',
      label: 'Vai trò',
      type: 'select',
      options: [
        { label: 'Quản trị viên', value: 'Admin' },
        { label: 'Nhân viên', value: 'Employee' }
      ],
      placeholder: 'Chọn vai trò...'
    },
    {
      key: 'filterIsActive',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Hoạt động', value: 'true' },
        { label: 'Không hoạt động', value: 'false' }
      ],
      placeholder: 'Chọn trạng thái...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: [
      'users',
      pagination.current,
      pagination.pageSize,
      searchTerm,
      advancedFilters,
      sortBy,
      sortDescending
    ],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      if (advancedFilters.filterRole) params.filterRole = advancedFilters.filterRole as string
      if (advancedFilters.filterIsActive !== undefined) {
        params.filterIsActive = advancedFilters.filterIsActive === 'true' || advancedFilters.filterIsActive === true
      }

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<User> }>('/Users', {
        params
      })
      return response.data.data
    },
    enabled: userRole === 'Admin' // Only Admin can access
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/Users/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Xóa thất bại. Vui lòng thử lại!'))
    }
  })

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/Users/${id}/lock`)
    },
    onSuccess: () => {
      showSuccess('Khóa tài khoản thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Khóa tài khoản thất bại. Vui lòng thử lại!'))
    }
  })

  // Unlock mutation
  const unlockMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/Users/${id}/unlock`)
    },
    onSuccess: () => {
      showSuccess('Mở khóa tài khoản thành công!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Mở khóa tài khoản thất bại. Vui lòng thử lại!'))
    }
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      await api.post(`/Users/${id}/reset-password`, { newPassword })
    },
    onSuccess: () => {
      showSuccess('Đặt lại mật khẩu thành công!')
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!'))
    }
  })

  const handleViewDetail = (id: number) => {
    navigate(`/users/${id}`)
  }

  const handleCopy = async (id: number) => {
    try {
      const response = await api.get<{ success: boolean; data: User }>(`/Users/${id}`)
      const userData = response.data.data

      // Remove id, username, password, and keep other fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, username: _username, ...copyData } = userData

      // Navigate to new user creation page with copied data
      navigate('/users/0', {
        state: {
          copyData: {
            ...copyData,
            username: '', // Clear username for new entry
            password: '', // Clear password
            isActive: true, // Reset status
            isLocked: false,
            failedLoginAttempts: 0
          }
        }
      })
    } catch (error: any) {
      showError(getErrorMessage(error, 'Không thể tải dữ liệu để copy. Vui lòng thử lại!'))
    }
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleLock = (id: number) => {
    lockMutation.mutate(id)
  }

  const handleUnlock = (id: number) => {
    unlockMutation.mutate(id)
  }

  const handleResetPassword = (id: number) => {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 8 ký tự):')
    if (newPassword && newPassword.length >= 8) {
      resetPasswordMutation.mutate({ id, newPassword })
    } else if (newPassword) {
      showWarning('Mật khẩu phải có ít nhất 8 ký tự!')
    }
  }

  const handleRefresh = () => {
    setSearchTerm('')
    setSearchInput('')
    searchInputRef.current = ''
    setAdvancedFilters({})
    setFilterResetTrigger((prev) => prev + 1)
    setSortBy(undefined)
    setSortDescending(false)
    setPagination({ current: 1, pageSize: pagination.pageSize })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleFilterChange = (filters: Record<string, string | number | undefined>) => {
    setAdvancedFilters(filters)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterClear = () => {
    setAdvancedFilters({})
    setFilterResetTrigger((prev) => prev + 1)
    setPagination({ ...pagination, current: 1 })
  }

  const handleTableSort = (sorter: { field?: string; order?: 'ascend' | 'descend' }) => {
    if (!sorter.field || !sorter.order) {
      setSortBy(undefined)
      setSortDescending(false)
    } else {
      setSortBy(sorter.field)
      setSortDescending(sorter.order === 'descend')
    }
    setPagination({ ...pagination, current: 1 })
  }

  const formatRole = (role: string) => {
    const roleMap: Record<string, { text: string; color: string }> = {
      Admin: { text: 'Quản trị viên', color: 'red' },
      Employee: { text: 'Nhân viên', color: 'blue' }
    }
    const roleInfo = roleMap[role] || { text: role, color: 'default' }
    return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
  }

  const formatStatus = (isActive: boolean, isLocked: boolean) => {
    if (isLocked) {
      return <Badge status='error' text='Đã khóa' />
    }
    return isActive ? <Badge status='success' text='Hoạt động' /> : <Badge status='default' text='Không hoạt động' />
  }

  const columns: (ColumnsType<User>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      searchable: true,
      sorter: true
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      searchable: true,
      sorter: true
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      searchable: true,
      sorter: true
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filterable: true,
      render: (role: string) => formatRole(role)
    },
    {
      title: 'Trạng thái',
      key: 'status',
      filterable: true,
      render: (_, record) => formatStatus(record.isActive, record.isLocked)
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'lastLoginDate',
      key: 'lastLoginDate',
      sorter: true,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} title='Xem chi tiết' />
          <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} title='Tạo bản sao' />
          {record.isLocked ? (
            <Button
              type='link'
              icon={<UnlockOutlined />}
              onClick={() => handleUnlock(record.id)}
              title='Mở khóa'
            />
          ) : (
            <Button type='link' icon={<LockOutlined />} onClick={() => handleLock(record.id)} title='Khóa' />
          )}
          <Button
            type='link'
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record.id)}
            title='Đặt lại mật khẩu'
          />
          <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
            <Button type='link' danger icon={<DeleteOutlined />} title='Xóa' />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // Only Admin can access
  if (userRole !== 'Admin') {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <h2>Bạn không có quyền truy cập trang này</h2>
        <p>Chỉ quản trị viên mới có thể quản lý người dùng.</p>
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Người dùng</h1>
        <Space>
          <Input
            placeholder='Tìm kiếm tên đăng nhập, email, họ tên...'
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPagination({ ...pagination, current: 1 })
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value
              searchInputRef.current = value
              setSearchTerm(value)
              setPagination({ ...pagination, current: 1 })
            }}
            allowClear
            style={{ width: 300 }}
          />
          <RefreshButton onRefresh={handleRefresh} loading={isLoading} />
          <Button icon={<SafetyOutlined />} onClick={() => navigate('/users/permissions')}>
            Phân quyền
          </Button>
          <Button type='primary' onClick={() => navigate('/users/0')}>
            Thêm mới
          </Button>
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<User>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        rowKey='id'
        onSortChange={handleTableSort}
        enableRowSelection={false}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data?.totalCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize })
          }
        }}
      />
    </div>
  )
}

export default UsersPage

