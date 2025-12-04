import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag, Card, Empty, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined } from '@ant-design/icons'
import api from '../../../services/api/axios'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface VehicleInOut {
  id: number
  vehicleId: number
  vehicleCode: string
  vehicleModel: string
  type: string
  date: string
  location?: string
  reason?: string
  employeeId: number
  employeeName: string
  notes?: string
}

interface VehicleInOutTabProps {
  vehicleId: number
}

const VehicleInOutTab = ({ vehicleId }: VehicleInOutTabProps) => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['vehicleInOuts', vehicleId, pagination.current, pagination.pageSize],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean
        data: {
          data: VehicleInOut[]
          totalCount: number
          pageNumber: number
          pageSize: number
          totalPages: number
        }
      }>('/VehicleInOuts', {
        params: {
          pageNumber: pagination.current,
          pageSize: pagination.pageSize,
          filterVehicleId: vehicleId
        }
      })
      return response.data.data
    },
    enabled: !!vehicleId
  })

  const formatType = (type: string) => {
    const typeMap: Record<string, { text: string; color: string }> = {
      In: { text: 'Nhập bãi', color: 'success' },
      Out: { text: 'Xuất bãi', color: 'warning' }
    }
    const typeInfo = typeMap[type] || { text: type, color: 'default' }
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
  }

  const columns: ColumnsType<VehicleInOut> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => formatType(type)
    },
    {
      title: 'Ngày giờ',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      width: 200
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type='link'
          icon={<EyeOutlined />}
          onClick={() => navigate(`/vehicles/in-out?view=${record.id}`)}
        >
          Xem
        </Button>
      )
    }
  ]

  return (
    <Card>
      {data && data.data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data.data}
          rowKey='id'
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: data.totalCount,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize })
            }
          }}
        />
      ) : (
        <Empty description='Chưa có lịch sử xuất/nhập bãi' />
      )}
    </Card>
  )
}

export default VehicleInOutTab

