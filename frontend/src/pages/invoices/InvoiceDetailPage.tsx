import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button, Form, Input, DatePicker, Tabs, Space, Card, Row, Col, Divider, App, Modal, Select, Tag, Table } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, CopyOutlined, DollarOutlined } from '@ant-design/icons'
import { showSuccess, showError } from '../../utils/notifications'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api/axios'
import dayjs from 'dayjs'
import RefreshButton from '../../components/common/RefreshButton'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import CurrencyInput from '../../components/common/CurrencyInput'
import type { TabsProps } from 'antd'
import PaymentHistoryTab from './components/PaymentHistoryTab'

const { TextArea } = Input

interface Invoice {
  id: number
  invoiceNumber: string
  rentalOrderId: number
  rentalOrderNumber: string
  customerId: number
  customerName: string
  customerPhone: string
  customerAddress?: string
  invoiceDate: string
  dueDate: string
  subTotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  notes?: string
  invoiceDetails: InvoiceDetail[]
}

interface InvoiceDetail {
  id: number
  invoiceId: number
  description: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

interface RentalOrder {
  id: number
  orderNumber: string
  customerName: string
  vehicleCode: string
  vehicleModel: string
  startDate: string
  endDate: string
  totalAmount: number
  status: string
}

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const numericId = id ? Number(id) : 0
  const invoiceId = numericId >= 1 ? numericId : null
  const queryClient = useQueryClient()

  // Get copy data from location state (if exists)
  const copyData = (location.state as { copyData?: Invoice })?.copyData

  // Fetch invoice data
  const {
    data: invoice,
    isLoading,
    refetch: refetchInvoice
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      const response = await api.get<{ success: boolean; data: Invoice }>(`/Invoices/${invoiceId}`)
      return response.data.data
    },
    enabled: !!invoiceId
  })

  // Fetch rental order data
  const { data: rentalOrder } = useQuery({
    queryKey: ['rentalOrder', invoice?.rentalOrderId],
    queryFn: async () => {
      if (!invoice?.rentalOrderId) return null
      const response = await api.get<{ success: boolean; data: RentalOrder }>(`/RentalOrders/${invoice.rentalOrderId}`)
      return response.data.data
    },
    enabled: !!invoice?.rentalOrderId
  })

  // Set form values when invoice data is loaded
  useEffect(() => {
    if (invoice && invoiceId) {
      const formValues = {
        ...invoice,
        invoiceDate: invoice.invoiceDate ? dayjs(invoice.invoiceDate) : undefined,
        dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
    } else if (copyData) {
      const formValues = {
        ...copyData,
        invoiceNumber: '',
        invoiceDate: dayjs(),
        dueDate: dayjs().add(7, 'day')
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [invoice, invoiceId, form, copyData, location.pathname, navigate])

  // Auto calculate tax and total when taxRate or discountAmount changes
  const taxRate = Form.useWatch('taxRate', form)
  const discountAmount = Form.useWatch('discountAmount', form)

  // Track form changes
  const handleFormValuesChange = useCallback(
    (_changedValues: any, allValues: any) => {
      if (!initialValues) return

      const currentValues = allValues || form.getFieldsValue()
      const currentNormalized = JSON.stringify(currentValues)
      const initialNormalized = JSON.stringify(initialValues)
      const changed = currentNormalized !== initialNormalized

      setHasChanges(changed)
    },
    [form, initialValues]
  )

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.put<{ success: boolean; data: Invoice }>(`/Invoices/${invoiceId}`, {
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        taxRate: values.taxRate,
        discountAmount: values.discountAmount,
        notes: values.notes
      })
      return response.data.data
    },
    onSuccess: (data) => {
      showSuccess('Cập nhật hóa đơn thành công!')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      const formValues = {
        ...data,
        invoiceDate: data.invoiceDate ? dayjs(data.invoiceDate) : undefined,
        dueDate: data.dueDate ? dayjs(data.dueDate) : undefined
      }
      form.setFieldsValue(formValues)
      setInitialValues(formValues)
      setHasChanges(false)
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Invoices/${invoiceId}`)
    },
    onSuccess: () => {
      showSuccess('Xóa hóa đơn thành công!')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/invoices')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại!')
    }
  })

  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean; data: Invoice }>(`/Invoices/${invoiceId}/copy`)
      return response.data.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo bản sao hóa đơn thành công!')
      navigate(`/invoices/${data.id}`)
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Tạo bản sao thất bại. Vui lòng thử lại!')
    }
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post<{ success: boolean; data: any }>('/Payments', {
        invoiceId: invoiceId,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        bankAccount: values.bankAccount || undefined,
        transactionCode: values.transactionCode || undefined,
        notes: values.notes || undefined
      })
      return response.data.data
    },
    onSuccess: () => {
      showSuccess('Thanh toán thành công!')
      setIsPaymentModalOpen(false)
      paymentForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoicePayments', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      refetchInvoice()
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại!')
    }
  })

  const handleSubmit = async () => {
    if (!invoiceId) return

    try {
      const values = await form.validateFields()
      updateMutation.mutate(values)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleDelete = () => {
    if (!invoiceId) return

    modal.confirm({
      title: 'Xác nhận',
      content: 'Bạn có chắc chắn muốn xóa hóa đơn này?',
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: () => {
        deleteMutation.mutate()
      }
    })
  }

  const handleCopy = () => {
    if (!invoiceId) return
    copyMutation.mutate()
  }

  const handlePayment = () => {
    if (!invoice) return

    // Set default values
    paymentForm.setFieldsValue({
      paymentDate: dayjs(),
      amount: invoice.remainingAmount > 0 ? invoice.remainingAmount : undefined,
      paymentMethod: 'Cash',
      bankAccount: undefined,
      transactionCode: undefined,
      notes: undefined
    })
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields()
      paymentMutation.mutate(values)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleBack = () => {
    if (invoiceId && hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi, bạn có muốn thoát?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: () => {
          setHasChanges(false)
          navigate('/invoices')
        }
      })
      return
    }
    navigate('/invoices')
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!invoiceId) return

    if (hasChanges) {
      modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu đã bị thay đổi chưa lưu, bạn có muốn làm mới?',
        okText: 'Đồng ý',
        cancelText: 'Quay lại',
        onOk: async () => {
          setIsRefreshing(true)
          try {
            const result = await refetchInvoice()
            if (result.data) {
              const updatedInvoice = result.data
              const formValues = {
                ...updatedInvoice,
                invoiceDate: updatedInvoice.invoiceDate ? dayjs(updatedInvoice.invoiceDate) : undefined,
                dueDate: updatedInvoice.dueDate ? dayjs(updatedInvoice.dueDate) : undefined
              }
              form.setFieldsValue(formValues)
              setInitialValues(formValues)
              setHasChanges(false)
              queryClient.invalidateQueries({ queryKey: ['invoicePayments', invoiceId] })
            }
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
          } finally {
            setIsRefreshing(false)
          }
        }
      })
      return
    }

    setIsRefreshing(true)
    try {
      const result = await refetchInvoice()
      if (result.data) {
        const updatedInvoice = result.data
        const formValues = {
          ...updatedInvoice,
          invoiceDate: updatedInvoice.invoiceDate ? dayjs(updatedInvoice.invoiceDate) : undefined,
          dueDate: updatedInvoice.dueDate ? dayjs(updatedInvoice.dueDate) : undefined
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        queryClient.invalidateQueries({ queryKey: ['invoicePayments', invoiceId] })
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate loading state
  const isAnyLoading =
    isLoading ||
    isRefreshing ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    copyMutation.isPending ||
    paymentMutation.isPending

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Format status
  const formatStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      Unpaid: { text: 'Chưa thanh toán', color: 'red' },
      Partial: { text: 'Thanh toán một phần', color: 'orange' },
      Paid: { text: 'Đã thanh toán đủ', color: 'green' },
      Overdue: { text: 'Quá hạn', color: 'volcano' },
      Cancelled: { text: 'Đã hủy', color: 'default' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  // Check if can edit
  const canEdit = invoice && (invoice.status === 'Unpaid' || invoice.status === 'Partial')

  // Tabs items
  const tabItems: TabsProps['items'] = [
    {
      key: 'general',
      label: 'Thông tin hóa đơn',
      children: (
        <Card>
          <Form form={form} layout='vertical' disabled={isLoading || !canEdit} onValuesChange={handleFormValuesChange}>
            <Row gutter={24}>
              <Col span={24}>
                <h3 className='mb-4 text-lg font-semibold'>Thông tin hóa đơn</h3>
              </Col>
              {invoice && (
                <>
                  <Col span={12}>
                    <Form.Item label='Số hóa đơn'>
                      <Input value={invoice.invoiceNumber} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Trạng thái'>{formatStatus(invoice.status)}</Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Số đơn thuê'>
                      <Input value={invoice.rentalOrderNumber} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Khách hàng'>
                      <Input value={invoice.customerName} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Số điện thoại'>
                      <Input value={invoice.customerPhone} disabled />
                    </Form.Item>
                  </Col>
                  {invoice.customerAddress && (
                    <Col span={12}>
                      <Form.Item label='Địa chỉ'>
                        <Input value={invoice.customerAddress} disabled />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={12}>
                    <Form.Item
                      name='invoiceDate'
                      label='Ngày xuất'
                      rules={[{ required: true, message: 'Vui lòng chọn ngày xuất' }]}
                    >
                      <CustomDatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name='dueDate'
                      label='Ngày đến hạn'
                      rules={[{ required: true, message: 'Vui lòng chọn ngày đến hạn' }]}
                    >
                      <CustomDatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Divider />
                    <h3 className='mb-4 text-lg font-semibold'>Chi tiết hóa đơn</h3>
                  </Col>
                  <Col span={24}>
                    <Table
                      dataSource={invoice.invoiceDetails}
                      rowKey='id'
                      pagination={false}
                      columns={[
                        {
                          title: 'STT',
                          key: 'index',
                          width: 60,
                          align: 'center',
                          render: (_, __, index) => index + 1
                        },
                        {
                          title: 'Mô tả',
                          dataIndex: 'description',
                          key: 'description'
                        },
                        {
                          title: 'Số lượng',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          align: 'right',
                          render: (qty) => qty.toLocaleString('vi-VN')
                        },
                        {
                          title: 'Đơn giá',
                          dataIndex: 'unitPrice',
                          key: 'unitPrice',
                          align: 'right',
                          render: (price) => formatCurrency(price)
                        },
                        {
                          title: 'Thành tiền',
                          dataIndex: 'amount',
                          key: 'amount',
                          align: 'right',
                          render: (amount) => formatCurrency(amount)
                        }
                      ]}
                    />
                  </Col>
                  <Col span={24}>
                    <Divider />
                    <h3 className='mb-4 text-lg font-semibold'>Tổng cộng</h3>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Tổng tiền (chưa VAT)'>
                      <Input value={formatCurrency(invoice.subTotal)} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name='discountAmount'
                      label='Giảm giá'
                      rules={[{ required: true, message: 'Vui lòng nhập số tiền giảm giá' }]}
                    >
                      <CurrencyInput />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name='taxRate'
                      label='Thuế suất VAT (%)'
                      rules={[{ required: true, message: 'Vui lòng nhập thuế suất' }]}
                    >
                      <Input type='number' min={0} max={100} step={0.01} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Số tiền thuế'>
                      <Input
                        value={formatCurrency(
                          invoice && taxRate
                            ? (invoice.subTotal + invoice.discountAmount - (discountAmount || 0)) * (taxRate / 100)
                            : invoice.taxAmount
                        )}
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Tổng tiền (sau VAT)'>
                      <Input
                        value={formatCurrency(
                          invoice && taxRate
                            ? (invoice.subTotal + invoice.discountAmount - (discountAmount || 0)) *
                                (1 + taxRate / 100)
                            : invoice.totalAmount
                        )}
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Đã thanh toán'>
                      <Input value={formatCurrency(invoice.paidAmount)} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label='Còn lại'>
                      <Input value={formatCurrency(invoice.remainingAmount)} disabled style={{ color: 'red', fontWeight: 'bold' }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name='notes' label='Ghi chú'>
                      <TextArea rows={4} placeholder='Nhập ghi chú' />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Form>
        </Card>
      )
    },
    ...(invoice && rentalOrder
      ? [
          {
            key: 'rental',
            label: 'Chi tiết đơn thuê',
            children: (
              <Card>
                <Row gutter={24}>
                  <Col span={12}>
                    <div>
                      <strong>Số đơn:</strong> {rentalOrder.orderNumber}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Khách hàng:</strong> {rentalOrder.customerName}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Xe:</strong> {rentalOrder.vehicleCode} - {rentalOrder.vehicleModel}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Ngày thuê:</strong> {dayjs(rentalOrder.startDate).format('DD/MM/YYYY')} -{' '}
                      {dayjs(rentalOrder.endDate).format('DD/MM/YYYY')}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Tổng tiền đơn thuê:</strong> {formatCurrency(rentalOrder.totalAmount)}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Trạng thái:</strong> {rentalOrder.status}
                    </div>
                  </Col>
                  <Col span={24}>
                    <Button type='link' onClick={() => navigate(`/rental-orders/${rentalOrder.id}`)}>
                      Xem chi tiết đơn thuê
                    </Button>
                  </Col>
                </Row>
              </Card>
            )
          }
        ]
      : []),
    ...(invoiceId
      ? [
          {
            key: 'payments',
            label: 'Lịch sử thanh toán',
            children: <PaymentHistoryTab invoiceId={invoiceId} />
          }
        ]
      : [])
  ]

  // Auto switch to payment tab if query param exists
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
      if (tab === 'payment') {
        handlePayment()
      }
    }
  }, [searchParams])

  return (
    <div>
      <LoadingOverlay loading={isAnyLoading} tip='Đang xử lý dữ liệu...' />

      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
          <h1 className='m-0 text-2xl font-bold'>
            {invoice ? `${invoice.invoiceNumber}${hasChanges ? ' (*)' : ''}` : 'Chi tiết Hóa đơn'}
          </h1>
        </div>
        <Space>
          {invoice && (
            <>
              <RefreshButton onRefresh={handleRefresh} loading={isRefreshing} />
              {canEdit && (
                <>
                  <Button icon={<SaveOutlined />} type='primary' onClick={handleSubmit} loading={updateMutation.isPending}>
                    Lưu
                  </Button>
                  {invoice.status === 'Unpaid' && (
                    <Button icon={<DeleteOutlined />} danger onClick={handleDelete} loading={deleteMutation.isPending}>
                      Xóa
                    </Button>
                  )}
                </>
              )}
              {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                <Button icon={<DollarOutlined />} type='primary' onClick={handlePayment}>
                  Thanh toán
                </Button>
              )}
              <Button icon={<CopyOutlined />} onClick={handleCopy} loading={copyMutation.isPending}>
                Tạo bản sao
              </Button>
            </>
          )}
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Payment Modal */}
      <Modal
        title='Thanh toán hóa đơn'
        open={isPaymentModalOpen}
        onOk={handlePaymentSubmit}
        onCancel={() => {
          setIsPaymentModalOpen(false)
          paymentForm.resetFields()
        }}
        confirmLoading={paymentMutation.isPending}
        width={600}
      >
        {invoice && (
          <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <strong>Số hóa đơn:</strong> {invoice.invoiceNumber}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <strong>Khách hàng:</strong> {invoice.customerName}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <strong>Tổng tiền:</strong> {formatCurrency(invoice.totalAmount)}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <strong>Đã thanh toán:</strong> {formatCurrency(invoice.paidAmount)}
                </div>
              </Col>
              <Col span={24}>
                <div style={{ color: 'red', fontWeight: 'bold' }}>
                  <strong>Còn lại:</strong> {formatCurrency(invoice.remainingAmount)}
                </div>
              </Col>
            </Row>
          </div>
        )}
        <Form form={paymentForm} layout='vertical'>
          <Form.Item
            name='paymentDate'
            label='Ngày thanh toán'
            rules={[{ required: true, message: 'Vui lòng chọn ngày thanh toán' }]}
          >
            <CustomDatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name='amount'
            label='Số tiền'
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              {
                validator: (_, value) => {
                  if (value && invoice && value > invoice.remainingAmount) {
                    return Promise.reject(new Error(`Số tiền không được vượt quá ${formatCurrency(invoice.remainingAmount)}`))
                  }
                  if (value && value <= 0) {
                    return Promise.reject(new Error('Số tiền phải lớn hơn 0'))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <CurrencyInput />
          </Form.Item>
          <Form.Item
            name='paymentMethod'
            label='Phương thức thanh toán'
            rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
          >
            <Select>
              <Select.Option value='Cash'>Tiền mặt</Select.Option>
              <Select.Option value='BankTransfer'>Chuyển khoản</Select.Option>
              <Select.Option value='CreditCard'>Thẻ tín dụng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.paymentMethod !== currentValues.paymentMethod}>
            {({ getFieldValue }) => {
              const paymentMethod = getFieldValue('paymentMethod')
              return (
                <>
                  {paymentMethod === 'BankTransfer' && (
                    <Form.Item name='bankAccount' label='Tài khoản ngân hàng'>
                      <Input placeholder='Nhập tài khoản ngân hàng' />
                    </Form.Item>
                  )}
                  {(paymentMethod === 'BankTransfer' || paymentMethod === 'CreditCard') && (
                    <Form.Item name='transactionCode' label='Mã giao dịch'>
                      <Input placeholder='Nhập mã giao dịch' />
                    </Form.Item>
                  )}
                </>
              )
            }}
          </Form.Item>
          <Form.Item name='notes' label='Ghi chú'>
            <TextArea rows={3} placeholder='Nhập ghi chú' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InvoiceDetailPage

