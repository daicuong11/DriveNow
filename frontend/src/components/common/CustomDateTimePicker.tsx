import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'

interface CustomDateTimePickerProps extends Omit<DatePickerProps, 'format' | 'showTime'> {
  format?: string
}

const CustomDateTimePicker = ({
  format = 'DD/MM/YYYY HH:mm',
  style,
  showTime = true,
  ...props
}: CustomDateTimePickerProps) => {
  return (
    <DatePicker
      {...props}
      showTime={showTime}
      format={format}
      style={{ width: '100%', ...style }}
      placeholder={props.placeholder || 'Chọn ngày giờ'}
    />
  )
}

export default CustomDateTimePicker

