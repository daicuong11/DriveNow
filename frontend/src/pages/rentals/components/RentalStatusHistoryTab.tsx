import React from 'react'
import { Card, Table, Tag, Timeline } from 'antd'
import { useQuery } from '@tanstack/react-query'
import api from '../../../services/api/axios'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

interface RentalStatusHistoryDto {
  id: number
  rentalOrderId: number
  oldStatus?: string
  newStatus: string
  changedDate: string
  changedBy?: string
  notes?: string
}

interface RentalStatusHistoryTabProps {
  rentalOrderId: number
}

const getStatusDisplayName = (status?: string) => {
  if (!status) return ''
  const statusMap: Record<string, string> = {
    Draft: 'Nháp',
    Confirmed: 'Đã xác nhận',
    InProgress: 'Đang cho thuê',
    Completed: 'Đã hoàn thành',
    Invoiced: 'Đã xuất hóa đơn',
    Cancelled: 'Đã hủy'
  }
  return statusMap[status] || status
}

const getStatusColor = (status?: string) => {
  if (!status) return 'default'
  const colorMap: Record<string, string> = {
    Draft: 'default',
    Confirmed: 'blue',
    InProgress: 'orange',
    Completed: 'green',
    Invoiced: 'purple',
    Cancelled: 'red'
  }
  return colorMap[status] || 'default'
}

const RentalStatusHistoryTab: React.FC<RentalStatusHistoryTabProps> = ({ rentalOrderId }) => {
  const { data: history, isLoading } = useQuery<RentalStatusHistoryDto[]>({
    queryKey: ['rentalStatusHistory', rentalOrderId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: RentalStatusHistoryDto[] }>(
        `/RentalOrders/${rentalOrderId}/history`
      )
      return response.data.data
    },
    enabled: !!rentalOrderId
  })

  const columns: ColumnsType<RentalStatusHistoryDto> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Thời gian',
      dataIndex: 'changedDate',
      key: 'changedDate',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => dayjs(a.changedDate).unix() - dayjs(b.changedDate).unix()
    },
    {
      title: 'Trạng thái cũ',
      dataIndex: 'oldStatus',
      key: 'oldStatus',
      render: (text) => (text ? <Tag color={getStatusColor(text)}>{getStatusDisplayName(text)}</Tag> : '-')
    },
    {
      title: 'Trạng thái mới',
      dataIndex: 'newStatus',
      key: 'newStatus',
      render: (text) => <Tag color={getStatusColor(text)}>{getStatusDisplayName(text)}</Tag>
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: 'Người thay đổi',
      dataIndex: 'changedBy',
      key: 'changedBy',
      render: (text) => text || 'Hệ thống'
    }
  ]

  return (
    <Card title='Lịch sử thay đổi trạng thái'>
      <Table
        columns={columns}
        dataSource={history}
        loading={isLoading}
        rowKey='id'
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Không có lịch sử thay đổi trạng thái nào.' }}
      />
    </Card>
  )
}

export default RentalStatusHistoryTab
