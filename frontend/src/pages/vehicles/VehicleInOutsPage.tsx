import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, DatePicker } from 'antd'
import { showSuccess, showError, showWarning } from '../../utils/notifications'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import MasterDataSelect from '../../components/common/MasterDataSelect'
import ActionSelect from '../../components/common/ActionSelect'

const { TextArea } = Input

interface VehicleInOut {
  id: number
  vehicleId: number
  vehicleCode: string
  vehicleModel: string
  type: string
  date: string
  location?: string
  reason?: string
  employeeId: number
  employeeName: string
  notes?: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const VehicleInOutsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
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
      key: 'filterType',
      label: 'Loại',
      type: 'select',
      options: [
        { label: 'Nhập bãi', value: 'In' },
        { label: 'Xuất bãi', value: 'Out' }
      ],
      placeholder: 'Chọn loại...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: [
      'vehicleInOuts',
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

      if (advancedFilters.filterType) params.filterType = advancedFilters.filterType
      if (advancedFilters.filterVehicleId) params.filterVehicleId = advancedFilters.filterVehicleId
      if (advancedFilters.filterEmployeeId) params.filterEmployeeId = advancedFilters.filterEmployeeId

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<VehicleInOut> }>('/VehicleInOuts', {
        params
      })
      return response.data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/VehicleInOuts', {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString()
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới xuất/nhập bãi thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleInOuts'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/VehicleInOuts/${id}`, {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString()
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật xuất/nhập bãi thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleInOuts'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/VehicleInOuts/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa xuất/nhập bãi thành công!')
      queryClient.invalidateQueries({ queryKey: ['vehicleInOuts'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'Out',
      date: dayjs()
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: VehicleInOut) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : dayjs()
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
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
    queryClient.invalidateQueries({ queryKey: ['vehicleInOuts'] })
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

  const formatType = (type: string) => {
    const typeMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = {
      In: { text: 'Nhập bãi', color: 'success' },
      Out: { text: 'Xuất bãi', color: 'warning' }
    }
    const typeInfo = typeMap[type] || { text: type, color: 'default' }
    return <Badge status={typeInfo.color} text={typeInfo.text} />
  }

  const columns: (ColumnsType<VehicleInOut>[number] & { searchable?: boolean; filterable?: boolean })[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Biển số xe',
      dataIndex: 'vehicleCode',
      key: 'vehicleCode',
      sorter: true,
      searchable: true,
      filterable: false
    },
    {
      title: 'Model',
      dataIndex: 'vehicleModel',
      key: 'vehicleModel',
      searchable: true,
      filterable: false
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      filterable: true,
      filters: [
        { text: 'Nhập bãi', value: 'In' },
        { text: 'Xuất bãi', value: 'Out' }
      ],
      render: (type: string) => formatType(type)
    },
    {
      title: 'Ngày giờ',
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      width: 180,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      searchable: true,
      filterable: false
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      searchable: true,
      filterable: false
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
      searchable: true,
      filterable: false
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
        <h1 className='text-2xl font-bold'>Quản lý Xuất/Nhập Bãi</h1>
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
          <ActionSelect onAdd={handleAdd} onDelete={() => {}} deleteDisabled={true} />
        </Space>
      </div>

      <AdvancedFilter
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleFilterClear}
        resetTrigger={filterResetTrigger}
      />

      <CustomTable<VehicleInOut>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        rowKey='id'
        onSortChange={handleTableSort}
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

      <Modal
        title={editingId ? 'Sửa Xuất/Nhập Bãi' : 'Thêm mới Xuất/Nhập Bãi'}
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
          <Form.Item name='vehicleId' label='Xe' rules={[{ required: true, message: 'Vui lòng chọn xe' }]}>
            <MasterDataSelect
              apiEndpoint='/Vehicles'
              queryKey='vehicles'
              filterStatus='Available'
              placeholder='Chọn xe...'
            />
          </Form.Item>
          <Form.Item name='type' label='Loại' rules={[{ required: true, message: 'Vui lòng chọn loại' }]}>
            <Input.Group compact>
              <Form.Item name='type' noStyle>
                <Input.Group compact>
                  <Button.Group>
                    <Button
                      type={form.getFieldValue('type') === 'Out' ? 'primary' : 'default'}
                      onClick={() => form.setFieldsValue({ type: 'Out' })}
                    >
                      Xuất bãi
                    </Button>
                    <Button
                      type={form.getFieldValue('type') === 'In' ? 'primary' : 'default'}
                      onClick={() => form.setFieldsValue({ type: 'In' })}
                    >
                      Nhập bãi
                    </Button>
                  </Button.Group>
                </Input.Group>
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item name='date' label='Ngày giờ' rules={[{ required: true, message: 'Vui lòng chọn ngày giờ' }]}>
            <DatePicker
              showTime
              format='DD/MM/YYYY HH:mm'
              style={{ width: '100%' }}
              placeholder='Chọn ngày giờ'
            />
          </Form.Item>
          <Form.Item name='location' label='Địa điểm'>
            <Input placeholder='Nhập địa điểm' />
          </Form.Item>
          <Form.Item name='reason' label='Lý do'>
            <Input placeholder='Nhập lý do' />
          </Form.Item>
          <Form.Item name='employeeId' label='Nhân viên' rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}>
            <MasterDataSelect
              apiEndpoint='/Employees'
              queryKey='employees'
              filterStatus='A'
              placeholder='Chọn nhân viên...'
            />
          </Form.Item>
          <Form.Item name='notes' label='Ghi chú'>
            <TextArea rows={3} placeholder='Nhập ghi chú' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VehicleInOutsPage

