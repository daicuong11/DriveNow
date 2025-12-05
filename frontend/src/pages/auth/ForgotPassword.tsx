import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { authService } from '../../services/api/auth.service'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'

const { Title, Text } = Typography

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values: { email: string }) => {
    setLoading(true)
    try {
      const response = await authService.forgotPassword(values.email)
      if (response.data?.token) {
        // Temporary: show token (in production, this would be sent via email)
        message.info(`Token đặt lại mật khẩu: ${response.data.token}`, 10)
        showSuccess('Token đặt lại mật khẩu đã được tạo. Vui lòng sử dụng token này để đặt lại mật khẩu.')
        // Navigate to reset password page with token
        navigate(`/reset-password?token=${response.data.token}`)
      } else {
        showSuccess('Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu')
      }
    } catch (error: any) {
      showError(getErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại!'))
    } finally {
      setLoading(false)
    }
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
            Quên mật khẩu
          </Title>
          <Text type='secondary'>Nhập email để nhận link đặt lại mật khẩu</Text>
        </div>

        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder='Nhập email của bạn' size='large' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading} block size='large'>
              Gửi yêu cầu đặt lại mật khẩu
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

export default ForgotPasswordPage

