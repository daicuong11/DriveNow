import { Select } from 'antd'
import type { SelectProps } from 'antd/es/select'

interface VehicleStatusSelectProps extends Omit<SelectProps, 'options'> {}

const VehicleStatusSelect = ({ ...selectProps }: VehicleStatusSelectProps) => {
  const options = [
    { label: 'Có sẵn', value: 'Available' },
    { label: 'Đang cho thuê', value: 'Rented' },
    { label: 'Đang bảo dưỡng', value: 'Maintenance' },
    { label: 'Đang sửa chữa', value: 'Repair' },
    { label: 'Ngừng hoạt động', value: 'OutOfService' },
    { label: 'Đang vận chuyển', value: 'InTransit' }
  ]

  return <Select {...selectProps} options={options} placeholder={selectProps.placeholder || 'Chọn trạng thái...'} />
}

export default VehicleStatusSelect

