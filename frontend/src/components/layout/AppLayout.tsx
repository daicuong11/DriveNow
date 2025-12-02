import { Layout } from 'antd'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ProtectedRoute from '../common/ProtectedRoute'
import Dashboard from '../../pages/dashboard/Dashboard'
import Login from '../../pages/auth/Login'
import VehicleTypesPage from '../../pages/master-data/VehicleTypesPage'
import VehicleBrandsPage from '../../pages/master-data/VehicleBrandsPage'
import NotFound from '../../pages/NotFound'

const { Content } = Layout

const AppLayout = () => {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route
        path='/*'
        element={
          <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
              <Sidebar />
              <Layout style={{ marginLeft: 250 }}>
                <Header />
                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                  <Routes>
                    <Route path='/' element={<Navigate to='/dashboard' replace />} />
                    <Route path='/dashboard' element={<Dashboard />} />
                    {/* Master Data Routes - Match Backend API Routes */}
                    <Route path='/vehicle-types' element={<VehicleTypesPage />} />
                    <Route path='/vehicle-brands' element={<VehicleBrandsPage />} />
                    {/* Legacy routes - redirect to new routes */}
                    <Route path='/master-data/vehicle-types' element={<Navigate to='/vehicle-types' replace />} />
                    <Route path='/master-data/vehicle-brands' element={<Navigate to='/vehicle-brands' replace />} />
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
