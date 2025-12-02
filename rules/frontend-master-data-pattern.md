# Frontend Master Data Page Pattern

## Mục đích
File này mô tả pattern chuẩn để tạo các Master Data pages trong frontend. Pattern này dựa trên `VehicleTypesPage.tsx` đã được hoàn thiện.

## Cấu trúc Component

### 1. File Location
**Path:** `frontend/src/pages/master-data/{EntityName}Page.tsx`

### 2. Required Imports
```typescript
import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, message } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
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
import ImportErrorModal from '../../components/common/ImportErrorModal'
```

### 3. Interface Definitions

#### 3.1. Entity Interface
```typescript
interface {EntityName} {
  id: number
  code: string
  name: string
  description?: string
  status: string
  // ... other properties
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

### 4. State Management

#### 4.1. Required States
```typescript
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
const [selectedRows, setSelectedRows] = useState<{EntityName}[]>([])
const [isImporting, setIsImporting] = useState(false)
const [importErrors, setImportErrors] = useState<Array<{ row: number; message: string; field?: string }>>([])
const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
const queryClient = useQueryClient()
```

#### 4.2. Sync Debounced Search
```typescript
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
```

### 5. Advanced Filter Configuration

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
  },
  { key: 'filterDescription', label: 'Mô tả', type: 'text', placeholder: 'Nhập mô tả để lọc...' }
  // ... other filters
]
```

### 6. Data Fetching (useQuery)

```typescript
const { data, isLoading } = useQuery({
  queryKey: [
    '{entityName}s', // e.g., 'vehicleTypes'
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

**Note:** Controller name phải là PascalCase (e.g., `/VehicleTypes`, `/VehicleBrands`)

### 7. Mutations

#### 7.1. Create Mutation
```typescript
const createMutation = useMutation({
  mutationFn: async (values: any) => {
    const response = await api.post('/{EntityName}s', values)
    return response.data
  },
  onSuccess: () => {
    showSuccess('Tạo mới {entity-name} thành công!')
    setIsModalOpen(false)
    form.resetFields()
    queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
  },
  onError: (error: any) => {
    showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
  }
})
```

#### 7.2. Update Mutation
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, values }: { id: number; values: any }) => {
    const response = await api.put(`/{EntityName}s/${id}`, values)
    return response.data
  },
  onSuccess: () => {
    showSuccess('Cập nhật {entity-name} thành công!')
    setIsModalOpen(false)
    setEditingId(null)
    form.resetFields()
    queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
  },
  onError: (error: any) => {
    showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
  }
})
```

#### 7.3. Delete Mutation
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: number) => {
    await api.delete(`/{EntityName}s/${id}`)
  },
  onSuccess: () => {
    showSuccess('Xóa {entity-name} thành công!')
    queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
  },
  onError: () => {
    showError('Xóa thất bại. Vui lòng thử lại!')
  }
})
```

#### 7.4. Copy Mutation
```typescript
const copyMutation = useMutation({
  mutationFn: async (id: number) => {
    const response = await api.post(`/{EntityName}s/${id}/copy`)
    return response.data
  },
  onSuccess: () => {
    showSuccess('Tạo bản sao {entity-name} thành công!')
    queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
  },
  onError: () => {
    showError('Tạo bản sao thất bại. Vui lòng thử lại!')
  }
})
```

### 8. Event Handlers

#### 8.1. Handle Add
```typescript
const handleAdd = () => {
  setEditingId(null)
  form.resetFields()
  setIsModalOpen(true)
}
```

#### 8.2. Handle Edit
```typescript
const handleEdit = (record: {EntityName}) => {
  setEditingId(record.id)
  form.setFieldsValue(record)
  setIsModalOpen(true)
}
```

#### 8.3. Handle Delete
```typescript
const handleDelete = (id: number) => {
  deleteMutation.mutate(id)
}
```

#### 8.4. Handle Copy
```typescript
const handleCopy = (id: number) => {
  copyMutation.mutate(id)
}
```

#### 8.5. Handle Refresh
```typescript
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
  queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
}
```

#### 8.6. Handle Filter Change
```typescript
const handleFilterChange = (filters: Record<string, string | undefined>) => {
  setAdvancedFilters(filters)
  setPagination({ ...pagination, current: 1 })
}
```

#### 8.7. Handle Filter Clear
```typescript
const handleFilterClear = () => {
  setAdvancedFilters({})
  setPagination({ ...pagination, current: 1 })
}
```

#### 8.8. Handle Submit
```typescript
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
```

#### 8.9. Handle Table Sort
```typescript
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
```

#### 8.10. Handle Import
```typescript
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
      showSuccess('Import thành công!')
      queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
      setSelectedRowKeys([])
      setSelectedRows([])
    } else {
      // If there are validation errors
      if (response.data.errors && Array.isArray(response.data.errors)) {
        setImportErrors(response.data.errors)
        setIsErrorModalOpen(true)
        throw new Error('Import thất bại do lỗi validation')
      } else {
        throw new Error(response.data.message || 'Import thất bại')
      }
    }
  } catch (error: any) {
    // Check if error response contains validation errors
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      setImportErrors(error.response.data.errors)
      setIsErrorModalOpen(true)
    } else {
      showError(error.response?.data?.message || error.message || 'Import thất bại!')
    }
    throw error
  } finally {
    setIsImporting(false)
  }
}
```

#### 8.11. Handle Delete Multiple
```typescript
const handleDeleteMultiple = async () => {
  if (selectedRowKeys.length === 0) {
    showWarning('Vui lòng chọn ít nhất một dòng để xóa!')
    return
  }

  try {
    const ids = selectedRowKeys.map((key) => Number(key))
    await api.post('/{EntityName}s/bulk-delete', ids)
    showSuccess(`Đã xóa ${selectedRowKeys.length} {entity-name} thành công!`)
    setSelectedRowKeys([])
    setSelectedRows([])
    queryClient.invalidateQueries({ queryKey: ['{entityName}s'] })
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

### 9. Table Columns Definition

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
        <Button type='link' icon={<CopyOutlined />} onClick={() => handleCopy(record.id)} />
        <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(record.id)}>
          <Button type='link' danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )
  }
]
```

### 10. JSX Structure

```typescript
return (
  <div>
    {/* Header với Search và Action Buttons */}
    <div className='flex justify-between items-center mb-4'>
      <h1 className='text-2xl font-bold'>Quản lý {Entity Name}</h1>
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
          apiEndpoint='/{EntityName}s/export'
          filename='{entity-name}' // kebab-case, e.g., 'loai-xe'
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

    {/* Advanced Filter */}
    <AdvancedFilter
      filters={filterConfigs}
      onFilterChange={handleFilterChange}
      onClear={handleFilterClear}
      resetTrigger={filterResetTrigger}
    />

    {/* Custom Table */}
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
          // Clear selection when pagination changes
          setSelectedRowKeys([])
          setSelectedRows([])
        }
      }}
    />

    {/* Create/Edit Modal */}
    <Modal
      title={editingId ? 'Sửa {Entity Name}' : 'Thêm mới {Entity Name}'}
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
        {/* ... other form fields */}
      </Form>
    </Modal>

    {/* Import Error Modal */}
    <ImportErrorModal
      open={isErrorModalOpen}
      errors={importErrors}
      onClose={() => {
        setIsErrorModalOpen(false)
        setImportErrors([])
      }}
    />
  </div>
)
```

## Component Dependencies

### Required Components (đã có sẵn)
- `RefreshButton` - `frontend/src/components/common/RefreshButton.tsx`
- `AdvancedFilter` - `frontend/src/components/common/AdvancedFilter.tsx`
- `CustomTable` - `frontend/src/components/common/CustomTable.tsx`
- `StatusSelect` - `frontend/src/components/common/StatusSelect.tsx`
- `CodeInput` - `frontend/src/components/common/CodeInput.tsx`
- `ImportButton` - `frontend/src/components/common/ImportButton.tsx`
- `ExportButton` - `frontend/src/components/common/ExportButton.tsx`
- `ActionSelect` - `frontend/src/components/common/ActionSelect.tsx`
- `ImportErrorModal` - `frontend/src/components/common/ImportErrorModal.tsx`

### Required Hooks
- `useDebounce` - `frontend/src/hooks/useDebounce.ts`

### Required Utils
- `showSuccess`, `showError`, `showWarning` - `frontend/src/utils/notifications.ts`

## Notes

1. **API Endpoints:**
   - Controller names phải là PascalCase (e.g., `/VehicleTypes`, `/VehicleBrands`)
   - Base URL: `/api/{EntityName}s` (plural, PascalCase)

2. **Search:**
   - Sử dụng `useDebounce` cho search input (500ms delay)
   - Hỗ trợ search ngay khi nhấn Enter (không cần đợi debounce)
   - Search term được sync với `debouncedSearchTerm` qua `useEffect`

3. **Advanced Filter:**
   - Text filters: Apply khi nhấn Enter
   - Select filters: Apply ngay khi chọn
   - Reset filter khi nhấn Refresh button (qua `resetTrigger`)

4. **Table:**
   - Sử dụng `CustomTable` với column search, filter, sort
   - Hỗ trợ row selection (checkbox) cho bulk operations
   - Clear selection khi pagination thay đổi

5. **Form Fields:**
   - Code field: Sử dụng `CodeInput` (tự động uppercase), disabled khi edit
   - Status field: Sử dụng `StatusSelect`
   - Foreign key fields: Sử dụng `MasterDataSelect` (nếu có)
   - Enum fields: Sử dụng `StatusSelect` hoặc custom Select

6. **Import/Export:**
   - Import: Gửi file qua `FormData`, handle validation errors từ backend
   - Export: Gửi list IDs (empty = export all), download file từ response blob
   - Filename format: `{entity-name}_Export.xlsx` (kebab-case)

7. **Notifications:**
   - Sử dụng `react-toastify` qua `showSuccess`, `showError`, `showWarning`
   - Không sử dụng Ant Design `message` component

8. **Error Handling:**
   - Import errors: Hiển thị trong `ImportErrorModal`
   - API errors: Hiển thị message từ `error.response?.data?.message`
   - Fallback message nếu không có error message

9. **State Management:**
   - Sử dụng React Query (`useQuery`, `useMutation`) cho data fetching
   - Invalidate queries sau mỗi mutation để refetch data
   - Clear selection sau mỗi bulk operation

10. **Pagination:**
    - Reset về page 1 khi search, filter, hoặc sort thay đổi
    - Clear selection khi pagination thay đổi

