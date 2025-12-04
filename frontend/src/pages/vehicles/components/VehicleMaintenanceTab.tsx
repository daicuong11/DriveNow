import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag, Card, Empty, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined } from '@ant-design/icons'
import api from '../../../services/api/axios'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface VehicleMaintenance {
  id: number
  vehicleId: number
  vehicleCode: string
  vehicleModel: string
  type: string
  startDate: string
  endDate?: string
  description: string
  cost?: number
  serviceProvider?: string
  status: string
}

interface VehicleMaintenanceTabProps {
  vehicleId: number
}

const VehicleMaintenanceTab = ({ vehicleId }: VehicleMaintenanceTabProps) => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['vehicleMaintenances', vehicleId, pagination.current, pagination.pageSize],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean
        data: {
          data: VehicleMaintenance[]
          totalCount: number
          pageNumber: number
          pageSize: number
          totalPages: number
        }
      }>('/VehicleMaintenances', {
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
      Maintenance: { text: 'Bảo dưỡng', color: 'processing' },
      Repair: { text: 'Sửa chữa', color: 'error' }
    }
    const typeInfo = typeMap[type] || { text: type, color: 'default' }
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      InProgress: { text: 'Đang thực hiện', color: 'processing' },
      Completed: { text: 'Hoàn thành', color: 'success' },
      Cancelled: { text: 'Đã hủy', color: 'default' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const columns: ColumnsType<VehicleMaintenance> = [
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
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 150,
      render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-')
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'right',
      render: (cost?: number) => formatCurrency(cost)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => formatStatus(status)
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
          onClick={() => navigate(`/vehicles/maintenance?view=${record.id}`)}
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
        <Empty description='Chưa có lịch sử bảo dưỡng/sửa chữa' />
      )}
    </Card>
  )
}

export default VehicleMaintenanceTab

