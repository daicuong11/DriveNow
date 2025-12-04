# Frontend ListView và Detail View/Edit Pattern

## Mục đích
File này mô tả pattern chuẩn để tạo các màn hình ListView và Detail View/Edit trong frontend. Pattern này dựa trên `VehiclesPage.tsx` và `VehicleDetailPage.tsx` đã được hoàn thiện.

---

## PHẦN 1: LISTVIEW PAGE PATTERN

### 1. File Location
**Path:** `frontend/src/pages/{module}/{EntityName}Page.tsx`

**Ví dụ:** `frontend/src/pages/vehicles/VehiclesPage.tsx`

### 2. Required Imports

```typescript
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
```

### 3. Interface Definitions

#### 3.1. Entity Interface
```typescript
interface {EntityName} {
  id: number
  code: string
  // ... other properties
  status: string
  // ... optional properties
}
```

#### 3.2. PagedResult Interface
```typescript
interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}
```

### 4. Component Structure

#### 4.1. State Management

```typescript
const {EntityName}Page = () => {
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
  const [selectedRows, setSelectedRows] = useState<{EntityName}[]>([])
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
```

#### 4.2. Search Term Sync

```typescript
useEffect(() => {
  if (searchInputRef.current !== '') {
    setSearchTerm(searchInputRef.current)
    searchInputRef.current = ''
  } else {
    setSearchTerm(debouncedSearchTerm)
  }
}, [debouncedSearchTerm])
```

#### 4.3. Filter Configurations

```typescript
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
  // ... other filters
]
```

#### 4.4. Data Fetching with React Query

```typescript
const { data, isLoading } = useQuery({
  queryKey: [
    '{entityName}',
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
    // ... other filters

    // Add sorting
    if (sortBy) {
      params.sortBy = sortBy
      params.sortDescending = sortDescending
    }

    const response = await api.get<{ success: boolean; data: PagedResult<{EntityName}> }>('/{EntityName}s', {
      params
    })
    return response.data.data
  }
})
```

#### 4.5. Mutations

```typescript
// Delete mutation
const deleteMutation = useMutation({
  mutationFn: async (id: number) => {
    await api.delete(`/{EntityName}s/${id}`)
  },
  onSuccess: () => {
    showSuccess('Xóa thành công!')
    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
  },
  onError: () => {
    showError('Xóa thất bại. Vui lòng thử lại!')
  }
})

// Delete multiple mutation
const handleDeleteMultiple = async () => {
  if (selectedRowKeys.length === 0) {
    showWarning('Vui lòng chọn ít nhất một dòng để xóa!')
    return
  }

  try {
    const ids = selectedRowKeys.map((key) => Number(key))
    await api.post('/{EntityName}s/bulk-delete', ids)
    showSuccess(`Đã xóa ${selectedRowKeys.length} bản ghi thành công!`)
    setSelectedRowKeys([])
    setSelectedRows([])
    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      showError(axiosError.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
    } else {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  }
}
```

#### 4.6. Event Handlers

```typescript
// View detail
const handleViewDetail = (id: number) => {
  navigate(`/{entityName}s/${id}`)
}

// Copy functionality - Navigate to new page with copied data
const handleCopy = async (id: number) => {
  try {
    const response = await api.get<{ success: boolean; data: {EntityName} }>(`/{EntityName}s/${id}`)
    const entityData = response.data.data
    
    // Remove code and id, keep other fields
    const { code, id: entityId, ...copyData } = entityData
    
    // Navigate to new entity creation page with copied data
    navigate('/{entityName}s/0', {
      state: {
        copyData: {
          ...copyData,
          code: '' // Clear code for new entry
        }
      }
    })
  } catch (error: any) {
    showError(error.response?.data?.message || 'Không thể tải dữ liệu để copy. Vui lòng thử lại!')
  }
}

// Delete
const handleDelete = (id: number) => {
  deleteMutation.mutate(id)
}

// Refresh
const handleRefresh = () => {
  setSearchTerm('')
  setSearchInput('')
  searchInputRef.current = ''
  setAdvancedFilters({})
  setFilterResetTrigger((prev) => prev + 1)
  setSortBy(undefined)
  setSortDescending(false)
  setPagination({ current: 1, pageSize: pagination.pageSize })
  queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
}

// Filter change
const handleFilterChange = (filters: Record<string, string | undefined>) => {
  setAdvancedFilters(filters)
  setPagination({ ...pagination, current: 1 })
}

// Filter clear
const handleFilterClear = () => {
  setAdvancedFilters({})
  setPagination({ ...pagination, current: 1 })
}

// Table sort
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

// Import Excel
const handleImport = async (file: File) => {
  setIsImporting(true)
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/{EntityName}s/import', formData, {
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
      queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
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
```

#### 4.7. Column Definitions

```typescript
const columns: (ColumnsType<{EntityName}>[number] & { searchable?: boolean; filterable?: boolean })[] = [
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
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    filterable: true,
    filters: [
      { text: 'Hoạt động', value: 'A' },
      { text: 'Không hoạt động', value: 'I' }
    ],
    render: (status: string) => formatStatus(status)
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
```

#### 4.8. Render Component

```typescript
return (
  <div>
    <div className='flex items-center justify-between mb-4'>
      <h1 className='text-2xl font-bold'>Quản lý {EntityDisplayName}</h1>
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
          apiEndpoint='/{EntityName}s/export'
          filename='{EntityName}'
          loading={false}
          disabled={false}
        />
        <ActionSelect
          onAdd={() => navigate('/{entityName}s/0')}
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

    <CustomTable<{EntityName}>
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
```

---

## PHẦN 2: DETAIL VIEW/EDIT PAGE PATTERN

### 1. File Location
**Path:** `frontend/src/pages/{module}/{EntityName}DetailPage.tsx`

**Ví dụ:** `frontend/src/pages/vehicles/VehicleDetailPage.tsx`

### 2. Required Imports

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Form, Input, InputNumber, DatePicker, Tabs, Space, Card, Row, Col, Divider, App } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { showSuccess, showError } from '../../utils/notifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import dayjs from 'dayjs'
import CodeInput from '../../components/common/CodeInput'
import { validateCode } from '../../utils/validation'
import RefreshButton from '../../components/common/RefreshButton'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import type { TabsProps } from 'antd'
// ... other custom components as needed
```

### 3. Interface Definitions

```typescript
interface {EntityName} {
  id: number
  code: string
  // ... other properties
  // Date fields should be strings from API
  registrationDate?: string
  insuranceExpiryDate?: string
  // ... other optional properties
}
```

### 4. Component Structure

#### 4.1. State Management

```typescript
const {EntityName}DetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { modal } = App.useApp() // Use App.useApp() instead of Modal.confirm
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('general')
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const numericId = id ? Number(id) : 0
  const isNew = numericId === 0
  const vehicleId = isNew ? null : numericId
  const queryClient = useQueryClient()

  // Get copy data from location state (if exists)
  const copyData = (location.state as { copyData?: {EntityName} })?.copyData
```

#### 4.2. Data Fetching

```typescript
// Fetch entity data
const {
  data: entity,
  isLoading,
  refetch: refetchEntity
} = useQuery({
  queryKey: ['{entityName}', vehicleId],
  queryFn: async () => {
    if (isNew || !vehicleId) return null
    const response = await api.get<{ success: boolean; data: {EntityName} }>(`/{EntityName}s/${vehicleId}`)
    return response.data.data
  },
  enabled: !isNew && !!vehicleId && vehicleId >= 1
})
```

#### 4.3. Form Initialization

```typescript
// Set form values when entity data is loaded or copied
useEffect(() => {
  if (entity && !isNew && vehicleId && vehicleId >= 1) {
    const formValues = {
      ...entity,
      // Convert string dates to dayjs objects
      registrationDate: entity.registrationDate ? dayjs(entity.registrationDate) : undefined,
      insuranceExpiryDate: entity.insuranceExpiryDate ? dayjs(entity.insuranceExpiryDate) : undefined
    }
    form.setFieldsValue(formValues)
    setInitialValues(formValues)
    setHasChanges(false)
  } else if (isNew) {
    if (copyData) {
      // Remove code and id from copy data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { code: _code, id: _id, ...restData } = copyData
      const formValues = {
        ...restData,
        code: '', // Clear code for new entry
        // Convert string dates to dayjs objects
        registrationDate: copyData.registrationDate ? dayjs(copyData.registrationDate) : undefined,
        insuranceExpiryDate: copyData.insuranceExpiryDate ? dayjs(copyData.insuranceExpiryDate) : undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
      navigate(location.pathname, { replace: true, state: {} }) // Clear copyData from state
    } else {
      // Default values for new entity
      const formValues = {
        status: 'Available', // or appropriate default
        // ... other default values
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
    }
  }
}, [entity, isNew, vehicleId, form, copyData, location.pathname, navigate])
```

#### 4.4. Unsaved Changes Tracking

```typescript
// Normalize function for comparing form values
const normalizeForCompare = useCallback((values: Record<string, any>) => {
  const normalized: Record<string, any> = {}
  Object.keys(values).forEach((key) => {
    const value = values[key]
    // Handle date fields
    if (key === 'registrationDate' || key === 'insuranceExpiryDate') {
      if (value && typeof value.format === 'function') {
        normalized[key] = value.format('YYYY-MM-DD')
      } else if (!value || value === '') {
        normalized[key] = null
      } else {
        normalized[key] = value
      }
    } else {
      normalized[key] = value
    }
  })
  return normalized
}, [])

// Track form changes using onValuesChange callback
const handleFormValuesChange = useCallback(
  (_changedValues: any, allValues: any) => {
    if (!initialValues || isNew) {
      return
    }

    const currentValues = allValues || form.getFieldsValue()
    const currentNormalized = normalizeForCompare(currentValues)
    const initialNormalized = normalizeForCompare(initialValues)
    const changed = JSON.stringify(currentNormalized) !== JSON.stringify(initialNormalized)

    setHasChanges(changed)
  },
  [form, initialValues, isNew, normalizeForCompare]
)
```

#### 4.5. Mutations

```typescript
// Create mutation
const createMutation = useMutation({
  mutationFn: async (values: any) => {
    const response = await api.post('/{EntityName}s', {
      ...values,
      // Convert dayjs dates to ISO strings
      registrationDate: values.registrationDate ? values.registrationDate.format('YYYY-MM-DD') : null,
      insuranceExpiryDate: values.insuranceExpiryDate ? values.insuranceExpiryDate.format('YYYY-MM-DD') : null
    })
    return response.data
  },
  onSuccess: (data) => {
    showSuccess('Tạo mới thành công!')
    setHasChanges(false)
    navigate(`/{entityName}s/${data.data.id}`)
    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
  },
  onError: (error: any) => {
    showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
  }
})

// Update mutation
const updateMutation = useMutation({
  mutationFn: async (values: any) => {
    if (!vehicleId || vehicleId < 1) throw new Error('Invalid entity ID')
    const response = await api.put(`/{EntityName}s/${vehicleId}`, {
      ...values,
      // Convert dayjs dates to ISO strings
      registrationDate: values.registrationDate ? values.registrationDate.format('YYYY-MM-DD') : null,
      insuranceExpiryDate: values.insuranceExpiryDate ? values.insuranceExpiryDate.format('YYYY-MM-DD') : null
    })
    return response.data
  },
  onSuccess: (data) => {
    showSuccess('Cập nhật thành công!')
    setHasChanges(false)
    // Update initial values with newly saved data
    const updatedEntity = data.data
    setInitialValues({
      ...updatedEntity,
      registrationDate: updatedEntity.registrationDate ? dayjs(updatedEntity.registrationDate) : undefined,
      insuranceExpiryDate: updatedEntity.insuranceExpiryDate ? dayjs(updatedEntity.insuranceExpiryDate) : undefined
    })
    queryClient.invalidateQueries({ queryKey: ['{entityName}', vehicleId] })
    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
  },
  onError: (error: any) => {
    showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
  }
})

// Delete mutation
const deleteMutation = useMutation({
  mutationFn: async () => {
    if (!vehicleId || vehicleId < 1) throw new Error('Invalid entity ID')
    await api.delete(`/{EntityName}s/${vehicleId}`)
  },
  onSuccess: () => {
    showSuccess('Xóa thành công!')
    setHasChanges(false)
    navigate('/{entityName}s')
    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
  },
  onError: () => {
    showError('Xóa thất bại. Vui lòng thử lại!')
  }
})
```

#### 4.6. Event Handlers

```typescript
// Submit handler
const handleSubmit = useCallback(async () => {
  try {
    const values = await form.validateFields()
    if (isNew) {
      createMutation.mutate(values)
    } else {
      updateMutation.mutate(values)
    }
  } catch (error) {
    console.error('Validation failed:', error)
  }
}, [form, isNew, createMutation, updateMutation])

// Copy handler
const handleCopy = async () => {
  if (!vehicleId || vehicleId < 1 || !entity) return

  // Get current entity data, remove code and id
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { code: _code, id: _id, ...copyData } = entity

  // Navigate to new entity creation page with copied data
  // Note: Keep dates as strings (not dayjs objects) for serialization
  navigate('/{entityName}s/0', {
    state: {
      copyData: {
        ...copyData,
        code: '',
        // Keep dates as strings
        registrationDate: copyData.registrationDate || undefined,
        insuranceExpiryDate: copyData.insuranceExpiryDate || undefined
      }
    }
  })
}

// Delete handler
const handleDelete = () => {
  if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
    deleteMutation.mutate()
  }
}

// Back handler with unsaved changes check
// Popup chỉ hiển thị khi hasChanges === true (có dấu (*) trong header)
const handleBack = () => {
  // Chỉ hiển thị popup khi có thay đổi (hasChanges === true, tức là có dấu (*))
  if (!isNew && vehicleId && hasChanges) {
    modal.confirm({
      title: 'Xác nhận',
      content: 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?',
      okText: 'Đồng ý',
      cancelText: 'Quay lại',
      onOk: () => {
        setHasChanges(false)
        navigate('/{entityName}s')
      },
      onCancel: () => {
        // User cancelled, stay on page
      }
    })
    return // Important: return to prevent immediate navigation
  }

  navigate('/{entityName}s')
}

// Refresh handler with unsaved changes check
// Popup chỉ hiển thị khi hasChanges === true (có dấu (*) trong header)
const [isRefreshing, setIsRefreshing] = useState(false)

const handleRefresh = async () => {
  if (isNew || !vehicleId) return

  // Chỉ hiển thị popup khi có thay đổi (hasChanges === true, tức là có dấu (*))
  if (hasChanges) {
    modal.confirm({
      title: 'Xác nhận',
      content: 'Dữ liệu đã bị thay đổi chưa lưu, bạn có muốn làm mới?',
      okText: 'Đồng ý',
      cancelText: 'Quay lại',
      onOk: async () => {
        setIsRefreshing(true)
        try {
          const result = await refetchEntity()

          if (result.data) {
            const updatedEntity = result.data
            const formValues = {
              ...updatedEntity,
              registrationDate: updatedEntity.registrationDate ? dayjs(updatedEntity.registrationDate) : undefined,
              insuranceExpiryDate: updatedEntity.insuranceExpiryDate ? dayjs(updatedEntity.insuranceExpiryDate) : undefined
            }
            form.setFieldsValue(formValues)
            setInitialValues(formValues)
            setHasChanges(false)
          }

          queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
          // Invalidate related queries if any
        } finally {
          setIsRefreshing(false)
        }
      },
      onCancel: () => {
        // User cancelled
      }
    })
    return // Important: return to prevent immediate refresh
  }

  // Không có thay đổi, refresh bình thường
  setIsRefreshing(true)
  try {
    const result = await refetchEntity()

    if (result.data) {
      const updatedEntity = result.data
      const formValues = {
        ...updatedEntity,
        registrationDate: updatedEntity.registrationDate ? dayjs(updatedEntity.registrationDate) : undefined,
        insuranceExpiryDate: updatedEntity.insuranceExpiryDate ? dayjs(updatedEntity.insuranceExpiryDate) : undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
    }

    queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
    // Invalidate related queries if any
  } finally {
    setIsRefreshing(false)
  }
}
```

#### 4.7. Keyboard Shortcuts

```typescript
// Keyboard shortcut: Ctrl+S to save
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSubmit()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}, [handleSubmit])
```

#### 4.8. Browser Refresh/Close Warning

```typescript
// Intercept browser refresh/close when there are unsaved changes
useEffect(() => {
  if (!hasChanges || isNew) return

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?'
    return e.returnValue
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, [hasChanges, isNew])
```

#### 4.9. Loading State

```typescript
// Calculate combined loading state
const isAnyLoading =
  isLoading || isRefreshing || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
```

#### 4.10. Tabs Structure

```typescript
const tabItems: TabsProps['items'] = [
  {
    key: 'general',
    label: 'Thông tin chung',
    children: (
      <Card>
        <Form form={form} layout='vertical' disabled={isLoading} onValuesChange={handleFormValuesChange}>
          <Row gutter={24}>
            {/* Form fields */}
            <Col span={12}>
              <Form.Item
                name='code'
                label='Mã'
                rules={[{ required: true, message: 'Vui lòng nhập mã' }, { validator: validateCode }]}
              >
                <CodeInput disabled={!isNew} readOnly={!isNew} />
              </Form.Item>
            </Col>
            {/* ... other form fields */}
          </Row>
        </Form>
      </Card>
    )
  },
  // Additional tabs only for existing entities (not new)
  ...(!isNew && vehicleId
    ? [
        {
          key: 'history',
          label: 'Lịch sử',
          children: <{EntityName}HistoryTab entityId={vehicleId} />
        }
        // ... other tabs
      ]
    : [])
]
```

#### 4.11. Render Component

```typescript
return (
  <div>
    {/* Loading Overlay */}
    <LoadingOverlay loading={isAnyLoading} tip='Đang xử lý dữ liệu...' />

    {/* Header */}
    <div className='flex items-center justify-between mb-6'>
      <div className='flex items-center gap-4'>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Quay lại
        </Button>
        <h1 className='m-0 text-2xl font-bold'>
          {isNew ? 'Thêm mới {EntityDisplayName}' : `Chi tiết {EntityDisplayName} - ${entity?.code || ''}${hasChanges ? ' (*)' : ''}`}
        </h1>
      </div>
      <Space>
        {!isNew && (
          <>
            <RefreshButton onRefresh={handleRefresh} loading={isRefreshing} />
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              Tạo bản sao
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMutation.isPending}>
              Xóa
            </Button>
          </>
        )}
        <Button
          type='primary'
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {isNew ? 'Tạo mới' : 'Lưu thay đổi'}
        </Button>
      </Space>
    </div>

    {/* Tabs */}
    <Tabs activeKey={activeTab} onChange={setActiveTab} type='card' size='large' items={tabItems} />
  </div>
)
```

---

## PHẦN 3: ROUTING CONFIGURATION

### 1. AppLayout.tsx

```typescript
// Route for list view
<Route path='/{entityName}s' element={<{EntityName}Page />} />

// Route for detail view/edit (id=0 means new, id>=1 means view/edit)
<Route path='/{entityName}s/:id' element={<{EntityName}DetailPage />} />
```

### 2. Navigation Pattern

- **New Entity:** Navigate to `/{entityName}s/0`
- **View/Edit Entity:** Navigate to `/{entityName}s/{id}` where `id >= 1`
- **Copy Entity:** Navigate to `/{entityName}s/0` with `location.state.copyData`

---

## PHẦN 4: BEST PRACTICES

### 1. Date Handling
- **API Response:** Dates are strings in ISO format (e.g., `"2024-01-01"`)
- **Form Values:** Convert to `dayjs` objects for DatePicker components
- **API Request:** Convert `dayjs` objects to ISO strings (e.g., `value.format('YYYY-MM-DD')`)
- **Copy Data:** Keep dates as strings in `location.state` (not `dayjs` objects) for serialization

### 2. Unsaved Changes Tracking
- Always compare normalized values (dates converted to strings) in `handleFormValuesChange`
- Use `onValuesChange` callback on Form component to update `hasChanges` state
- Show `(*)` in header when `hasChanges` is true
- **Popup confirm chỉ hiển thị khi `hasChanges === true`** (có dấu (*))
- **Không cần so sánh lại form values** trong `handleBack` và `handleRefresh`, chỉ kiểm tra `hasChanges` state
- Use `modal.confirm()` (from `App.useApp()`) instead of `Modal.confirm()` for context support
- Always `return` after showing confirm dialog to prevent immediate action

### 3. Loading States
- Use `LoadingOverlay` component for global loading indicator
- Combine all loading states: `isLoading`, `isRefreshing`, mutation pending states
- Show loading on buttons during mutations

### 4. Error Handling
- Always use `showError()` for user-facing error messages
- Extract error message from `error.response?.data?.message`
- Provide fallback error messages

### 5. Query Invalidation
- Invalidate list query after create/update/delete
- Invalidate detail query after update
- Invalidate related queries (e.g., history, sub-entities)

### 6. Code Validation
- Use `CodeInput` component for code fields
- Use `validateCode` validator from `utils/validation`
- Disable code input when editing (not new)

### 7. Modal Usage
- **ALWAYS** use `App.useApp()` hook to get `modal` instance
- **NEVER** use `Modal.confirm()` directly (causes context warning)
- Wrap app in `<AntApp>` component in `App.tsx`

### 8. Form Structure
- Use `layout='vertical'` for Form
- Group related fields with `Row` and `Col`
- Use `Divider` to separate sections
- Use `Card` to wrap form content in tabs

### 9. Custom Components
- Use `MasterDataSelect` for foreign key relationships
- Use `CodeInput` for code fields
- Use `StatusSelect` or custom status selects
- Use `CustomDatePicker` for dates
- Use `CurrencyInput` for currency fields
- Use `ImageUpload` for image uploads

### 10. TypeScript
- Define interfaces for all entities
- Use proper types for form values
- Avoid `any` types where possible
- Use type assertions only when necessary

---

## PHẦN 5: COMMON PATTERNS

### 1. Status Formatting

```typescript
const formatStatus = (status: string) => {
  const statusMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = {
    Available: { text: 'Có sẵn', color: 'success' },
    Rented: { text: 'Đang cho thuê', color: 'warning' },
    // ... other statuses
  }
  const statusInfo = statusMap[status] || { text: status, color: 'default' }
  return <Badge status={statusInfo.color} text={statusInfo.text} />
}
```

### 2. Currency Formatting

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
```

### 3. Date Formatting

```typescript
// In table columns
render: (text: string) => dayjs(text).format('DD/MM/YYYY')

// In form
<DatePicker format='DD/MM/YYYY' placeholder='Chọn ngày' />
```

---

## PHẦN 6: NOTES

1. **Routing:** Use `id=0` for new entity creation, `id>=1` for view/edit
2. **Copy Data:** Pass data via `location.state.copyData`, keep dates as strings
3. **Unsaved Changes:** Always normalize dates before comparing
4. **Modal:** Use `App.useApp()` hook, not `Modal.confirm()` directly
5. **Loading:** Use `LoadingOverlay` for global loading indicator
6. **Validation:** Use `CodeInput` and `validateCode` for code fields
7. **Error Handling:** Always provide user-friendly error messages
8. **Query Keys:** Use consistent query key patterns: `['{entityName}']`, `['{entityName}', id]`
9. **Form Values:** Convert dates to/from `dayjs` objects appropriately
10. **State Management:** Use React Query for server state, local state for UI state

---

## PHẦN 7: EXAMPLE USAGE

Khi cần tạo màn hình mới, thay thế:
- `{EntityName}` → Tên entity (PascalCase, singular)
- `{entityName}` → Tên entity (camelCase, singular)
- `{EntityDisplayName}` → Tên hiển thị (tiếng Việt)
- `/{EntityName}s` → API endpoint (plural)
- `/{entityName}s` → Route path (plural)

Ví dụ cho `Customer`:
- `{EntityName}` → `Customer`
- `{entityName}` → `customer`
- `{EntityDisplayName}` → `Khách hàng`
- `/{EntityName}s` → `/Customers`
- `/{entityName}s` → `/customers`

