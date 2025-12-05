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
}

const Sidebar = ({ onCollapse }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const [collapsed, setCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  const allMenuItems: MenuItem[] = [
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
        { key: '/rental-orders', label: 'Đơn thuê' },
        { key: '/promotions', label: 'Khuyến mãi' }
      ]
    },
    {
      key: 'invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn',
      children: [
        { key: '/invoices', label: 'Danh sách Hóa đơn' },
        { key: '/payments', label: 'Thanh toán' }
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
        { key: '/employees', label: 'Nhân viên' },
        ...(userRole === 'Admin' ? [{ key: '/system-configs', label: 'Cấu hình hệ thống' }] : [])
      ]
    },
    // Only show Users menu for Admin
    ...(userRole === 'Admin'
      ? [
          {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Người dùng',
            children: [
              { key: '/users', label: 'Danh sách Người dùng' },
              { key: '/users/permissions', label: 'Phân quyền' }
            ]
          }
        ]
      : [])
  ]

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

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
