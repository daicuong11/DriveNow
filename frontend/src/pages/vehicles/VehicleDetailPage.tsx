import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Form, Input, InputNumber, DatePicker, Tabs, Space, Card, Row, Col, Divider, App } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { showSuccess, showError } from '../../utils/notifications'
import { getErrorMessage } from '../../utils/errorHandler'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHasPermission } from '../../utils/permissions'
import api from '../../services/api/axios'
import dayjs from 'dayjs'
import CodeInput from '../../components/common/CodeInput'
import { validateCode } from '../../utils/validation'
import MasterDataSelect from '../../components/common/MasterDataSelect'
import VehicleStatusSelect from '../../components/common/VehicleStatusSelect'
import FuelTypeSelect from '../../components/common/FuelTypeSelect'
import ImageUpload from '../../components/common/ImageUpload'
import RefreshButton from '../../components/common/RefreshButton'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import VehicleRentalsTab from './components/VehicleRentalsTab'
import VehicleMaintenanceTab from './components/VehicleMaintenanceTab'
import VehicleInOutTab from './components/VehicleInOutTab'
import VehicleHistoryTab from './components/VehicleHistoryTab'
import type { TabsProps } from 'antd'

const { TextArea } = Input

interface Vehicle {
  id: number
  code: string
  vehicleTypeId: number
  vehicleTypeName: string
  vehicleBrandId: number
  vehicleBrandName: string
  vehicleColorId: number
  vehicleColorName: string
  model: string
  year: number
  seatCount: number
  fuelType: string
  licensePlate: string
  chassisNumber?: string
  engineNumber?: string
  registrationDate?: string
  insuranceExpiryDate?: string
  status: string
  currentLocation?: string
  dailyRentalPrice: number
  imageUrl?: string
  description?: string
}

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { modal } = App.useApp()
  const canCreate = useHasPermission('vehicles.create')
  const canDelete = useHasPermission('vehicles.delete')
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('general')
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const numericId = id ? Number(id) : 0
  const isNew = numericId === 0
  const vehicleId = isNew ? null : numericId
  const queryClient = useQueryClient()

  // Lấy dữ liệu copy từ location state (nếu có)
  const copyData = (location.state as { copyData?: Vehicle })?.copyData

  // Fetch vehicle data
  const {
    data: vehicle,
    isLoading,
    refetch: refetchVehicle
  } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (isNew || !vehicleId) return null
      const response = await api.get<{ success: boolean; data: Vehicle }>(`/Vehicles/${vehicleId}`)
      return response.data.data
    },
    enabled: !isNew && !!vehicleId && vehicleId >= 1
  })

  // Set form values when vehicle data is loaded
  useEffect(() => {
    if (vehicle && !isNew && vehicleId && vehicleId >= 1) {
      const formValues = {
        ...vehicle,
        registrationDate: vehicle.registrationDate ? dayjs(vehicle.registrationDate) : undefined,
        insuranceExpiryDate: vehicle.insuranceExpiryDate ? dayjs(vehicle.insuranceExpiryDate) : undefined
      }
      form.setFieldsValue(formValues)
      // Lưu initial values để so sánh
      setInitialValues(formValues)
      setHasChanges(false)
    } else if (isNew) {
      // Nếu có copyData từ location state, sử dụng dữ liệu đó (trừ code)
      if (copyData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { code: _code, id: _id, ...restData } = copyData
        const formValues = {
          ...restData,
          code: '', // Code để trống
          registrationDate: copyData.registrationDate ? dayjs(copyData.registrationDate) : undefined,
          insuranceExpiryDate: copyData.insuranceExpiryDate ? dayjs(copyData.insuranceExpiryDate) : undefined
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
        // Clear location state sau khi đã sử dụng
        navigate(location.pathname, { replace: true, state: {} })
      } else {
        const formValues = {
          status: 'Available',
          year: new Date().getFullYear(),
          seatCount: 4,
          fuelType: 'Xăng',
          dailyRentalPrice: 0,
          imageUrl: undefined
        }
        form.setFieldsValue(formValues)
        setInitialValues(formValues)
        setHasChanges(false)
      }
    }
  }, [vehicle, isNew, vehicleId, form, copyData, location.pathname, navigate])

  // Track form changes - sử dụng onValuesChange callback
  const handleFormValuesChange = useCallback(
    (_changedValues: any, allValues: any) => {
      if (!initialValues || isNew) {
        console.log('handleFormValuesChange - skipped:', { initialValues: !!initialValues, isNew })
        return
      }

      // Lấy giá trị hiện tại từ form (sử dụng allValues từ callback)
      const currentValues = allValues || form.getFieldsValue()

      // So sánh giá trị hiện tại với initial values
      // Normalize dates để so sánh chính xác
      const normalizeForCompare = (values: Record<string, any>) => {
        const normalized: Record<string, any> = {}
        // Copy tất cả fields và normalize dates
        Object.keys(values).forEach((key) => {
          const value = values[key]
          if (key === 'registrationDate' || key === 'insuranceExpiryDate') {
            // Convert dayjs objects to ISO strings for comparison
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
      }

      const currentNormalized = normalizeForCompare(currentValues)
      const initialNormalized = normalizeForCompare(initialValues)
      const changed = JSON.stringify(currentNormalized) !== JSON.stringify(initialNormalized)

      // Debug log
      console.log('handleFormValuesChange - changed:', changed)
      console.log('Current keys:', Object.keys(currentNormalized))
      console.log('Initial keys:', Object.keys(initialNormalized))

      setHasChanges(changed)
    },
    [form, initialValues, isNew]
  )

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/Vehicles', {
        ...values,
        registrationDate: values.registrationDate ? values.registrationDate.format('YYYY-MM-DD') : null,
        insuranceExpiryDate: values.insuranceExpiryDate ? values.insuranceExpiryDate.format('YYYY-MM-DD') : null
      })
      return response.data
    },
    onSuccess: (data) => {
      showSuccess('Tạo mới xe thành công!')
      // Reset hasChanges trước khi navigate
      setHasChanges(false)
      navigate(`/vehicles/${data.data.id}`)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Tạo mới thất bại. Vui lòng thử lại!'))
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!vehicleId || vehicleId < 1) throw new Error('Invalid vehicle ID')
      const response = await api.put(`/Vehicles/${vehicleId}`, {
        ...values,
        registrationDate: values.registrationDate ? values.registrationDate.format('YYYY-MM-DD') : null,
        insuranceExpiryDate: values.insuranceExpiryDate ? values.insuranceExpiryDate.format('YYYY-MM-DD') : null
      })
      return response.data
    },
    onSuccess: () => {
      showSuccess('Cập nhật xe thành công!')
      // Reset hasChanges sau khi lưu thành công
      setHasChanges(false)
      // Cập nhật initial values
      refetchVehicle().then((result) => {
        if (result.data) {
          const formValues = {
            ...result.data,
            registrationDate: result.data.registrationDate ? dayjs(result.data.registrationDate) : undefined,
            insuranceExpiryDate: result.data.insuranceExpiryDate ? dayjs(result.data.insuranceExpiryDate) : undefined
          }
          setInitialValues(formValues)
        }
      })
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: any) => {
      showError(getErrorMessage(error, 'Cập nhật thất bại. Vui lòng thử lại!'))
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId || vehicleId < 1) throw new Error('Invalid vehicle ID')
      await api.delete(`/Vehicles/${vehicleId}`)
    },
    onSuccess: () => {
      showSuccess('Xóa xe thành công!')
      navigate('/vehicles')
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: () => {
      showError(getErrorMessage(error, 'Xóa thất bại. Vui lòng thử lại!'))
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

  const handleCopy = async () => {
    if (!vehicleId || vehicleId < 1 || !vehicle) return

    // Lấy dữ liệu vehicle hiện tại, bỏ code và id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { code: _code, id: _id, ...copyData } = vehicle

    // Navigate đến màn hình tạo mới với dữ liệu copy
    // Lưu ý: Chuyển dayjs objects thành string để có thể serialize qua location.state
    navigate('/vehicles/0', {
      state: {
        copyData: {
          ...copyData,
          code: '', // Code để trống
          // Giữ nguyên string dates (không convert sang dayjs vì không thể serialize)
          registrationDate: copyData.registrationDate || undefined,
          insuranceExpiryDate: copyData.insuranceExpiryDate || undefined
        }
      }
    })
  }

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
      deleteMutation.mutate()
    }
  }

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
          navigate('/vehicles')
        },
        onCancel: () => {
          // User cancelled, stay on page
        }
      })
      return // Quan trọng: return để không navigate ngay
    }

    navigate('/vehicles')
  }

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
            // Refetch vehicle data và đợi nó hoàn thành
            const result = await refetchVehicle()

            // Cập nhật form trực tiếp với data mới từ refetch
            if (result.data) {
              const updatedVehicle = result.data
              const formValues = {
                ...updatedVehicle,
                registrationDate: updatedVehicle.registrationDate ? dayjs(updatedVehicle.registrationDate) : undefined,
                insuranceExpiryDate: updatedVehicle.insuranceExpiryDate
                  ? dayjs(updatedVehicle.insuranceExpiryDate)
                  : undefined
              }
              form.setFieldsValue(formValues)
              // Cập nhật initial values và reset hasChanges
              setInitialValues(formValues)
              setHasChanges(false)
            }

            // Invalidate các queries liên quan khác (các tab)
            queryClient.invalidateQueries({ queryKey: ['vehicles'] })
            queryClient.invalidateQueries({ queryKey: ['vehicleHistory', vehicleId] })
            queryClient.invalidateQueries({ queryKey: ['vehicleInOuts', vehicleId] })
            queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances', vehicleId] })
            queryClient.invalidateQueries({ queryKey: ['vehicleRentalHistory', vehicleId] })
          } finally {
            setIsRefreshing(false)
          }
        },
        onCancel: () => {
          // User cancelled
        }
      })
      return // Quan trọng: return để không refresh ngay
    }

    // Không có thay đổi, refresh bình thường
    setIsRefreshing(true)
    try {
      // Refetch vehicle data và đợi nó hoàn thành
      const result = await refetchVehicle()

      // Cập nhật form trực tiếp với data mới từ refetch
      if (result.data) {
        const updatedVehicle = result.data
        const formValues = {
          ...updatedVehicle,
          registrationDate: updatedVehicle.registrationDate ? dayjs(updatedVehicle.registrationDate) : undefined,
          insuranceExpiryDate: updatedVehicle.insuranceExpiryDate
            ? dayjs(updatedVehicle.insuranceExpiryDate)
            : undefined
        }
        form.setFieldsValue(formValues)
        // Cập nhật initial values
        setInitialValues(formValues)
        setHasChanges(false)
      }

      // Invalidate các queries liên quan khác (các tab)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicleHistory', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicleInOuts', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenances', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicleRentalHistory', vehicleId] })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Tính toán loading state tổng hợp
  const isAnyLoading =
    isLoading || isRefreshing || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Keyboard shortcut: Ctrl+S để lưu (tạo mới hoặc cập nhật)
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

  // Tabs items
  const tabItems: TabsProps['items'] = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <Card>
          <Form form={form} layout='vertical' disabled={isLoading} onValuesChange={handleFormValuesChange}>
            <Row gutter={24}>
              {/* Thông tin cơ bản */}
              <Col span={24}>
                <h3 className='mb-4 text-lg font-semibold'>Thông tin cơ bản</h3>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='code'
                  label='Biển số xe'
                  rules={[{ required: true, message: 'Vui lòng nhập biển số' }, { validator: validateCode }]}
                >
                  <CodeInput disabled={!isNew} readOnly={!isNew} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='licensePlate'
                  label='Biển số đăng ký'
                  rules={[{ required: true, message: 'Vui lòng nhập biển số đăng ký' }]}
                >
                  <Input placeholder='Nhập biển số đăng ký' />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name='vehicleTypeId'
                  label='Loại xe'
                  rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
                >
                  <MasterDataSelect apiEndpoint='/VehicleTypes' queryKey='vehicleTypes' filterStatus='A' />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name='vehicleBrandId'
                  label='Hãng xe'
                  rules={[{ required: true, message: 'Vui lòng chọn hãng xe' }]}
                >
                  <MasterDataSelect apiEndpoint='/VehicleBrands' queryKey='vehicleBrands' filterStatus='A' />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name='vehicleColorId'
                  label='Màu xe'
                  rules={[{ required: true, message: 'Vui lòng chọn màu xe' }]}
                >
                  <MasterDataSelect apiEndpoint='/VehicleColors' queryKey='vehicleColors' filterStatus='A' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='model' label='Model' rules={[{ required: true, message: 'Vui lòng nhập model' }]}>
                  <Input placeholder='VD: Camry 2023' />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name='year' label='Năm sản xuất' rules={[{ required: true, message: 'Vui lòng nhập năm' }]}>
                  <InputNumber min={1900} max={2100} style={{ width: '100%' }} placeholder='Năm' />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name='seatCount'
                  label='Số chỗ ngồi'
                  rules={[{ required: true, message: 'Vui lòng nhập số chỗ' }]}
                >
                  <InputNumber min={2} max={50} style={{ width: '100%' }} placeholder='Số chỗ' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='fuelType'
                  label='Loại nhiên liệu'
                  rules={[{ required: true, message: 'Vui lòng chọn loại nhiên liệu' }]}
                >
                  <FuelTypeSelect />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='dailyRentalPrice'
                  label='Giá thuê/ngày'
                  rules={[{ required: true, message: 'Vui lòng nhập giá thuê' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    placeholder='Nhập giá thuê'
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider />
                <h3 className='mb-4 text-lg font-semibold'>Thông tin đăng ký</h3>
              </Col>
              <Col span={12}>
                <Form.Item name='chassisNumber' label='Số khung'>
                  <Input placeholder='Nhập số khung' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='engineNumber' label='Số máy'>
                  <Input placeholder='Nhập số máy' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='registrationDate' label='Ngày đăng ký'>
                  <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' placeholder='Chọn ngày đăng ký' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='insuranceExpiryDate' label='Ngày hết hạn bảo hiểm'>
                  <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' placeholder='Chọn ngày hết hạn' />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider />
                <h3 className='mb-4 text-lg font-semibold'>Thông tin khác</h3>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='status'
                  label='Trạng thái'
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <VehicleStatusSelect />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='currentLocation' label='Vị trí hiện tại'>
                  <Input placeholder='Nhập vị trí' />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name='description' label='Mô tả'>
                  <TextArea rows={4} placeholder='Nhập mô tả' />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name='imageUrl' label='Hình ảnh' valuePropName='value' getValueFromEvent={(url) => url}>
                  <ImageUpload
                    action={`${import.meta.env.VITE_API_URL || '/api'}/Vehicles/upload-image`}
                    maxSize={5}
                    maxCount={1}
                    onChange={(url) => {
                      form.setFieldsValue({ imageUrl: url })
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      )
    },
    ...(!isNew && vehicleId
      ? [
          {
            key: 'rentals',
            label: 'Lịch sử cho thuê',
            children: <VehicleRentalsTab vehicleId={vehicleId} />
          },
          {
            key: 'maintenance',
            label: 'Bảo dưỡng/Sửa chữa',
            children: <VehicleMaintenanceTab vehicleId={vehicleId} />
          },
          {
            key: 'inout',
            label: 'Xuất/Nhập bãi',
            children: <VehicleInOutTab vehicleId={vehicleId} />
          },
          {
            key: 'history',
            label: 'Lịch sử',
            children: <VehicleHistoryTab vehicleId={vehicleId} />
          }
        ]
      : [])
  ]

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
            {isNew ? 'Thêm mới Xe' : `Chi tiết Xe - ${vehicle?.code || ''}${hasChanges ? ' (*)' : ''}`}
          </h1>
        </div>
        <Space>
          {!isNew && (
            <>
              <RefreshButton onRefresh={handleRefresh} loading={isRefreshing} />
              {canCreate && (
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  Tạo bản sao
                </Button>
              )}
              {canDelete && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMutation.isPending}>
                  Xóa
                </Button>
              )}
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
}

export default VehicleDetailPage
