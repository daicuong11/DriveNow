import { Select } from 'antd'
import type { SelectProps } from 'antd/es/select'

interface FuelTypeSelectProps extends Omit<SelectProps, 'options'> {}

const FuelTypeSelect = ({ ...selectProps }: FuelTypeSelectProps) => {
  const options = [
    { label: 'Xăng', value: 'Xăng' },
    { label: 'Dầu', value: 'Dầu' },
    { label: 'Điện', value: 'Điện' }
  ]

  return <Select {...selectProps} options={options} placeholder={selectProps.placeholder || 'Chọn loại nhiên liệu...'} />
}

export default FuelTypeSelect

