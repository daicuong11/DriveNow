import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'

interface CustomDatePickerProps extends Omit<DatePickerProps, 'format'> {
  format?: string
}

const CustomDatePicker = ({ format = 'DD/MM/YYYY', style, ...props }: CustomDatePickerProps) => {
  return (
    <DatePicker
      {...props}
      format={format}
      style={{ width: '100%', ...style }}
      placeholder={props.placeholder || 'Chọn ngày'}
    />
  )
}

export default CustomDatePicker

