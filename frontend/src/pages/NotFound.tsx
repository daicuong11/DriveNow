import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Result
      status='404'
      title='404'
      subTitle='Xin lỗi, trang bạn đang tìm kiếm không tồn tại.'
      extra={
        <Button type='primary' icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          Về Trang chủ
        </Button>
      }
    />
  )
}

export default NotFound
