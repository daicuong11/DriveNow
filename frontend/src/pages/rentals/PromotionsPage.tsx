import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, message, Radio, Switch } from 'antd'
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
import { validateCode } from '../../utils/validation'
import ImportButton from '../../components/common/ImportButton'
import ExportButton from '../../components/common/ExportButton'
import ActionSelect from '../../components/common/ActionSelect'
import ImportResultModal from '../../components/common/ImportResultModal'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import CurrencyInput from '../../components/common/CurrencyInput'
import NumberInput from '../../components/common/NumberInput'
import dayjs from 'dayjs'

interface Promotion {
  id: number
  code: string
  name: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit?: number
  usedCount: number
  status: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const PromotionsPage = () => {
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
  const [selectedRows, setSelectedRows] = useState<Promotion[]>([])
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
    queryKey: ['promotions', pagination.current, pagination.pageSize, searchTerm, advancedFilters, sortBy, sortDescending],
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

      const response = await api.get<{ success: boolean; data: PagedResult<Promotion> }>('/Promotions', {
        params
      })
      return response.data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/Promotions', {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới khuyến mãi thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/Promotions/${id}`, {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật khuyến mãi thành công!')
      setIsModalOpen(false)
      form.resetFields()
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/Promotions/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa khuyến mãi thành công!')
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'Percentage',
      status: 'A',
      startDate: dayjs(),
      endDate: dayjs().add(30, 'day')
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: Promotion) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  // Copy functionality - Open modal with copied data (code cleared)
  const handleCopy = async (id: number) => {
    try {
      const response = await api.get<{ success: boolean; data: Promotion }>(`/Promotions/${id}`)
      const promotionToCopy = response.data.data
      setEditingId(null)
      form.resetFields()
      form.setFieldsValue({
        ...promotionToCopy,
        code: '', // Clear code for new entry
        id: undefined, // Clear id
        usedCount: 0, // Reset used count
        startDate: promotionToCopy.startDate ? dayjs(promotionToCopy.startDate) : dayjs(),
        endDate: promotionToCopy.endDate ? dayjs(promotionToCopy.endDate) : dayjs().add(30, 'day')
      })
      setIsModalOpen(true)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể tải dữ liệu để copy. Vui lòng thử lại!')
    }
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

  const handleRefresh = () => {
    setSearchTerm('')
    setSearchInput('')
    searchInputRef.current = ''
    setAdvancedFilters({})
    setFilterResetTrigger((prev) => prev + 1)
    setSortBy(undefined)
    setSortDescending(false)
    setPagination({ current: 1, pageSize: pagination.pageSize })
    queryClient.invalidateQueries({ queryKey: ['promotions'] })
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
    return status === 'A' ? <Badge status='success' text='Hoạt động' /> : <Badge status='default' text='Không hoạt động' />
  }

  const formatType = (type: string) => {
    return type === 'Percentage' ? 'Phần trăm (%)' : 'Số tiền cố định'
  }

  const columns: (ColumnsType<Promotion>[number] & { searchable?: boolean; filterable?: boolean })[] = [
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
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => formatType(type)
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: Promotion) =>
        record.type === 'Percentage' ? `${value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: true,
      render: (text: string) => dayjs(text).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: true,
      render: (text: string) => dayjs(text).format('DD/MM/YYYY')
    },
    {
      title: 'Đã dùng',
      dataIndex: 'usedCount',
      key: 'usedCount',
      render: (usedCount: number, record: Promotion) => (
        <span>
          {usedCount} {record.usageLimit ? `/ ${record.usageLimit}` : ''}
        </span>
      )
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
          <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)} title='Sửa' />
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
        <h1 className='text-2xl font-bold'>Quản lý Khuyến mãi</h1>
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
          <ActionSelect onAdd={handleAdd} />
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<Promotion>
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

      <Modal
        title={editingId ? 'Sửa Khuyến mãi' : 'Thêm mới Khuyến mãi'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
          setEditingId(null)
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={700}
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='code'
            label='Mã'
            rules={[{ required: true, message: 'Vui lòng nhập mã' }, { validator: validateCode }]}
          >
            <CodeInput disabled={!!editingId} readOnly={!!editingId} />
          </Form.Item>
          <Form.Item name='name' label='Tên' rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder='Nhập tên khuyến mãi' />
          </Form.Item>
          <Form.Item name='type' label='Loại' rules={[{ required: true, message: 'Vui lòng chọn loại' }]}>
            <Radio.Group>
              <Radio value='Percentage'>Phần trăm (%)</Radio>
              <Radio value='FixedAmount'>Số tiền cố định</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name='value' label='Giá trị' rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}>
            <NumberInput placeholder='Nhập giá trị' min={0} />
          </Form.Item>
          <Form.Item name='minAmount' label='Đơn hàng tối thiểu'>
            <CurrencyInput placeholder='Nhập đơn hàng tối thiểu' />
          </Form.Item>
          <Form.Item
            name='maxDiscount'
            label='Giảm tối đa'
            dependencies={['type']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('type') === 'Percentage' && !value) {
                    return Promise.reject(new Error('Vui lòng nhập giảm tối đa cho loại phần trăm'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <CurrencyInput placeholder='Nhập giảm tối đa' />
          </Form.Item>
          <Form.Item
            name='startDate'
            label='Ngày bắt đầu'
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <CustomDatePicker />
          </Form.Item>
          <Form.Item
            name='endDate'
            label='Ngày kết thúc'
            rules={[
              { required: true, message: 'Vui lòng chọn ngày kết thúc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('startDate')) {
                    return Promise.resolve()
                  }
                  if (value.isBefore(getFieldValue('startDate'))) {
                    return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <CustomDatePicker />
          </Form.Item>
          <Form.Item name='usageLimit' label='Giới hạn sử dụng'>
            <NumberInput placeholder='Nhập giới hạn sử dụng' min={1} />
          </Form.Item>
          <Form.Item name='status' label='Trạng thái' rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
            <StatusSelect />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PromotionsPage
