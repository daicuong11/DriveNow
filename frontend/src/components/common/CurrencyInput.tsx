import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd/es/input-number'

interface CurrencyInputProps extends Omit<InputNumberProps, 'formatter' | 'parser'> {
  currency?: string
  showCurrency?: boolean
}

const CurrencyInput = ({
  currency = 'VND',
  showCurrency = false,
  min = 0,
  style,
  placeholder = 'Nhập số tiền',
  ...props
}: CurrencyInputProps) => {
  const formatter = (value?: string | number) => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numValue)) return ''
    const formatted = numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return showCurrency ? `${formatted} ${currency}` : formatted
  }

  const parser = (value?: string) => {
    if (!value) return ''
    return value.replace(/\$\s?|(,*)/g, '').replace(new RegExp(`\\s?${currency}`, 'g'), '')
  }

  return (
    <InputNumber
      {...props}
      min={min}
      formatter={formatter}
      parser={parser}
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
    />
  )
}

export default CurrencyInput

