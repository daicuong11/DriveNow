import { useState, useMemo } from 'react'
import { Layout, Menu, Input, Button } from 'antd'
import {
  DashboardOutlined,
  CarOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'
import { useHasPermission } from '../../utils/permissions'
import Logo from '../common/Logo'
import '../../styles/sidebar.css'

const { Sider } = Layout

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: React.ReactNode
  children?: MenuItem[]
  permission?: string // Permission key required to view this menu item
}

const Sidebar = ({ onCollapse }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const permissions = useSelector((state: RootState) => state.auth.permissions)
  const [collapsed, setCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Permission checks
  const hasDashboardView = useHasPermission('dashboard.view')
  const hasVehiclesView = useHasPermission('vehicles.view')
  const hasRentalsView = useHasPermission('rentals.view')
  const hasInvoicesView = useHasPermission('invoices.view')
  const hasPaymentsView = useHasPermission('payments.view')
  const hasMasterDataView = useHasPermission('masterdata.view')
  const hasUsersView = useHasPermission('users.view')
  const hasSystemView = useHasPermission('system.view')

  const handleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapse?.(newCollapsed)
    // Clear search when collapsing
    if (newCollapsed) {
      setSearchTerm('')
    }
  }

  // Normalize Vietnamese text for search (remove diacritics)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  }

  // Check if search term matches text (fuzzy search)
  const matchesSearch = (text: string, search: string): boolean => {
    if (!search.trim()) return true
    const normalizedText = normalizeText(text)
    const normalizedSearch = normalizeText(search)
    // Exact match or contains
    return normalizedText.includes(normalizedSearch)
  }

  // Filter menu items based on permissions
  const allMenuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = []
    
    // Dashboard
    if (hasDashboardView) {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: 'dashboard.view'
      })
    }
    
    // Vehicles
    if (hasVehiclesView) {
      items.push({
        key: 'vehicles',
        icon: <CarOutlined />,
        label: 'Quản lý Xe',
        permission: 'vehicles.view',
        children: [
          { key: '/vehicles', label: 'Danh sách Xe', permission: 'vehicles.view' },
          { key: '/vehicles/in-out', label: 'Xuất/Nhập Bãi', permission: 'vehicles.inout' },
          { key: '/vehicles/maintenance', label: 'Bảo dưỡng/Sửa chữa', permission: 'vehicles.maintenance' }
        ].filter(item => !item.permission || permissions.includes(item.permission) || userRole === 'Admin')
      })
    }
    
    // Rentals
    if (hasRentalsView) {
      items.push({
        key: 'rentals',
        icon: <FileTextOutlined />,
        label: 'Cho thuê Xe',
        permission: 'rentals.view',
        children: [
          { key: '/rental-orders', label: 'Đơn thuê', permission: 'rentals.view' },
          { key: '/promotions', label: 'Khuyến mãi', permission: 'rentals.promotions' }
        ].filter(item => !item.permission || permissions.includes(item.permission) || userRole === 'Admin')
      })
    }
    
    // Invoices
    if (hasInvoicesView || hasPaymentsView) {
      items.push({
        key: 'invoices',
        icon: <FileTextOutlined />,
        label: 'Hóa đơn',
        permission: hasInvoicesView ? 'invoices.view' : 'payments.view',
        children: [
          hasInvoicesView && { key: '/invoices', label: 'Danh sách Hóa đơn', permission: 'invoices.view' },
          hasPaymentsView && { key: '/payments', label: 'Thanh toán', permission: 'payments.view' }
        ].filter((item): item is MenuItem => item !== false && (!item.permission || permissions.includes(item.permission) || userRole === 'Admin'))
      })
    }
    
    // Master Data
    if (hasMasterDataView) {
      const masterDataChildren: MenuItem[] = [
        { key: '/vehicle-types', label: 'Loại xe', permission: 'masterdata.view' },
        { key: '/vehicle-brands', label: 'Hãng xe', permission: 'masterdata.view' },
        { key: '/vehicle-colors', label: 'Màu xe', permission: 'masterdata.view' },
        { key: '/customers', label: 'Khách hàng', permission: 'masterdata.view' },
        { key: '/employees', label: 'Nhân viên', permission: 'masterdata.view' }
      ]
      
      if (hasSystemView) {
        masterDataChildren.push({ key: '/system-configs', label: 'Cấu hình hệ thống', permission: 'system.view' })
      }
      
      items.push({
        key: 'master-data',
        icon: <SettingOutlined />,
        label: 'Danh mục',
        permission: 'masterdata.view',
        children: masterDataChildren.filter(item => !item.permission || permissions.includes(item.permission) || userRole === 'Admin')
      })
    }
    
    // Users (Admin only or users.view permission)
    if (hasUsersView) {
      items.push({
        key: 'users',
        icon: <UserOutlined />,
        label: 'Người dùng',
        permission: 'users.view',
        children: [
          { key: '/users', label: 'Danh sách Người dùng', permission: 'users.view' },
          { key: '/users/permissions', label: 'Phân quyền', permission: 'users.view' }
        ].filter(item => !item.permission || permissions.includes(item.permission) || userRole === 'Admin')
      })
    }
    
    return items
  }, [hasDashboardView, hasVehiclesView, hasRentalsView, hasInvoicesView, hasPaymentsView, hasMasterDataView, hasUsersView, hasSystemView, permissions, userRole])

  // Filter menu items based on search term
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return allMenuItems

    return allMenuItems
      .map((item) => {
        // Check if parent label matches
        const parentMatches = matchesSearch(String(item.label), searchTerm)

        // Filter children if they exist
        if (item.children) {
          const filteredChildren = item.children.filter((child) => matchesSearch(String(child.label), searchTerm))
          // Include parent if it matches or if any child matches
          if (parentMatches || filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren.length > 0 ? filteredChildren : item.children
            }
          }
          return null
        }

        // For items without children, check if label matches
        return parentMatches ? item : null
      })
      .filter((item): item is MenuItem => item !== null)
  }, [allMenuItems, searchTerm])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider
      collapsed={collapsed}
      width={250}
      collapsedWidth={80}
      className='custom-sidebar'
      style={{
        overflow: 'hidden',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
      trigger={null}
    >
      {/* Logo and Collapse button */}
      <div
        style={{
          height: collapsed ? 'auto' : '64px',
          padding: collapsed ? '12px' : '0 16px',
          minHeight: collapsed ? 'auto' : '64px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '12px',
          flexDirection: collapsed ? 'column' : 'row',
          flexShrink: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: collapsed ? 0 : 1,
            minWidth: 0,
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <Logo collapsed={collapsed} />
        </div>
        {!collapsed && (
          <Button
            type='text'
            icon={<MenuFoldOutlined />}
            onClick={handleCollapse}
            className='sidebar-collapse-btn'
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '16px',
              width: '32px',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0
            }}
          />
        )}
        {collapsed && (
          <Button
            type='text'
            icon={<MenuUnfoldOutlined />}
            onClick={handleCollapse}
            className='sidebar-collapse-btn'
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '16px',
              width: '100%',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
        )}
      </div>

      {/* Search input */}
      {!collapsed && (
        <div
          style={{
            margin: '16px',
            padding: '0',
            flexShrink: 0
          }}
        >
          <Input
            placeholder='Tìm kiếm menu...'
            prefix={<SearchOutlined style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className='sidebar-search-input'
            size='small'
          />
        </div>
      )}

      {/* Menu Container with Scroll */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
        className='sidebar-menu-container'
      >
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[location.pathname]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items={filteredMenuItems as any}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          className='custom-menu'
        />
      </div>
    </Sider>
  )
}

export default Sidebar
