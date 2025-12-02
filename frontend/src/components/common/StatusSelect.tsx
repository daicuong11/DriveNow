import { Select } from 'antd'
import type { SelectProps } from 'antd/es/select'

interface StatusSelectProps extends Omit<SelectProps, 'options'> {
  includeInactive?: boolean // Có bao gồm Inactive không, mặc định true
}

const StatusSelect = ({ includeInactive = true, ...selectProps }: StatusSelectProps) => {
  const options = [
    { label: 'Hoạt động', value: 'A' },
    ...(includeInactive ? [{ label: 'Không hoạt động', value: 'I' }] : [])
  ]

  return <Select {...selectProps} options={options} placeholder={selectProps.placeholder || 'Chọn trạng thái...'} />
}

export default StatusSelect
