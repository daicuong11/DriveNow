import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Form, Input, DatePicker, Tabs, Space, Card, Row, Col, Divider, App, InputNumber, Tag } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, CopyOutlined, CheckOutlined, PlayCircleOutlined, StopOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { showSuccess, showError } from '../../utils/notifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import dayjs from 'dayjs'
import MasterDataSelect from '../../components/common/MasterDataSelect'
import RefreshButton from '../../components/common/RefreshButton'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import CurrencyInput from '../../components/common/CurrencyInput'
import type { TabsProps } from 'antd'
import RentalStatusHistoryTab from './components/RentalStatusHistoryTab'
import useDebounce from '../../hooks/useDebounce'
import { Alert } from 'antd'

const { TextArea } = Input

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

interface Vehicle {
  id: number
  code: string
  model: string
  dailyRentalPrice: number
  status: string
}

interface CalculatePriceResponse {
  dailyRentalPrice: number
  totalDays: number
  subTotal: number
  discountAmount: number
  totalAmount: number
  promotionMessage?: string
}

const RentalOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('general')
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [priceInfo, setPriceInfo] = useState<CalculatePriceResponse | null>(null)
  const [promotionInput, setPromotionInput] = useState<string>('')
  const debouncedPromotionCode = useDebounce(promotionInput, 500)
  const numericId = id ? Number(id) : 0
  const isNew = numericId === 0
  const orderId = isNew ? null : numericId
  const queryClient = useQueryClient()

  // Get copy data from location state (if exists)
  const copyData = (location.state as { copyData?: RentalOrder })?.copyData

  // Fetch rental order data
  const {
    data: rentalOrder,
    isLoading,
    refetch: refetchOrder
  } = useQuery({
    queryKey: ['rentalOrder', orderId],
    queryFn: async () => {
      if (isNew || !orderId) return null
      const response = await api.get<{ success: boolean; data: RentalOrder }>(`/RentalOrders/${orderId}`)
      return response.data.data
    },
    enabled: !isNew && !!orderId && orderId >= 1
  })

  // Fetch available vehicles
  const { data: availableVehicles } = useQuery({
    queryKey: ['availableVehicles'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Vehicle[] }>('/Vehicles/available')
      return response.data.data
    }
  })

  // Calculate price when vehicle, dates, or promotion code changes
  const calculatePrice = useCallback(async (promotionCode?: string) => {
    const vehicleId = form.getFieldValue('vehicleId')
    const startDate = form.getFieldValue('startDate')
    const endDate = form.getFieldValue('endDate')
    const codeToUse = promotionCode !== undefined ? promotionCode : form.getFieldValue('promotionCode')

    if (!vehicleId || !startDate || !endDate) {
      setPriceInfo(null)
      return
    }

    try {
      const response = await api.post<{ success: boolean; data: CalculatePriceResponse }>('/RentalOrders/calculate-price', {
        vehicleId,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        promotionCode: codeToUse && codeToUse.trim() ? codeToUse.trim() : undefined
      })

      const priceData = response.data.data
      setPriceInfo(priceData)

      // Update form fields
      form.setFieldsValue({
        dailyRentalPrice: priceData.dailyRentalPrice,
        totalDays: priceData.totalDays,
        subTotal: priceData.subTotal,
        discountAmount: priceData.discountAmount,
        totalAmount: priceData.totalAmount,
        promotionCode: codeToUse && codeToUse.trim() ? codeToUse.trim() : undefined
      })
    } catch (error: any) {
      console.error('Error calculating price:', error)
      setPriceInfo(null)
    }
  }, [form])

  // Set form values when rental order data is loaded or copied
  useEffect(() => {
    if (rentalOrder && !isNew && orderId && orderId >= 1) {
      const formValues = {
        ...rentalOrder,
        startDate: rentalOrder.startDate ? dayjs(rentalOrder.startDate) : undefined,
        endDate: rentalOrder.endDate ? dayjs(rentalOrder.endDate) : undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
      setPromotionInput(rentalOrder.promotionCode || '')
    } else if (isNew) {
      if (copyData) {
        // Remove orderNumber and id from copy data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { orderNumber: _orderNumber, id: _id, ...restData } = copyData
        const formValues = {
          ...restData,
          orderNumber: '', // Clear orderNumber for new entry
          status: 'Draft', // Reset status to Draft
          actualStartDate: undefined, // Clear actual dates
          actualEndDate: undefined,
          // Convert string dates to dayjs objects
          startDate: copyData.startDate ? dayjs(copyData.startDate) : dayjs(),
          endDate: copyData.endDate ? dayjs(copyData.endDate) : dayjs().add(1, 'day')
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        setPromotionInput(copyData.promotionCode || '')
        navigate(location.pathname, { replace: true, state: {} }) // Clear copyData from state
      } else {
        const formValues = {
          status: 'Draft',
          startDate: dayjs(),
          endDate: dayjs().add(1, 'day'),
          depositAmount: 0,
          discountAmount: 0
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        setPromotionInput('')
      }
    }
  }, [rentalOrder, isNew, orderId, form, copyData, location.pathname, navigate])

  // Track form changes
  const handleFormValuesChange = useCallback(
    (_changedValues: any, allValues: any) => {
      if (!initialValues || isNew) {
        return
      }

      const currentValues = allValues || form.getFieldsValue()
      const currentNormalized = JSON.stringify(currentValues)
      const initialNormalized = JSON.stringify(initialValues)
      const changed = currentNormalized !== initialNormalized

      setHasChanges(changed)
    },
    [form, initialValues, isNew]
  )

  // Watch form values for auto calculate (only for new orders)
  const vehicleId = Form.useWatch('vehicleId', form)
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)

  // Auto calculate when vehicle or dates change (for new orders or Draft status)
  useEffect(() => {
    const canEdit = isNew || rentalOrder?.status === 'Draft'
    if (canEdit && vehicleId && startDate && endDate && dayjs.isDayjs(startDate) && dayjs.isDayjs(endDate)) {
      calculatePrice(debouncedPromotionCode || undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, startDate, endDate, isNew, rentalOrder?.status])

  // Auto calculate when debounced promotion code changes (for new orders or Draft status)
  useEffect(() => {
    const canEdit = isNew || rentalOrder?.status === 'Draft'
    if (canEdit && vehicleId && startDate && endDate && dayjs.isDayjs(startDate) && dayjs.isDayjs(endDate)) {
      calculatePrice(debouncedPromotionCode || undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPromotionCode, isNew, rentalOrder?.status])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/RentalOrders', {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo đơn thuê thành công!')
      setHasChanges(false)
      navigate(`/rental-orders/${data.data.id}`)
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo đơn thuê thất bại. Vui lòng thử lại!')
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.put(`/RentalOrders/${orderId}`, {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Cập nhật đơn thuê thành công!')
      setHasChanges(false)
      const updatedOrder = data.data
      setInitialValues({
        ...updatedOrder,
        startDate: updatedOrder.startDate ? dayjs(updatedOrder.startDate) : undefined,
        endDate: updatedOrder.endDate ? dayjs(updatedOrder.endDate) : undefined
      })
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  // Workflow mutations
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.post(`/RentalOrders/${orderId}/confirm`)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Xác nhận đơn thuê thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Xác nhận thất bại. Vui lòng thử lại!')
    }
  })

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.post(`/RentalOrders/${orderId}/start`)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Bắt đầu đơn thuê thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Bắt đầu thất bại. Vui lòng thử lại!')
    }
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.post(`/RentalOrders/${orderId}/complete`)
      return response.data
    },
    onSuccess: () => {
      showSuccess('Hoàn thành đơn thuê thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Hoàn thành thất bại. Vui lòng thử lại!')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: async (reason?: string) => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.post(`/RentalOrders/${orderId}/cancel`, { reason })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Hủy đơn thuê thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Hủy thất bại. Vui lòng thử lại!')
    }
  })

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      const response = await api.post(`/Invoices/from-rental/${orderId}`, {
        invoiceDate: dayjs().format('YYYY-MM-DD'),
        dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        taxRate: 10,
        notes: undefined
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo hóa đơn thành công!')
      queryClient.invalidateQueries({ queryKey: ['rentalOrder', orderId] })
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      // Navigate to invoice detail page
      if (data?.data?.id) {
        navigate(`/invoices/${data.data.id}`)
      }
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo hóa đơn thất bại. Vui lòng thử lại!')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || orderId < 1) throw new Error('Invalid order ID')
      await api.delete(`/RentalOrders/${orderId}`)
    },
    onSuccess: () => {
      showSuccess('Xóa đơn thuê thành công!')
      setHasChanges(false)
      navigate('/rental-orders')
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    },
    onError: () => {
      showError('Xóa thất bại. Vui lòng thử lại!')
    }
  })

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

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn thuê này?')) {
      deleteMutation.mutate()
    }
  }

  // Copy handler
  const handleCopy = async () => {
    if (!orderId || orderId < 1 || !rentalOrder) return

    // Get current rental order data, remove orderNumber and id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orderNumber: _orderNumber, id: _id, ...copyData } = rentalOrder

    // Navigate to new rental order creation page with copied data
    // Note: Keep dates as strings (not dayjs objects) for serialization
    navigate('/rental-orders/0', {
      state: {
        copyData: {
          ...copyData,
          orderNumber: '',
          status: 'Draft',
          actualStartDate: undefined,
          actualEndDate: undefined,
          // Keep dates as strings
          startDate: copyData.startDate || undefined,
          endDate: copyData.endDate || undefined
        }
      }
    })
  }

  const handleBack = () => {
    if (!isNew && orderId && hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: () => {
          setHasChanges(false)
          navigate('/rental-orders')
        },
        onCancel: () => {
          // User cancelled
        }
      })
      return
    }

    navigate('/rental-orders')
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isNew || !orderId) return

    if (hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi chưa lưu, bạn có muốn làm mới?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: async () => {
          setIsRefreshing(true)
          try {
            const result = await refetchOrder()
            if (result.data) {
              const updatedOrder = result.data
              const formValues = {
                ...updatedOrder,
                startDate: updatedOrder.startDate ? dayjs(updatedOrder.startDate) : undefined,
                endDate: updatedOrder.endDate ? dayjs(updatedOrder.endDate) : undefined
              }
              form.setFieldsValue(formValues)
              setInitialValues(formValues)
              setHasChanges(false)
              setPromotionInput(updatedOrder.promotionCode || '')
              // Invalidate history query to reload history tab
              if (orderId) {
                queryClient.invalidateQueries({ queryKey: ['rentalStatusHistory', orderId] })
              }
            }
            queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
          } finally {
            setIsRefreshing(false)
          }
        },
        onCancel: () => {
          // User cancelled
        }
      })
      return
    }

    setIsRefreshing(true)
    try {
      const result = await refetchOrder()
      if (result.data) {
        const updatedOrder = result.data
        const formValues = {
          ...updatedOrder,
          startDate: updatedOrder.startDate ? dayjs(updatedOrder.startDate) : undefined,
          endDate: updatedOrder.endDate ? dayjs(updatedOrder.endDate) : undefined
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        setPromotionInput(updatedOrder.promotionCode || '')
        // Invalidate history query to reload history tab
        if (orderId) {
          queryClient.invalidateQueries({ queryKey: ['rentalStatusHistory', orderId] })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['rentalOrders'] })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate loading state
  const isAnyLoading =
    isLoading ||
    isRefreshing ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    confirmMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending ||
    createInvoiceMutation.isPending

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

  // Browser refresh/close warning
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

  // Get workflow buttons based on status
  const getWorkflowButtons = () => {
    if (!rentalOrder) return null

    const buttons = []

    if (rentalOrder.status === 'Draft') {
      buttons.push(
        <Button
          key='confirm'
          type='primary'
          icon={<CheckOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'Xác nhận',
              content: 'Bạn có chắc chắn muốn xác nhận đơn thuê này?',
              onOk: () => confirmMutation.mutate()
            })
          }}
          loading={confirmMutation.isPending}
        >
          Xác nhận
        </Button>
      )
    }

    if (rentalOrder.status === 'Confirmed') {
      buttons.push(
        <Button
          key='start'
          type='primary'
          icon={<PlayCircleOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'Xác nhận',
              content: 'Bạn có chắc chắn khách đã nhận xe?',
              onOk: () => startMutation.mutate()
            })
          }}
          loading={startMutation.isPending}
        >
          Bắt đầu
        </Button>
      )
    }

    if (rentalOrder.status === 'InProgress') {
      buttons.push(
        <Button
          key='complete'
          type='primary'
          icon={<StopOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'Xác nhận',
              content: 'Bạn có chắc chắn khách đã trả xe?',
              onOk: () => completeMutation.mutate()
            })
          }}
          loading={completeMutation.isPending}
        >
          Hoàn thành
        </Button>
      )
    }

    if (rentalOrder.status === 'Completed') {
      buttons.push(
        <Button
          key='createInvoice'
          type='primary'
          icon={<FileTextOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'Xác nhận',
              content: 'Bạn có chắc chắn muốn tạo hóa đơn cho đơn thuê này?',
              onOk: () => createInvoiceMutation.mutate()
            })
          }}
          loading={createInvoiceMutation.isPending}
        >
          Xuất hóa đơn
        </Button>
      )
    }

    if (rentalOrder.status !== 'Cancelled' && rentalOrder.status !== 'Invoiced') {
      buttons.push(
        <Button
          key='cancel'
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'Xác nhận',
              content: 'Bạn có chắc chắn muốn hủy đơn thuê này?',
              onOk: () => cancelMutation.mutate()
            })
          }}
          loading={cancelMutation.isPending}
        >
          Hủy đơn
        </Button>
      )
    }

    return buttons.length > 0 ? <Space>{buttons}</Space> : null
  }

  // Tabs items
  const tabItems: TabsProps['items'] = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <Card>
          <Form form={form} layout='vertical' disabled={isLoading} onValuesChange={handleFormValuesChange}>
            <Row gutter={24}>
              <Col span={24}>
                <h3 className='mb-4 text-lg font-semibold'>Thông tin đơn thuê</h3>
              </Col>
              {!isNew && rentalOrder && (
                <Col span={24}>
                  <Form.Item label='Số đơn'>
                    <Input value={rentalOrder.orderNumber} disabled />
                  </Form.Item>
                </Col>
              )}
              <Col span={12}>
                <Form.Item
                  name='customerId'
                  label='Khách hàng'
                  rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
                >
                  <MasterDataSelect apiEndpoint='/Customers' queryKey='customers' filterStatus='A' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='vehicleId'
                  label='Xe'
                  rules={[{ required: true, message: 'Vui lòng chọn xe' }]}
                >
                  <MasterDataSelect
                    apiEndpoint='/Vehicles'
                    queryKey='vehicles'
                    filterStatus='Available'
                    disabled={!isNew && rentalOrder?.status !== 'Draft'}
                    onChange={() => {
                      if (isNew || rentalOrder?.status === 'Draft') {
                        calculatePrice(debouncedPromotionCode || undefined)
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='employeeId'
                  label='Nhân viên'
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
                >
                  <MasterDataSelect apiEndpoint='/Employees' queryKey='employees' filterStatus='A' />
                </Form.Item>
              </Col>
              {form.getFieldValue('vehicleId') && availableVehicles && (
                <Col span={24}>
                  <Card size='small' style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <div>
                          <strong>Biển số:</strong> {availableVehicles.find((v) => v.id === form.getFieldValue('vehicleId'))?.code}
                        </div>
                      </Col>
                      <Col span={8}>
                        <div>
                          <strong>Model:</strong> {availableVehicles.find((v) => v.id === form.getFieldValue('vehicleId'))?.model}
                        </div>
                      </Col>
                      <Col span={8}>
                        <div>
                          <strong>Giá thuê/ngày:</strong>{' '}
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            availableVehicles.find((v) => v.id === form.getFieldValue('vehicleId'))?.dailyRentalPrice || 0
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}
              <Col span={12}>
                <Form.Item
                  name='startDate'
                  label='Ngày bắt đầu'
                  rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                >
                  <CustomDatePicker
                    disabled={!isNew && rentalOrder?.status !== 'Draft'}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    onChange={() => {
                      calculatePrice()
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
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
                  <CustomDatePicker
                    disabled={!isNew && rentalOrder?.status !== 'Draft'}
                    disabledDate={(current) => {
                      const startDate = form.getFieldValue('startDate')
                      return current && startDate && current < startDate.startOf('day')
                    }}
                    onChange={() => {
                      calculatePrice()
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='pickupLocation'
                  label='Địa điểm nhận xe'
                  rules={[{ required: true, message: 'Vui lòng nhập địa điểm nhận xe' }]}
                >
                  <Input placeholder='Nhập địa điểm nhận xe' disabled={!isNew && rentalOrder?.status !== 'Draft'} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='returnLocation'
                  label='Địa điểm trả xe'
                  rules={[{ required: true, message: 'Vui lòng nhập địa điểm trả xe' }]}
                >
                  <Input placeholder='Nhập địa điểm trả xe' disabled={!isNew && rentalOrder?.status !== 'Draft'} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider />
                <h3 className='mb-4 text-lg font-semibold'>Thông tin giá</h3>
              </Col>
              <Col span={8}>
                <Form.Item name='dailyRentalPrice' label='Giá thuê/ngày'>
                  <CurrencyInput disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='totalDays' label='Số ngày'>
                  <InputNumber disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='subTotal' label='Tổng tiền (chưa giảm)'>
                  <CurrencyInput disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='promotionCode' label='Mã khuyến mãi' help={priceInfo?.promotionMessage}>
                  <Input
                    placeholder='Nhập mã khuyến mãi'
                    disabled={!isNew && rentalOrder?.status !== 'Draft'}
                    value={promotionInput}
                    onChange={(e) => {
                      setPromotionInput(e.target.value)
                      form.setFieldsValue({ promotionCode: e.target.value })
                    }}
                    onBlur={() => {
                      form.setFieldsValue({ promotionCode: debouncedPromotionCode })
                    }}
                  />
                  {priceInfo?.promotionMessage && promotionInput.trim() && (
                    <div style={{ marginTop: 8 }}>
                      {priceInfo.promotionMessage.includes('hợp lệ') ? (
                        <Alert
                          message={priceInfo.promotionMessage}
                          type='success'
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      ) : (
                        <Alert
                          message={priceInfo.promotionMessage}
                          type='error'
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='discountAmount' label='Số tiền giảm'>
                  <CurrencyInput disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='totalAmount' label='Tổng tiền (sau giảm)'>
                  <CurrencyInput disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='depositAmount' label='Tiền cọc'>
                  <CurrencyInput disabled={!isNew && rentalOrder?.status !== 'Draft'} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider />
                <h3 className='mb-4 text-lg font-semibold'>Thông tin khác</h3>
              </Col>
              {!isNew && rentalOrder && (
                <Col span={24}>
                  <Form.Item label='Trạng thái'>
                    <Tag color={rentalOrder.status === 'Draft' ? 'default' : rentalOrder.status === 'Confirmed' ? 'blue' : rentalOrder.status === 'InProgress' ? 'orange' : rentalOrder.status === 'Completed' ? 'green' : rentalOrder.status === 'Invoiced' ? 'purple' : 'red'}>
                      {rentalOrder.status === 'Draft'
                        ? 'Nháp'
                        : rentalOrder.status === 'Confirmed'
                          ? 'Đã xác nhận'
                          : rentalOrder.status === 'InProgress'
                            ? 'Đang cho thuê'
                            : rentalOrder.status === 'Completed'
                              ? 'Đã hoàn thành'
                              : rentalOrder.status === 'Invoiced'
                                ? 'Đã xuất hóa đơn'
                                : 'Đã hủy'}
                    </Tag>
                  </Form.Item>
                </Col>
              )}
              <Col span={24}>
                <Form.Item name='notes' label='Ghi chú'>
                  <TextArea rows={4} placeholder='Nhập ghi chú' disabled={!isNew && rentalOrder?.status !== 'Draft'} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      )
    },
    ...(!isNew && orderId
      ? [
          {
            key: 'history',
            label: 'Lịch sử thay đổi trạng thái',
            children: <RentalStatusHistoryTab rentalOrderId={orderId} />
          }
        ]
      : [])
  ]

  return (
    <div>
      <LoadingOverlay loading={isAnyLoading} tip='Đang xử lý dữ liệu...' />

      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
          <h1 className='m-0 text-2xl font-bold'>
            {isNew ? 'Thêm mới Đơn thuê' : `${rentalOrder?.orderNumber || ''}${hasChanges ? ' (*)' : ''}`}
          </h1>
        </div>
        <Space>
          {!isNew && (
            <>
              <RefreshButton onRefresh={handleRefresh} loading={isRefreshing} />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                Tạo bản sao
              </Button>
              {rentalOrder?.status === 'Draft' && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMutation.isPending}>
                  Xóa
                </Button>
              )}
              {getWorkflowButtons()}
            </>
          )}
          {(!isNew && rentalOrder?.status === 'Draft') || isNew ? (
            <Button
              type='primary'
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isNew ? 'Lưu nháp' : 'Lưu thay đổi'}
            </Button>
          ) : null}
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type='card' size='large' items={tabItems} />
    </div>
  )
}

export default RentalOrderDetailPage
