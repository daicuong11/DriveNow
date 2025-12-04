import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Popconfirm, Badge } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import ImportButton from '../../components/common/ImportButton'
import ExportButton from '../../components/common/ExportButton'
import ActionSelect from '../../components/common/ActionSelect'
import ImportResultModal from '../../components/common/ImportResultModal'
import MasterDataSelect from '../../components/common/MasterDataSelect'

interface Vehicle {
  id: number
  code: string
  vehicleTypeId: number
  vehicleTypeName: string
  vehicleBrandId: number
  vehicleBrandName: string
  vehicleColorId: number
  vehicleColorName: string
  model: string
  year: number
  seatCount: number
  fuelType: string
  licensePlate: string
  chassisNumber?: string
  engineNumber?: string
  registrationDate?: string
  insuranceExpiryDate?: string
  status: string
  currentLocation?: string
  dailyRentalPrice: number
  imageUrl?: string
  description?: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const VehiclesPage = () => {
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
  const [selectedRows, setSelectedRows] = useState<Vehicle[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    open: boolean
    success: boolean
    message: string
    totalRows?: number
    successCount?: number
    errors?: Array<{ row: number; message: string; field?: string }>
  }>({
    open: false,
    success: false,
    message: ''
  })
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
    { key: 'filterCode', label: 'Biển số', type: 'text', placeholder: 'Nhập biển số để lọc...' },
    { key: 'filterName', label: 'Model', type: 'text', placeholder: 'Nhập model để lọc...' },
    {
      key: 'filterStatus',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Có sẵn', value: 'Available' },
        { label: 'Đang cho thuê', value: 'Rented' },
        { label: 'Đang bảo dưỡng', value: 'Maintenance' },
        { label: 'Đang sửa chữa', value: 'Repair' },
        { label: 'Ngừng hoạt động', value: 'OutOfService' },
        { label: 'Đang vận chuyển', value: 'InTransit' }
      ],
      placeholder: 'Chọn trạng thái...'
    },
    {
      key: 'filterVehicleTypeId',
      label: 'Loại xe',
      type: 'select',
      options: [], // Will be loaded dynamically
      placeholder: 'Chọn loại xe...'
    },
    {
      key: 'filterVehicleBrandId',
      label: 'Hãng xe',
      type: 'select',
      options: [], // Will be loaded dynamically
      placeholder: 'Chọn hãng xe...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', pagination.current, pagination.pageSize, searchTerm, advancedFilters, sortBy, sortDescending],
    queryFn: async () => {
      const params: Record<string, any> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      if (advancedFilters.filterCode) params.filterCode = advancedFilters.filterCode
      if (advancedFilters.filterName) params.filterName = advancedFilters.filterName
      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus
      if (advancedFilters.filterVehicleTypeId) params.filterVehicleTypeId = advancedFilters.filterVehicleTypeId
      if (advancedFilters.filterVehicleBrandId) params.filterVehicleBrandId = advancedFilters.filterVehicleBrandId

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<Vehicle> }>('/Vehicles', {
        params
      })
      return response.data.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/Vehicles/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa xe thành công!')
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleCopy = async (id: number) => {
    try {
      // Fetch vehicle data để copy
      const response = await api.get<{ success: boolean; data: Vehicle }>(`/Vehicles/${id}`)
      const vehicleData = response.data.data
      
      // Bỏ code và id, giữ lại các field khác
      const { code, id: vehicleId, ...copyData } = vehicleData
      
      // Navigate đến màn hình tạo mới với dữ liệu copy
      navigate('/vehicles/0', {
        state: {
          copyData: {
            ...copyData,
            code: '' // Code để trống
          }
        }
      })
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể tải dữ liệu để copy. Vui lòng thử lại!')
    }
  }

  const handleViewDetail = (id: number) => {
    navigate(`/vehicles/${id}`)
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
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
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

  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/Vehicles/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setImportResult({
          open: true,
          success: true,
          message: response.data.data?.message || response.data.message || 'Import thành công!',
          totalRows: response.data.data?.totalRows,
          successCount: response.data.data?.successCount,
          errors: []
        })
        queryClient.invalidateQueries({ queryKey: ['vehicles'] })
        setSelectedRowKeys([])
        setSelectedRows([])
      } else {
        setImportResult({
          open: true,
          success: false,
          message: response.data.message || 'Import thất bại',
          totalRows: response.data.totalRows,
          successCount: 0,
          errors: response.data.errors || []
        })
        throw new Error('Import thất bại do lỗi validation')
      }
    } catch (error: any) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        setImportResult({
          open: true,
          success: false,
          message: error.response?.data?.message || 'Import thất bại',
          totalRows: error.response?.data?.totalRows,
          successCount: 0,
          errors: error.response.data.errors
        })
      } else {
        setImportResult({
          open: true,
          success: false,
          message: error.response?.data?.message || error.message || 'Import thất bại!',
          totalRows: 0,
          successCount: 0,
          errors: []
        })
      }
      throw error
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Vui lòng chọn ít nhất một dòng để xóa!')
      return
    }

    try {
      const ids = selectedRowKeys.map((key) => Number(key))
      await api.post('/Vehicles/bulk-delete', ids)
      showSuccess(`Đã xóa ${selectedRowKeys.length} xe thành công!`)
      setSelectedRowKeys([])
      setSelectedRows([])
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        showError(axiosError.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
      } else {
        showError('Xóa thất bại. Vui lòng thử lại!')
      }
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = {
      Available: { text: 'Có sẵn', color: 'success' },
      Rented: { text: 'Đang cho thuê', color: 'warning' },
      Maintenance: { text: 'Đang bảo dưỡng', color: 'processing' },
      Repair: { text: 'Đang sửa chữa', color: 'error' },
      OutOfService: { text: 'Ngừng hoạt động', color: 'default' },
      InTransit: { text: 'Đang vận chuyển', color: 'processing' }
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

  const columns: (ColumnsType<Vehicle>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Biển số',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Loại xe',
      dataIndex: 'vehicleTypeName',
      key: 'vehicleTypeName',
      searchable: true,
      filterable: false
    },
    {
      title: 'Hãng xe',
      dataIndex: 'vehicleBrandName',
      key: 'vehicleBrandName',
      searchable: true,
      filterable: false
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Năm SX',
      dataIndex: 'year',
      key: 'year',
      sorter: true,
      width: 100,
      align: 'center'
    },
    {
      title: 'Số chỗ',
      dataIndex: 'seatCount',
      key: 'seatCount',
      width: 100,
      align: 'center'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filterable: true,
      filters: [
        { text: 'Có sẵn', value: 'Available' },
        { text: 'Đang cho thuê', value: 'Rented' },
        { text: 'Đang bảo dưỡng', value: 'Maintenance' },
        { text: 'Đang sửa chữa', value: 'Repair' },
        { text: 'Ngừng hoạt động', value: 'OutOfService' },
        { text: 'Đang vận chuyển', value: 'InTransit' }
      ],
      render: (status: string) => formatStatus(status)
    },
    {
      title: 'Giá thuê/ngày',
      dataIndex: 'dailyRentalPrice',
      key: 'dailyRentalPrice',
      sorter: true,
      width: 150,
      align: 'right',
      render: (price: number) => formatCurrency(price)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} title='Xem chi tiết' />
          <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} title='Tạo bản sao' />
          <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
            <Button type='link' danger icon={<DeleteOutlined />} title='Xóa' />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Xe</h1>
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
          <ImportButton onImport={handleImport} loading={isImporting} title='Import Excel' />
          <ExportButton
            selectedIds={selectedRowKeys.length > 0 ? selectedRowKeys.map((key) => Number(key)) : []}
            apiEndpoint='/Vehicles/export'
            filename='Vehicle'
            loading={false}
            disabled={false}
          />
          <ActionSelect
            onAdd={() => navigate('/vehicles/0')}
            onDelete={handleDeleteMultiple}
            deleteDisabled={selectedRowKeys.length === 0}
          />
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<Vehicle>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        rowKey='id'
        onSortChange={handleTableSort}
        enableRowSelection={true}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={(keys, rows) => {
          setSelectedRowKeys(keys)
          setSelectedRows(rows)
        }}
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

      <ImportResultModal
        open={importResult.open}
        success={importResult.success}
        message={importResult.message}
        totalRows={importResult.totalRows}
        successCount={importResult.successCount}
        errors={importResult.errors}
        onClose={() => {
          setImportResult({ ...importResult, open: false })
        }}
      />
    </div>
  )
}

export default VehiclesPage

