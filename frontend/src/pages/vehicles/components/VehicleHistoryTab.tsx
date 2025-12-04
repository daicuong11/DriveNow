import { useQuery } from '@tanstack/react-query'
import { Table, Tag, Card, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import api from '../../../services/api/axios'
import dayjs from 'dayjs'

interface VehicleHistory {
  id: number
  vehicleId: number
  actionType: string
  oldStatus?: string
  newStatus?: string
  referenceId?: number
  referenceType?: string
  description?: string
  createdDate: string
  createdBy?: string
}

interface VehicleHistoryTabProps {
  vehicleId: number
}

const VehicleHistoryTab = ({ vehicleId }: VehicleHistoryTabProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicleHistory', vehicleId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: VehicleHistory[] }>(
        `/Vehicles/${vehicleId}/history`
      )
      return response.data.data
    },
    enabled: !!vehicleId
  })

  const formatActionType = (actionType: string) => {
    const actionMap: Record<string, { text: string; color: string }> = {
      Created: { text: 'Tạo mới', color: 'blue' },
      Updated: { text: 'Cập nhật', color: 'cyan' },
      Deleted: { text: 'Xóa', color: 'red' },
      Rented: { text: 'Cho thuê', color: 'orange' },
      Returned: { text: 'Trả xe', color: 'green' },
      Maintenance: { text: 'Bảo dưỡng', color: 'purple' },
      Repair: { text: 'Sửa chữa', color: 'volcano' },
      MaintenanceCompleted: { text: 'Hoàn thành bảo dưỡng', color: 'success' },
      RepairCompleted: { text: 'Hoàn thành sửa chữa', color: 'success' },
      In: { text: 'Nhập bãi', color: 'green' },
      Out: { text: 'Xuất bãi', color: 'orange' }
    }
    const action = actionMap[actionType] || { text: actionType, color: 'default' }
    return <Tag color={action.color}>{action.text}</Tag>
  }

  const formatStatus = (status?: string) => {
    if (!status) return '-'
    const statusMap: Record<string, string> = {
      Available: 'Có sẵn',
      Rented: 'Đang cho thuê',
      Maintenance: 'Đang bảo dưỡng',
      Repair: 'Đang sửa chữa',
      OutOfService: 'Ngừng hoạt động',
      InTransit: 'Đang vận chuyển'
    }
    return statusMap[status] || status
  }

  const columns: ColumnsType<VehicleHistory> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 180,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss')
    },
    {
      title: 'Hành động',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 180,
      render: (actionType: string) => formatActionType(actionType)
    },
    {
      title: 'Trạng thái cũ',
      dataIndex: 'oldStatus',
      key: 'oldStatus',
      width: 150,
      render: (status?: string) => formatStatus(status)
    },
    {
      title: 'Trạng thái mới',
      dataIndex: 'newStatus',
      key: 'newStatus',
      width: 150,
      render: (status?: string) => formatStatus(status)
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (createdBy?: string) => createdBy || '-'
    }
  ]

  return (
    <Card>
      {data && data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey='id'
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`
          }}
        />
      ) : (
        <Empty description='Chưa có lịch sử hoạt động' />
      )}
    </Card>
  )
}

export default VehicleHistoryTab

