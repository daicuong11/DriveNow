import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Checkbox, Typography } from 'antd'
import { UserOutlined, LockOutlined, CarOutlined, SafetyOutlined } from '@ant-design/icons'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials } from '../../store/slices/authSlice'
import { authService } from '../../services/api/auth.service'
import { LoginRequest } from '../../types/auth.types'
import { showSuccess, showError, showWarning } from '../../utils/notifications'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [form] = Form.useForm()

  const onFinish = async (values: LoginRequest) => {
    // Prevent default form submission
    setLoading(true)

    try {
      const response = await authService.login({
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
        rememberMe: values.rememberMe
      })

      // Update Redux store (this will also save to localStorage)
      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          permissions: response.permissions || []
        })
      )

      showSuccess('Đăng nhập thành công!')

      // Small delay for better UX
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err: unknown) {
      // Handle different error types - không reload trang
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.'
      let useWarning = false

      // Type guard for axios error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number; data?: { message?: string } } }
        // Server responded with error
        const status = axiosError.response?.status
        const data = axiosError.response?.data

        if (status === 401) {
          errorMessage = data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.'
          useWarning = false
        } else if (status === 403) {
          errorMessage = data?.message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
          useWarning = true
        } else if (status === 429) {
          errorMessage = 'Quá nhiều lần thử đăng nhập. Vui lòng đợi một lát và thử lại.'
          useWarning = true
        } else if (status && status >= 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
          useWarning = false
        } else {
          errorMessage = data?.message || errorMessage
        }
      } else if (err && typeof err === 'object' && 'request' in err) {
        // Request was made but no response received
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.'
        useWarning = true
      } else if (err instanceof Error) {
        // Something else happened
        errorMessage = err.message || errorMessage
      }

      // Show notification based on error type
      if (useWarning) {
        showWarning(errorMessage)
      } else {
        showError(errorMessage)
      }

      // Clear password field on error
      form.setFieldsValue({ password: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center p-4'>
      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl'></div>
      </div>

      <Card
        className='w-full max-w-md shadow-2xl border-0'
        style={{
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Logo and Title */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform'>
            <CarOutlined className='text-4xl text-white' />
          </div>
          <Title level={2} className='!mb-2 !text-gray-800'>
            DriveNow
          </Title>
          <Text type='secondary' className='text-base'>
            Hệ thống quản lý cho thuê xe hơi tự lái
          </Text>
        </div>

        {/* Login Form */}
        <Form
          form={form}
          name='login'
          onFinish={onFinish}
          onFinishFailed={(errorInfo) => {
            // Prevent page reload on validation error
            console.log('Validation failed:', errorInfo)
          }}
          layout='vertical'
          autoComplete='off'
          size='large'
        >
          <Form.Item
            name='usernameOrEmail'
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập tên đăng nhập hoặc email'
              },
              {
                type: 'email',
                message: 'Email không hợp lệ',
                validateTrigger: 'onBlur'
              }
            ]}
            validateTrigger='onBlur'
          >
            <Input
              prefix={<UserOutlined className='text-gray-400' style={{ fontSize: '16px' }} />}
              placeholder='Tên đăng nhập hoặc Email'
              className='h-12 rounded-lg'
              style={{ fontSize: '15px' }}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>

          <Form.Item
            name='password'
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
              }
            ]}
            validateTrigger='onBlur'
          >
            <Input.Password
              prefix={<LockOutlined className='text-gray-400' style={{ fontSize: '16px' }} />}
              placeholder='Mật khẩu'
              className='h-12 rounded-lg'
              style={{ fontSize: '15px' }}
              onPressEnter={() => form.submit()}
              iconRender={(visible) =>
                visible ? <SafetyOutlined className='text-gray-400' /> : <SafetyOutlined className='text-gray-400' />
              }
            />
          </Form.Item>

          <Form.Item className='!mb-4'>
            <div className='flex justify-between items-center'>
              <Form.Item name='rememberMe' valuePropName='checked' noStyle>
                <Checkbox className='text-gray-600'>
                  <span className='text-sm'>Ghi nhớ đăng nhập</span>
                </Checkbox>
              </Form.Item>
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/forgot-password')
                }}
                className='text-sm text-blue-600 hover:text-blue-700 transition-colors'
              >
                Quên mật khẩu?
              </a>
            </div>
          </Form.Item>

          <Form.Item className='!mb-0'>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              block
              className='h-12 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]'
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className='mt-6 text-center'>
          <Text type='secondary' className='text-xs'>
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <a href='#' onClick={(e) => e.preventDefault()} className='text-blue-600 hover:text-blue-700'>
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href='#' onClick={(e) => e.preventDefault()} className='text-blue-600 hover:text-blue-700'>
              Chính sách bảo mật
            </a>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Login
