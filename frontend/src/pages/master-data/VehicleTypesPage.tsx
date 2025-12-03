import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, message } from 'antd'
import { showSuccess, showError } from '../../utils/notifications'
import { EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import StatusSelect from '../../components/common/StatusSelect'
import CodeInput from '../../components/common/CodeInput'
import ImportButton from '../../components/common/ImportButton'
import ExportButton from '../../components/common/ExportButton'
import ActionSelect from '../../components/common/ActionSelect'
import ImportResultModal from '../../components/common/ImportResultModal'

interface VehicleType {
  id: number
  code: string
  name: string
  description?: string
  status: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const VehicleTypesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('') // Giá trị input thực tế
  const debouncedSearchTerm = useDebounce(searchInput, 500) // Debounce 500ms
  const searchInputRef = useRef<string>('') // Lưu giá trị khi nhấn Enter
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | undefined>>({})
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDescending, setSortDescending] = useState(false)
  const [filterResetTrigger, setFilterResetTrigger] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<VehicleType[]>([])
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

  // Sync debouncedSearchTerm với searchTerm (dùng cho query)
  // Nếu có searchInputRef thì dùng nó (khi nhấn Enter), không thì dùng debounced
  useEffect(() => {
    if (searchInputRef.current !== '') {
      setSearchTerm(searchInputRef.current)
      searchInputRef.current = ''
    } else {
      setSearchTerm(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  const filterConfigs: FilterConfig[] = [
    { key: 'filterCode', label: 'Mã', type: 'text', placeholder: 'Nhập mã để lọc...' },
    { key: 'filterName', label: 'Tên', type: 'text', placeholder: 'Nhập tên để lọc...' },
    {
      key: 'filterStatus',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Hoạt động', value: 'A' },
        { label: 'Không hoạt động', value: 'I' }
      ],
      placeholder: 'Chọn trạng thái...'
    },
    { key: 'filterDescription', label: 'Mô tả', type: 'text', placeholder: 'Nhập mô tả để lọc...' }
  ]

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: [
      'vehicleTypes',
      pagination.current,
      pagination.pageSize,
      searchTerm,
      advancedFilters,
      sortBy,
      sortDescending
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm || undefined
      }

      // Add advanced filters
      if (advancedFilters.filterCode) params.filterCode = advancedFilters.filterCode
      if (advancedFilters.filterName) params.filterName = advancedFilters.filterName
      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus
      if (advancedFilters.filterDescription) params.filterDescription = advancedFilters.filterDescription

      // Add sorting
      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<VehicleType> }>('/VehicleTypes', {
        params
      })
      return response.data.data
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/VehicleTypes', values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới loại xe thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/VehicleTypes/${id}`, values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật loại xe thành công!')
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/VehicleTypes/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa loại xe thành công!')
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (record: VehicleType) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleCopy = (record: VehicleType) => {
    // Mở popup tạo mới với dữ liệu của record được copy (trừ Code)
    setEditingId(null)
    const { code, ...restData } = record
    form.setFieldsValue({
      ...restData,
      code: '' // Bỏ trống Code
    })
    setIsModalOpen(true)
  }

  const handleRefresh = () => {
    // Reset search term
    setSearchTerm('')
    setSearchInput('')
    searchInputRef.current = ''
    // Reset advanced filters
    setAdvancedFilters({})
    // Reset filter form (trigger reset in AdvancedFilter component)
    setFilterResetTrigger((prev) => prev + 1)
    // Reset sorting
    setSortBy(undefined)
    setSortDescending(false)
    // Reset pagination to first page
    setPagination({ current: 1, pageSize: pagination.pageSize })
    // Invalidate and refetch data
    queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
  }

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    setAdvancedFilters(filters)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterClear = () => {
    setAdvancedFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        updateMutation.mutate({ id: editingId, values })
      } else {
        createMutation.mutate(values)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
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

  // Handle import Excel
  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/VehicleTypes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        // Show success result modal
        setImportResult({
          open: true,
          success: true,
          message: response.data.data?.message || response.data.message || 'Import thành công!',
          totalRows: response.data.data?.totalRows,
          successCount: response.data.data?.successCount,
          errors: []
        })
        queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
        setSelectedRowKeys([])
        setSelectedRows([])
      } else {
        // Show error result modal
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
      // Check if error response contains validation errors
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

  // Handle delete multiple
  const handleDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dòng để xóa!')
      return
    }

    try {
      const ids = selectedRowKeys.map((key) => Number(key))
      await api.post('/VehicleTypes/bulk-delete', ids)
      showSuccess(`Đã xóa ${selectedRowKeys.length} loại xe thành công!`)
      setSelectedRowKeys([])
      setSelectedRows([])
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] })
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        showError(axiosError.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
      } else {
        showError('Xóa thất bại. Vui lòng thử lại!')
      }
    }
  }

  const columns: (ColumnsType<VehicleType>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      searchable: true,
      filterable: false
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filterable: true,
      filters: [
        { text: 'Hoạt động', value: 'A' },
        { text: 'Không hoạt động', value: 'I' }
      ],
      render: (status: string) => (
        <Badge status={status === 'A' ? 'success' : 'error'} text={status === 'A' ? 'Hoạt động' : 'Không hoạt động'} />
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record)} />
          <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
            <Button type='link' danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Loại xe</h1>
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
              // Khi nhấn Enter, search ngay lập tức
              const value = (e.target as HTMLInputElement).value
              searchInputRef.current = value
              setSearchTerm(value)
              setPagination({ ...pagination, current: 1 })
            }}
            allowClear
            style={{ width: 250 }}
          />
          <RefreshButton onRefresh={handleRefresh} loading={isLoading} />
          <ImportButton onImport={handleImport} loading={isImporting} />
          <ExportButton
            selectedIds={selectedRowKeys.length > 0 ? selectedRowKeys.map((key) => Number(key)) : []}
            apiEndpoint='/VehicleTypes/export'
            filename='VehicleType'
            loading={false}
            disabled={false}
          />
          <ActionSelect
            onAdd={handleAdd}
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

      <CustomTable<VehicleType>
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
            // Clear selection when pagination changes
            setSelectedRowKeys([])
            setSelectedRows([])
          }
        }}
      />

      <Modal
        title={editingId ? 'Sửa Loại xe' : 'Thêm mới Loại xe'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout='vertical'>
          <Form.Item name='code' label='Mã' rules={[{ required: true, message: 'Vui lòng nhập mã' }]}>
            <CodeInput disabled={!!editingId} />
          </Form.Item>
          <Form.Item name='name' label='Tên' rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name='description' label='Mô tả'>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name='status'
            label='Trạng thái'
            initialValue='A'
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <StatusSelect />
          </Form.Item>
        </Form>
      </Modal>

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

export default VehicleTypesPage
