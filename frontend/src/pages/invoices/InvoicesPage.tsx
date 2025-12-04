import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Popconfirm, Tag } from 'antd'
import { showSuccess, showError } from '../../utils/notifications'
import { EyeOutlined, SearchOutlined, CopyOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import ActionSelect from '../../components/common/ActionSelect'
import dayjs from 'dayjs'

interface Invoice {
  id: number
  invoiceNumber: string
  rentalOrderId: number
  rentalOrderNumber: string
  customerId: number
  customerName: string
  customerPhone: string
  invoiceDate: string
  dueDate: string
  subTotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  notes?: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const InvoicesPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchTerm = useDebounce(searchInput, 500)
  const searchInputRef = useRef<string>('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | number | undefined>>({})
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDescending, setSortDescending] = useState(false)
  const [filterResetTrigger, setFilterResetTrigger] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (searchInputRef.current !== '') {
      setSearchTerm(searchInputRef.current)
      searchInputRef.current = ''
    } else {
      setSearchTerm(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  const filterConfigs: FilterConfig[] = [
    {
      key: 'filterStatus',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Chưa thanh toán', value: 'Unpaid' },
        { label: 'Thanh toán một phần', value: 'Partial' },
        { label: 'Đã thanh toán đủ', value: 'Paid' },
        { label: 'Quá hạn', value: 'Overdue' },
        { label: 'Đã hủy', value: 'Cancelled' }
      ],
      placeholder: 'Chọn trạng thái...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', pagination.current, pagination.pageSize, searchTerm, advancedFilters, sortBy, sortDescending],
    queryFn: async () => {
      const params: Record<string, any> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<Invoice> }>('/Invoices', {
        params
      })
      return response.data.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/Invoices/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa hóa đơn thành công!')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const copyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ success: boolean; data: Invoice }>(`/Invoices/${id}/copy`)
      return response.data.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo bản sao hóa đơn thành công!')
      navigate(`/invoices/${data.id}`)
    },
    onError: () => {
      showError('Tạo bản sao thất bại. Vui lòng thử lại!')
    }
  })

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleViewDetail = (id: number) => {
    navigate(`/invoices/${id}`)
  }

  const handleCopy = (id: number) => {
    copyMutation.mutate(id)
  }

  const handlePayment = (id: number) => {
    navigate(`/invoices/${id}?tab=payment`)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
  }

  const handleFilterChange = (filters: Record<string, string | number | undefined>) => {
    setAdvancedFilters(filters)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterClear = () => {
    setAdvancedFilters({})
    setFilterResetTrigger((prev) => prev + 1)
    setPagination({ ...pagination, current: 1 })
  }

  const handleTableSort = (field: string, order: 'ascend' | 'descend' | null) => {
    if (order === null) {
      setSortBy(undefined)
      setSortDescending(false)
    } else {
      setSortBy(field)
      setSortDescending(order === 'descend')
    }
    setPagination({ ...pagination, current: 1 })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      Unpaid: { text: 'Chưa thanh toán', color: 'red' },
      Partial: { text: 'Thanh toán một phần', color: 'orange' },
      Paid: { text: 'Đã thanh toán đủ', color: 'green' },
      Overdue: { text: 'Quá hạn', color: 'volcano' },
      Cancelled: { text: 'Đã hủy', color: 'default' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  const columns: (ColumnsType<Invoice>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      searchable: true,
      sorter: true
    },
    {
      title: 'Số đơn thuê',
      dataIndex: 'rentalOrderNumber',
      key: 'rentalOrderNumber',
      searchable: true
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      searchable: true
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      sorter: true,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Còn lại',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'right',
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filterable: true,
      render: (status: string) => formatStatus(status)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} title='Xem chi tiết' />
          {record.status !== 'Paid' && record.status !== 'Cancelled' && (
            <Button
              type='link'
              icon={<DollarOutlined />}
              onClick={() => handlePayment(record.id)}
              title='Thanh toán'
            />
          )}
          <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} title='Tạo bản sao' />
          {record.status === 'Unpaid' && (
            <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
              <Button type='link' danger title='Xóa' />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Hóa đơn</h1>
        <Space>
          <Input
            placeholder='Tìm kiếm số hóa đơn, số đơn thuê, khách hàng...'
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPagination({ ...pagination, current: 1 })
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value
              searchInputRef.current = value
              setSearchTerm(value)
              setPagination({ ...pagination, current: 1 })
            }}
            allowClear
            style={{ width: 300 }}
          />
          <RefreshButton onRefresh={handleRefresh} loading={isLoading} />
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<Invoice>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        rowKey='id'
        onSortChange={handleTableSort}
        enableRowSelection={false}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data?.totalCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize })
          }
        }}
      />
    </div>
  )
}

export default InvoicesPage

