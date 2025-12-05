import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography } from 'antd'
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { authService } from '../../services/api/auth.service'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'

const { Title, Text } = Typography
const { Password } = Input

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      showError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.')
      navigate('/forgot-password')
    }
  }, [token, navigate])

  const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!token) {
      showError('Token không hợp lệ')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, values.newPassword)
      showSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.')
      navigate('/login')
    } catch (error: any) {
      showError(getErrorMessage(error, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card
        style={{
          width: 450,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          borderRadius: 12
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Đặt lại mật khẩu
          </Title>
          <Text type='secondary'>Nhập mật khẩu mới của bạn</Text>
        </div>

        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item
            name='newPassword'
            label='Mật khẩu mới'
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Mật khẩu phải có chữ hoa, chữ thường và số'
              }
            ]}
          >
            <Password prefix={<LockOutlined />} placeholder='Nhập mật khẩu mới' size='large' />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            label='Xác nhận mật khẩu'
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                }
              })
            ]}
          >
            <Password prefix={<LockOutlined />} placeholder='Nhập lại mật khẩu mới' size='large' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading} block size='large'>
              Đặt lại mật khẩu
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to='/login'>
              <Button type='link' icon={<ArrowLeftOutlined />}>
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default ResetPasswordPage

