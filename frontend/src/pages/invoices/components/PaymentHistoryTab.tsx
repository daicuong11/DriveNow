import React from 'react'
import { Card, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import api from '../../../services/api/axios'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

interface PaymentDto {
  id: number
  paymentNumber: string
  invoiceId: number
  invoiceNumber: string
  customerName: string
  paymentDate: string
  amount: number
  paymentMethod: string
  bankAccount?: string
  transactionCode?: string
  notes?: string
}

interface PaymentHistoryTabProps {
  invoiceId: number
}

const getPaymentMethodDisplayName = (method: string) => {
  const methodMap: Record<string, string> = {
    Cash: 'Tiền mặt',
    BankTransfer: 'Chuyển khoản',
    CreditCard: 'Thẻ tín dụng'
  }
  return methodMap[method] || method
}

const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ invoiceId }) => {
  const { data: payments, isLoading } = useQuery<PaymentDto[]>({
    queryKey: ['invoicePayments', invoiceId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PaymentDto[] }>(`/Invoices/${invoiceId}/payments`)
      return response.data.data
    },
    enabled: !!invoiceId
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const columns: ColumnsType<PaymentDto> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Số phiếu thu',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber'
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix()
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => <Tag>{getPaymentMethodDisplayName(method)}</Tag>
    },
    {
      title: 'Tài khoản ngân hàng',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
      render: (text) => text || '-'
    },
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (text) => text || '-'
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    }
  ]

  return (
    <Card title='Lịch sử thanh toán'>
      <Table
        columns={columns}
        dataSource={payments}
        loading={isLoading}
        rowKey='id'
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Không có lịch sử thanh toán nào.' }}
      />
    </Card>
  )
}

export default PaymentHistoryTab

