import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  CarOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api/axios'

interface DashboardOverview {
  totalVehicles: number
  rentedVehicles: number
  availableVehicles: number
  todayRentals: number
  todayRevenue: number
  monthlyRevenue: number
  newCustomers: number
  unpaidInvoices: number
}

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: DashboardOverview }>('/Dashboard/overview')
      return response.data.data
    },
    refetchInterval: 60000 // Refetch every minute
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Tổng số xe'
              value={data?.totalVehicles || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Xe đang cho thuê'
              value={data?.rentedVehicles || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Xe có sẵn'
              value={data?.availableVehicles || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Đơn thuê hôm nay'
              value={data?.todayRentals || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Doanh thu hôm nay'
              value={data?.todayRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Doanh thu tháng này'
              value={data?.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Khách hàng mới'
              value={data?.newCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='Hóa đơn chưa thanh toán'
              value={data?.unpaidInvoices || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
