import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, DatePicker } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHasPermission } from '../../utils/permissions'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
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

interface Employee {
  id: number
  code: string
  fullName: string
  email: string
  phone: string
  address?: string
  position?: string
  department?: string
  hireDate?: string
  status: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const EmployeesPage = () => {
  const canCreate = useHasPermission('masterdata.create')
  const canEdit = useHasPermission('masterdata.edit')
  const canDelete = useHasPermission('masterdata.delete')
  const canImport = useHasPermission('masterdata.import')
  const canExport = useHasPermission('masterdata.export')
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
  const [selectedRows, setSelectedRows] = useState<Employee[]>([])
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
    { key: 'filterName', label: 'Họ tên', type: 'text', placeholder: 'Nhập họ tên để lọc...' },
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
      'employees',
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

      const response = await api.get<{ success: boolean; data: PagedResult<Employee> }>('/Employees', {
        params
      })
      return response.data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/Employees', values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới nhân viên thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/Employees/${id}`, values)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật nhân viên thành công!')
      setIsModalOpen(false)
      setEditingId(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/Employees/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa nhân viên thành công!')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
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

  const handleEdit = (record: Employee) => {
    setEditingId(record.id)
    const formValues = {
      ...record,
      hireDate: record.hireDate ? dayjs(record.hireDate) : undefined
    }
    form.setFieldsValue(formValues)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleCopy = (record: Employee) => {
    setEditingId(null)
    const formValues = {
      ...record,
      code: undefined,
      hireDate: record.hireDate ? dayjs(record.hireDate) : undefined
    }
    form.setFieldsValue(formValues)
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
    queryClient.invalidateQueries({ queryKey: ['employees'] })
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
      const submitValues = {
        ...values,
        hireDate: values.hireDate ? (values.hireDate as Dayjs).toISOString() : undefined
      }
      if (editingId) {
        updateMutation.mutate({ id: editingId, values: submitValues })
      } else {
        createMutation.mutate(submitValues)
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

      const response = await api.post('/Employees/import', formData, {
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
        queryClient.invalidateQueries({ queryKey: ['employees'] })
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
      await api.post('/Employees/bulk-delete', ids)
      showSuccess(`Đã xóa ${selectedRowKeys.length} nhân viên thành công!`)
      setSelectedRowKeys([])
      setSelectedRows([])
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        showError(axiosError.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
      } else {
        showError('Xóa thất bại. Vui lòng thử lại!')
      }
    }
  }

  const columns: (ColumnsType<Employee>[number] & { searchable?: boolean; filterable?: boolean })[] = [
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
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      searchable: true,
      filterable: false
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      searchable: true,
      filterable: false
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      searchable: true,
      filterable: false
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
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
        <h1 className='text-2xl font-bold'>Quản lý Nhân viên</h1>
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
              apiEndpoint='/Employees/export'
              filename='Employee'
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

      <CustomTable<Employee>
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
        title={editingId ? 'Sửa Nhân viên' : 'Thêm mới Nhân viên'}
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
          <Form.Item name='fullName' label='Họ tên' rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name='phone' label='Số điện thoại' rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input />
          </Form.Item>
          <Form.Item name='address' label='Địa chỉ'>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name='position' label='Chức vụ'>
            <Input />
          </Form.Item>
          <Form.Item name='department' label='Phòng ban'>
            <Input />
          </Form.Item>
          <Form.Item name='hireDate' label='Ngày vào làm'>
            <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
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

export default EmployeesPage

