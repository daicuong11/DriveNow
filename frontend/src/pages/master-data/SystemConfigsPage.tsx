import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHasPermission } from '../../utils/permissions'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import StatusSelect from '../../components/common/StatusSelect'
import CodeInput from '../../components/common/CodeInput'
import { validateCode } from '../../utils/validation'
import ImportButton from '../../components/common/ImportButton'
import ExportButton from '../../components/common/ExportButton'
import ActionSelect from '../../components/common/ActionSelect'
import ImportResultModal from '../../components/common/ImportResultModal'

interface SystemConfig {
  id: number
  code: string
  name: string
  value?: string
  description?: string
  category?: string
  status: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const SystemConfigsPage = () => {
  const canCreate = useHasPermission('system.edit')
  const canEdit = useHasPermission('system.edit')
  const canDelete = useHasPermission('system.edit')
  const canImport = useHasPermission('system.edit')
  const canExport = useHasPermission('system.edit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchTerm = useDebounce(searchInput, 500)
  const searchInputRef = useRef<string>('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string | undefined>>({})
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDescending, setSortDescending] = useState(false)
  const [filterResetTrigger, setFilterResetTrigger] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<SystemConfig[]>([])
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
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: [
      'systemConfigs',
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

      if (advancedFilters.filterCode) params.filterCode = advancedFilters.filterCode
      if (advancedFilters.filterName) params.filterName = advancedFilters.filterName
      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<SystemConfig> }>('/SystemConfigs', {
        params
      })
      return response.data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/SystemConfigs', values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới cấu hình hệ thống thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/SystemConfigs/${id}`, values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật cấu hình hệ thống thành công!')
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/SystemConfigs/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa cấu hình hệ thống thành công!')
      queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
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

  const handleEdit = (record: SystemConfig) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleCopy = (record: SystemConfig) => {
    setEditingId(null)
    form.setFieldsValue({ ...record, code: undefined })
    setIsModalOpen(true)
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
    queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
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

  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/SystemConfigs/import', formData, {
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
        queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
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
          message: error.response.data.message || 'Import thất bại',
          totalRows: error.response.data.totalRows,
          successCount: 0,
          errors: error.response.data.errors
        })
      } else {
        showError(error.response?.data?.message || error.message || 'Import thất bại!')
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
      await api.post('/SystemConfigs/bulk-delete', ids)
      showSuccess(`Đã xóa ${selectedRowKeys.length} cấu hình hệ thống thành công!`)
      setSelectedRowKeys([])
      setSelectedRows([])
      queryClient.invalidateQueries({ queryKey: ['systemConfigs'] })
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        showError(axiosError.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
      } else {
        showError('Xóa thất bại. Vui lòng thử lại!')
      }
    }
  }

  const columns: (ColumnsType<SystemConfig>[number] & { searchable?: boolean; filterable?: boolean })[] = [
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
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      searchable: true,
      filterable: false
    },
    {
      title: 'Nhóm',
      dataIndex: 'category',
      key: 'category',
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
          {canEdit && <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)} />}
          {canCreate && <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record)} />}
          {canDelete && (
            <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
              <Button type='link' danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold'>Quản lý Cấu hình hệ thống</h1>
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
          {canImport && <ImportButton onImport={handleImport} loading={isImporting} />}
          {canExport && (
            <ExportButton
              selectedIds={selectedRowKeys.length > 0 ? selectedRowKeys.map((key) => Number(key)) : []}
              apiEndpoint='/SystemConfigs/export'
              filename='SystemConfig'
              loading={false}
              disabled={false}
            />
          )}
          {(canCreate || canDelete) && (
            <ActionSelect
              onAdd={canCreate ? handleAdd : undefined}
              onDelete={canDelete ? handleDeleteMultiple : undefined}
              deleteDisabled={selectedRowKeys.length === 0}
            />
          )}
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<SystemConfig>
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

      <Modal
        title={editingId ? 'Sửa Cấu hình hệ thống' : 'Thêm mới Cấu hình hệ thống'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='code'
            label='Mã'
            rules={[
              { required: true, message: 'Vui lòng nhập mã' },
              { validator: validateCode }
            ]}
          >
            <CodeInput disabled={!!editingId} />
          </Form.Item>
          <Form.Item name='name' label='Tên' rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name='value' label='Giá trị'>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name='description' label='Mô tả'>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name='category' label='Nhóm'>
            <Input />
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
        onClose={() => setImportResult({ ...importResult, open: false })}
        success={importResult.success}
        message={importResult.message}
        totalRows={importResult.totalRows}
        successCount={importResult.successCount}
        errors={importResult.errors}
      />
    </div>
  )
}

export default SystemConfigsPage

