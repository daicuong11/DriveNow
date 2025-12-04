import { useState, useRef, useEffect } from 'react'
import { Button, Space, Input, Modal, Form, Popconfirm, Badge, DatePicker, Radio, InputNumber } from 'antd'
import { showSuccess, showError } from '../../utils/notifications'
import { EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import RefreshButton from '../../components/common/RefreshButton'
import AdvancedFilter, { FilterConfig } from '../../components/common/AdvancedFilter'
import CustomTable from '../../components/common/CustomTable'
import useDebounce from '../../hooks/useDebounce'
import MasterDataSelect from '../../components/common/MasterDataSelect'
import ActionSelect from '../../components/common/ActionSelect'

const { TextArea } = Input

interface VehicleMaintenance {
  id: number
  vehicleId: number
  vehicleCode: string
  vehicleModel: string
  type: string
  startDate: string
  endDate?: string
  description: string
  cost?: number
  serviceProvider?: string
  status: string
}

interface PagedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const VehicleMaintenancesPage = () => {
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
        { label: 'Bảo dưỡng', value: 'Maintenance' },
        { label: 'Sửa chữa', value: 'Repair' }
      ],
      placeholder: 'Chọn loại...'
    },
    {
      key: 'filterStatus',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Đang thực hiện', value: 'InProgress' },
        { label: 'Hoàn thành', value: 'Completed' },
        { label: 'Đã hủy', value: 'Cancelled' }
      ],
      placeholder: 'Chọn trạng thái...'
    }
  ]

  const { data, isLoading } = useQuery({
    queryKey: [
      'vehicleMaintenances',
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
      if (advancedFilters.filterStatus) params.filterStatus = advancedFilters.filterStatus
      if (advancedFilters.filterVehicleId) params.filterVehicleId = advancedFilters.filterVehicleId

      if (sortBy) {
        params.sortBy = sortBy
        params.sortDescending = sortDescending
      }

      const response = await api.get<{ success: boolean; data: PagedResult<VehicleMaintenance> }>(
        '/VehicleMaintenances',
        {
          params
        }
      )
      return response.data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/VehicleMaintenances', {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Tạo mới bảo dưỡng/sửa chữa thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo mới thất bại. Vui lòng thử lại!')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const response = await api.put(`/VehicleMaintenances/${id}`, {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật bảo dưỡng/sửa chữa thành công!')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/VehicleMaintenances/${id}/complete`)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Hoàn thành bảo dưỡng/sửa chữa thành công!')
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Hoàn thành thất bại. Vui lòng thử lại!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/VehicleMaintenances/${id}`)
    },
    onSuccess: () => {
      showSuccess('Xóa bảo dưỡng/sửa chữa thành công!')
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'Maintenance',
      status: 'InProgress',
      startDate: dayjs()
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: VehicleMaintenance) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : dayjs(),
      endDate: record.endDate ? dayjs(record.endDate) : undefined
    })
    setIsModalOpen(true)
  }

  const handleComplete = (id: number) => {
    completeMutation.mutate(id)
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
    queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances'] })
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
    const typeMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' }> =
      {
        Maintenance: { text: 'Bảo dưỡng', color: 'processing' },
        Repair: { text: 'Sửa chữa', color: 'error' }
      }
    const typeInfo = typeMap[type] || { text: type, color: 'default' }
    return <Badge status={typeInfo.color} text={typeInfo.text} />
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: 'success' | 'error' | 'warning' | 'processing' | 'default' }> =
      {
        InProgress: { text: 'Đang thực hiện', color: 'processing' },
        Completed: { text: 'Hoàn thành', color: 'success' },
        Cancelled: { text: 'Đã hủy', color: 'default' }
      }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Badge status={statusInfo.color} text={statusInfo.text} />
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const columns: (ColumnsType<VehicleMaintenance>[number] & { searchable?: boolean; filterable?: boolean })[] = [
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
        { text: 'Bảo dưỡng', value: 'Maintenance' },
        { text: 'Sửa chữa', value: 'Repair' }
      ],
      render: (type: string) => formatType(type)
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: true,
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 150,
      render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-')
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      searchable: true,
      filterable: false,
      ellipsis: true
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'right',
      render: (cost?: number) => formatCurrency(cost)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filterable: true,
      filters: [
        { text: 'Đang thực hiện', value: 'InProgress' },
        { text: 'Hoàn thành', value: 'Completed' },
        { text: 'Đã hủy', value: 'Cancelled' }
      ],
      render: (status: string) => formatStatus(status)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status !== 'Completed' && (
            <Button
              type='link'
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record.id)}
              loading={completeMutation.isPending}
            >
              Hoàn thành
            </Button>
          )}
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
        <h1 className='text-2xl font-bold'>Quản lý Bảo dưỡng/Sửa chữa</h1>
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

      <CustomTable<VehicleMaintenance>
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
        title={editingId ? 'Sửa Bảo dưỡng/Sửa chữa' : 'Thêm mới Bảo dưỡng/Sửa chữa'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={700}
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
            <Radio.Group>
              <Radio value='Maintenance'>Bảo dưỡng</Radio>
              <Radio value='Repair'>Sửa chữa</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name='startDate' label='Ngày bắt đầu' rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}>
            <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' placeholder='Chọn ngày bắt đầu' />
          </Form.Item>
          <Form.Item name='endDate' label='Ngày kết thúc'>
            <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' placeholder='Chọn ngày kết thúc' />
          </Form.Item>
          <Form.Item name='description' label='Mô tả' rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
            <TextArea rows={4} placeholder='Nhập mô tả công việc' />
          </Form.Item>
          <Form.Item name='cost' label='Chi phí'>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder='Nhập chi phí'
            />
          </Form.Item>
          <Form.Item name='serviceProvider' label='Đơn vị thực hiện'>
            <Input placeholder='Nhập đơn vị thực hiện' />
          </Form.Item>
          <Form.Item name='status' label='Trạng thái' rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
            <Radio.Group>
              <Radio value='InProgress'>Đang thực hiện</Radio>
              <Radio value='Completed'>Hoàn thành</Radio>
              <Radio value='Cancelled'>Đã hủy</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VehicleMaintenancesPage

