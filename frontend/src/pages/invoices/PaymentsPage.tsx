import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Tag } from 'antd'
import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import dayjs from 'dayjs'

interface Payment {
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

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const PaymentsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchTerm = useDebounce(searchInput, 500)
  const searchInputRef = useRef<string>('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | number | undefined>>({})
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDescending, setSortDescending] = useState(false)
  const [filterResetTrigger, setFilterResetTrigger] = useState(0)

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
      key: 'filterPaymentMethod',
      label: 'Phương thức',
      type: 'select',
      options: [
        { label: 'Tiền mặt', value: 'Cash' },
        { label: 'Chuyển khoản', value: 'BankTransfer' },
        { label: 'Thẻ tín dụng', value: 'CreditCard' }
      ],
      placeholder: 'Chọn phương thức...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: [
      'payments',
      pagination.current,
      pagination.pageSize,
      searchTerm,
      advancedFilters,
      sortBy,
      sortDescending
    ],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      if (advancedFilters.filterPaymentMethod) params.filterPaymentMethod = advancedFilters.filterPaymentMethod

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<Payment> }>('/Payments', {
        params
      })
      return response.data.data
    }
  })

  const handleViewDetail = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] })
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

  const handleTableSort = (sorter: { field?: string; order?: 'ascend' | 'descend' }) => {
    if (!sorter.field || !sorter.order) {
      setSortBy(undefined)
      setSortDescending(false)
    } else {
      setSortBy(sorter.field)
      setSortDescending(sorter.order === 'descend')
    }
    setPagination({ ...pagination, current: 1 })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      Cash: 'Tiền mặt',
      BankTransfer: 'Chuyển khoản',
      CreditCard: 'Thẻ tín dụng'
    }
    return methodMap[method] || method
  }

  const columns: (ColumnsType<Payment>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Số phiếu thu',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      searchable: true,
      sorter: true
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      searchable: true
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      searchable: true
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: true,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      filterable: true,
      render: (method: string) => <Tag>{formatPaymentMethod(method)}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.invoiceId)}
            title='Xem hóa đơn'
          />
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Thanh toán</h1>
        <Space>
          <Input
            placeholder='Tìm kiếm số phiếu thu, số hóa đơn, khách hàng...'
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

      <CustomTable<Payment>
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

export default PaymentsPage
