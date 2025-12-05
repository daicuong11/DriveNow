import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Form, Input, Tabs, Space, Card, Row, Col, App, Select, Switch } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import RefreshButton from '../../components/common/RefreshButton'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import MasterDataSelect from '../../components/common/MasterDataSelect'
import type { TabsProps } from 'antd'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'

const { Password } = Input

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

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('general')
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const numericId = id ? Number(id) : 0
  const isNew = numericId === 0
  const userId = isNew ? null : numericId
  const queryClient = useQueryClient()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)

  // Get copy data from location state (if exists)
  const copyData = (location.state as { copyData?: User })?.copyData

  // Fetch user data
  const {
    data: user,
    isLoading,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (isNew || !userId) return null
      const response = await api.get<{ success: boolean; data: User }>(`/Users/${userId}`)
      return response.data.data
    },
    enabled: !isNew && !!userId && userId >= 1 && userRole === 'Admin'
  })

  // Set form values when user data is loaded or copied
  useEffect(() => {
    if (user && !isNew && userId && userId >= 1) {
      const formValues = {
        ...user,
        password: undefined, // Don't load password
        confirmPassword: undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
    } else if (isNew) {
      if (copyData) {
        // Remove username, id, password from copy data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { username: _username, id: _id, ...restData } = copyData
        const formValues = {
          ...restData,
          username: '', // Clear username for new entry
          password: '', // Clear password
          confirmPassword: '',
          isActive: true, // Reset status
          isLocked: false,
          failedLoginAttempts: 0
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        navigate(location.pathname, { replace: true, state: {} }) // Clear copyData from state
      } else {
        const formValues = {
          role: 'Employee',
          isActive: true
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
      }
    }
  }, [user, isNew, userId, form, copyData, location.pathname, navigate])

  // Track form changes
  const handleFormValuesChange = useCallback(
    (_changedValues: any, allValues: any) => {
      if (!initialValues || isNew) {
        return
      }

      const currentValues = allValues || form.getFieldsValue()
      const currentNormalized = JSON.stringify(currentValues)
      const initialNormalized = JSON.stringify(initialValues)
      const changed = currentNormalized !== initialNormalized

      setHasChanges(changed)
    },
    [form, initialValues, isNew]
  )

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/Users', {
        ...values,
        password: values.password
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo người dùng thành công!')
      setHasChanges(false)
      navigate(`/users/${data.data.id}`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Tạo người dùng thất bại. Vui lòng thử lại!'))
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!userId || userId < 1) throw new Error('Invalid user ID')
      const response = await api.put(`/Users/${userId}`, {
        ...values
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Cập nhật người dùng thành công!')
      setHasChanges(false)
      const updatedUser = data.data
      setInitialValues({
        ...updatedUser,
        password: undefined,
        confirmPassword: undefined
      })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Cập nhật thất bại. Vui lòng thử lại!'))
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId || userId < 1) throw new Error('Invalid user ID')
      await api.delete(`/Users/${userId}`)
    },
    onSuccess: () => {
      showSuccess('Xóa người dùng thành công!')
      setHasChanges(false)
      navigate('/users')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Xóa thất bại. Vui lòng thử lại!'))
    }
  })

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      if (isNew) {
        createMutation.mutate(values)
      } else {
        updateMutation.mutate(values)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }, [form, isNew, createMutation, updateMutation])

  const handleCopy = async () => {
    if (!userId || userId < 1 || !user) return

    // Get current user data, remove username and id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username: _username, id: _id, ...copyData } = user

    // Navigate to new user creation page with copied data
    navigate('/users/0', {
      state: {
        copyData: {
          ...copyData,
          username: '',
          password: '',
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        }
      }
    })
  }

  const handleDelete = () => {
    modal.confirm({
      title: 'Xác nhận',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      onOk: () => {
        deleteMutation.mutate()
      }
    })
  }

  const handleBack = () => {
    if (!isNew && userId && hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: () => {
          setHasChanges(false)
          navigate('/users')
        }
      })
      return
    }

    navigate('/users')
  }

  const handleRefresh = async () => {
    if (isNew || !userId) return

    if (hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi chưa lưu, bạn có muốn làm mới?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: async () => {
          setIsRefreshing(true)
          try {
            const result = await refetchUser()

            if (result.data) {
              const updatedUser = result.data
              const formValues = {
                ...updatedUser,
                password: undefined,
                confirmPassword: undefined
              }
              form.setFieldsValue(formValues)
              setInitialValues(formValues)
              setHasChanges(false)
            }

            queryClient.invalidateQueries({ queryKey: ['users'] })
          } finally {
            setIsRefreshing(false)
          }
        }
      })
      return
    }

    setIsRefreshing(true)
    try {
      const result = await refetchUser()

      if (result.data) {
        const updatedUser = result.data
        const formValues = {
          ...updatedUser,
          password: undefined,
          confirmPassword: undefined
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
      }

      queryClient.invalidateQueries({ queryKey: ['users'] })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSubmit])

  // Browser refresh/close warning
  useEffect(() => {
    if (!hasChanges || isNew) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges, isNew])

  // Calculate loading state
  const isAnyLoading = isLoading || isRefreshing || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const tabItems: TabsProps['items'] = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <Card>
          <Form form={form} layout='vertical' disabled={isLoading} onValuesChange={handleFormValuesChange}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name='username'
                  label='Tên đăng nhập'
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                    { max: 100, message: 'Tên đăng nhập không được quá 100 ký tự' }
                  ]}
                >
                  <Input disabled={!isNew} placeholder='Nhập tên đăng nhập' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='email'
                  label='Email'
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder='Nhập email' />
                </Form.Item>
              </Col>
              {isNew && (
                <>
                  <Col span={12}>
                    <Form.Item
                      name='password'
                      label='Mật khẩu'
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu' },
                        { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                        {
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Mật khẩu phải có chữ hoa, chữ thường và số'
                        }
                      ]}
                    >
                      <Password placeholder='Nhập mật khẩu' />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name='confirmPassword'
                      label='Xác nhận mật khẩu'
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                          }
                        })
                      ]}
                    >
                      <Password placeholder='Nhập lại mật khẩu' />
                    </Form.Item>
                  </Col>
                </>
              )}
              <Col span={12}>
                <Form.Item name='fullName' label='Họ tên' rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                  <Input placeholder='Nhập họ tên' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='phone'
                  label='Số điện thoại'
                  rules={[
                    {
                      pattern: /^[0-9]{10,11}$/,
                      message: 'Số điện thoại không hợp lệ (10-11 chữ số)'
                    }
                  ]}
                >
                  <Input placeholder='Nhập số điện thoại' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='role' label='Vai trò' rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
                  <Select placeholder='Chọn vai trò'>
                    <Select.Option value='Admin'>Quản trị viên</Select.Option>
                    <Select.Option value='Employee'>Nhân viên</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='employeeId' label='Nhân viên'>
                  <MasterDataSelect
                    entityType='employees'
                    placeholder='Chọn nhân viên (tùy chọn)'
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='isActive' label='Trạng thái' valuePropName='checked'>
                  <Switch checkedChildren='Hoạt động' unCheckedChildren='Không hoạt động' />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
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
      <LoadingOverlay loading={isAnyLoading} tip='Đang xử lý dữ liệu...' />

      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
          <h1 className='m-0 text-2xl font-bold'>
            {isNew ? 'Thêm mới Người dùng' : `${user?.username || ''}${hasChanges ? ' (*)' : ''}`}
          </h1>
        </div>
        <Space>
          {!isNew && (
            <>
              <RefreshButton onRefresh={handleRefresh} loading={isRefreshing} />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                Tạo bản sao
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMutation.isPending}>
                Xóa
              </Button>
            </>
          )}
          <Button
            type='primary'
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isNew ? 'Tạo mới' : 'Lưu thay đổi'}
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type='card' size='large' items={tabItems} />
    </div>
  )
}

export default UserDetailPage

