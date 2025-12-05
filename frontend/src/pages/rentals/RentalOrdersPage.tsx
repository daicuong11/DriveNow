import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Popconfirm, Badge, Tag } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { EyeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useHasPermission } from '../../utils/permissions'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import ActionSelect from '../../components/common/ActionSelect'
import dayjs from 'dayjs'

interface RentalOrder {
  id: number
  orderNumber: string
  customerId: number
  customerName: string
  customerPhone: string
  vehicleId: number
  vehicleCode: string
  vehicleModel: string
  employeeId: number
  employeeName: string
  startDate: string
  endDate: string
  actualStartDate?: string
  actualEndDate?: string
  pickupLocation: string
  returnLocation: string
  dailyRentalPrice: number
  totalDays: number
  subTotal: number
  discountAmount: number
  promotionCode?: string
  totalAmount: number
  depositAmount: number
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

const RentalOrdersPage = () => {
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<RentalOrder[]>([])
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
    { key: 'filterOrderNumber', label: 'Số đơn', type: 'text', placeholder: 'Nhập số đơn để lọc...' },
    { key: 'filterCustomerName', label: 'Khách hàng', type: 'text', placeholder: 'Nhập tên khách hàng...' },
    { key: 'filterVehicleCode', label: 'Biển số xe', type: 'text', placeholder: 'Nhập biển số xe...' },
    {
      key: 'filterStatus',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Nháp', value: 'Draft' },
        { label: 'Đã xác nhận', value: 'Confirmed' },
        { label: 'Đang cho thuê', value: 'InProgress' },
        { label: 'Đã hoàn thành', value: 'Completed' },
        { label: 'Đã xuất hóa đơn', value: 'Invoiced' },
        { label: 'Đã hủy', value: 'Cancelled' }
      ],
      placeholder: 'Chọn trạng thái...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['rentalOrders', pagination.current, pagination.pageSize, searchTerm, advancedFilters, sortBy, sortDescending],
    queryFn: async () => {
      const params: Record<string, any> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      if (advancedFilters.filterOrderNumber) params.filterOrderNumber = advancedFilters.filterOrderNumber
      if (advancedFilters.filterCustomerName) params.filterCustomerName = advancedFilters.filterCustomerName
      if (advancedFilters.filterVehicleCode) params.filterVehicleCode = advancedFilters.filterVehicleCode
      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<RentalOrder> }>('/RentalOrders', {
        params
      })
      return response.data.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/RentalOrders/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa đơn thuê thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: () => {
      showError(getErrorMessage(error, 'Xóa thất bại. Vui lòng thử lại!'))
    }
  })

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleViewDetail = (id: number) => {
    navigate(`/rental-orders/${id}`)
  }

  // Copy functionality - Navigate to new page with copied data
  const handleCopy = async (id: number) => {
    try {
      const response = await api.get<{ success: boolean; data: RentalOrder }>(`/RentalOrders/${id}`)
      const orderToCopy = response.data.data
      // Navigate to new rental order creation page with copied data
      navigate('/rental-orders/0', {
        state: {
          copyData: {
            ...orderToCopy,
            orderNumber: '', // Clear orderNumber for new entry
            id: undefined, // Clear id
            status: 'Draft', // Reset status to Draft
            actualStartDate: undefined, // Clear actual dates
            actualEndDate: undefined,
            startDate: orderToCopy.startDate, // Keep as string
            endDate: orderToCopy.endDate // Keep as string
          }
        }
      })
    } catch (error: any) {
      showError(getErrorMessage(error, 'Không thể tải dữ liệu để copy. Vui lòng thử lại!'))
    }
  }

  const handleRefresh = () => {
    setSearchTerm('')
    setSearchInput('')
    searchInputRef.current = ''
    setAdvancedFilters({})
    setFilterResetTrigger((prev) => prev + 1)
    setSortBy(undefined)
    setSortDescending(false)
    setPagination({ current: 1, pageSize: pagination.pageSize })
    queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
  }

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    setAdvancedFilters(filters)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterClear = () => {
    setAdvancedFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleTableSort = (sorter: { field?: string; order?: 'ascend' | 'descend' }) => {
    if (sorter.field) {
      setSortBy(sorter.field)
      setSortDescending(sorter.order === 'descend')
      setPagination({ ...pagination, current: 1 })
    } else {
      setSortBy(undefined)
      setSortDescending(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' | 'purple' }> = {
      Draft: { text: 'Nháp', color: 'default' },
      Confirmed: { text: 'Đã xác nhận', color: 'processing' },
      InProgress: { text: 'Đang cho thuê', color: 'warning' },
      Completed: { text: 'Đã hoàn thành', color: 'success' },
      Invoiced: { text: 'Đã xuất hóa đơn', color: 'purple' },
      Cancelled: { text: 'Đã hủy', color: 'error' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Badge status={statusInfo.color} text={statusInfo.text} />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const columns: (ColumnsType<RentalOrder>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Số đơn',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      searchable: true,
      filterable: false,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.customerPhone}</div>
        </div>
      )
    },
    {
      title: 'Xe',
      dataIndex: 'vehicleCode',
      key: 'vehicleCode',
      searchable: true,
      filterable: false,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.vehicleModel}</div>
        </div>
      )
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: true,
      render: (text) => dayjs(text).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: true,
      render: (text) => dayjs(text).format('DD/MM/YYYY')
    },
    {
      title: 'Số ngày',
      dataIndex: 'totalDays',
      key: 'totalDays',
      width: 100,
      align: 'center'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: true,
      width: 150,
      align: 'right',
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filterable: true,
      filters: [
        { text: 'Nháp', value: 'Draft' },
        { text: 'Đã xác nhận', value: 'Confirmed' },
        { text: 'Đang cho thuê', value: 'InProgress' },
        { text: 'Đã hoàn thành', value: 'Completed' },
        { text: 'Đã xuất hóa đơn', value: 'Invoiced' },
        { text: 'Đã hủy', value: 'Cancelled' }
      ],
      render: (status: string) => formatStatus(status)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} title='Xem chi tiết' />
          <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} title='Tạo bản sao' />
          {record.status === 'Draft' && canDelete && (
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
        <h1 className='text-2xl font-bold'>Quản lý Đơn thuê</h1>
        <Space>
          <Input
            placeholder='Tìm kiếm...'
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
            style={{ width: 250 }}
          />
          <RefreshButton onRefresh={handleRefresh} loading={isLoading} />
          <ActionSelect onAdd={() => navigate('/rental-orders/0')} />
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<RentalOrder>
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
            setSelectedRowKeys([])
            setSelectedRows([])
          }
        }}
      />
    </div>
  )
}

export default RentalOrdersPage
