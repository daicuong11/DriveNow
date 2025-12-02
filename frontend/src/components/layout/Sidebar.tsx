import { Layout, Menu } from 'antd'
import { DashboardOutlined, CarOutlined, FileTextOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'vehicles',
      icon: <CarOutlined />,
      label: 'Quản lý Xe',
      children: [
        { key: '/vehicles', label: 'Danh sách Xe' },
        { key: '/vehicles/in-out', label: 'Xuất/Nhập Bãi' },
        { key: '/vehicles/maintenance', label: 'Bảo dưỡng/Sửa chữa' }
      ]
    },
    {
      key: 'rentals',
      icon: <FileTextOutlined />,
      label: 'Cho thuê Xe',
      children: [
        { key: '/rentals', label: 'Đơn thuê' },
        { key: '/rentals/promotions', label: 'Khuyến mãi' }
      ]
    },
    {
      key: 'invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn',
      children: [
        { key: '/invoices', label: 'Danh sách Hóa đơn' },
        { key: '/invoices/payments', label: 'Thanh toán' }
      ]
    },
    {
      key: 'master-data',
      icon: <SettingOutlined />,
      label: 'Danh mục',
      children: [
        { key: '/vehicle-types', label: 'Loại xe' },
        { key: '/vehicle-brands', label: 'Hãng xe' },
        { key: '/vehicle-colors', label: 'Màu xe' },
        { key: '/customers', label: 'Khách hàng' },
        { key: '/employees', label: 'Nhân viên' }
      ]
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Người dùng'
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider
      collapsible
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000
      }}
    >
      <div
        style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        DriveNow
      </div>
      <Menu theme='dark' mode='inline' selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
    </Sider>
  )
}

export default Sidebar
