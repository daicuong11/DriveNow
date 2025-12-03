import { useState } from 'react'
import { Layout } from 'antd'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ProtectedRoute from '../common/ProtectedRoute'
import Dashboard from '../../pages/dashboard/Dashboard'
import Login from '../../pages/auth/Login'
import VehicleTypesPage from '../../pages/master-data/VehicleTypesPage'
import VehicleBrandsPage from '../../pages/master-data/VehicleBrandsPage'
import VehicleColorsPage from '../../pages/master-data/VehicleColorsPage'
import CustomersPage from '../../pages/master-data/CustomersPage'
import EmployeesPage from '../../pages/master-data/EmployeesPage'
import SystemConfigsPage from '../../pages/master-data/SystemConfigsPage'
import NotFound from '../../pages/NotFound'

const { Content } = Layout

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route
        path='/*'
        element={
          <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
              <Sidebar onCollapse={setSidebarCollapsed} />
              <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
                <Header />
                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                  <Routes>
                    <Route path='/' element={<Navigate to='/dashboard' replace />} />
                    <Route path='/dashboard' element={<Dashboard />} />
                    {/* Master Data Routes - Match Backend API Routes */}
                    <Route path='/vehicle-types' element={<VehicleTypesPage />} />
                    <Route path='/vehicle-brands' element={<VehicleBrandsPage />} />
                    <Route path='/vehicle-colors' element={<VehicleColorsPage />} />
                    <Route path='/customers' element={<CustomersPage />} />
                    <Route path='/employees' element={<EmployeesPage />} />
                    <Route path='/system-configs' element={<SystemConfigsPage />} />
                    {/* Legacy routes - redirect to new routes */}
                    <Route path='/master-data/vehicle-types' element={<Navigate to='/vehicle-types' replace />} />
                    <Route path='/master-data/vehicle-brands' element={<Navigate to='/vehicle-brands' replace />} />
                    <Route path='/master-data/vehicle-colors' element={<Navigate to='/vehicle-colors' replace />} />
                    <Route path='/master-data/customers' element={<Navigate to='/customers' replace />} />
                    <Route path='/master-data/employees' element={<Navigate to='/employees' replace />} />
                    <Route path='/master-data/system-configs' element={<Navigate to='/system-configs' replace />} />
                    <Route path='*' element={<NotFound />} />
                  </Routes>
                </Content>
              </Layout>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppLayout
