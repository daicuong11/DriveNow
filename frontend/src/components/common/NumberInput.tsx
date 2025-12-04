import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd/es/input-number'

interface NumberInputProps extends InputNumberProps {
  allowComma?: boolean
}

const NumberInput = ({
  allowComma = true,
  style,
  placeholder = 'Nhập số',
  ...props
}: NumberInputProps) => {
  const formatter = allowComma
    ? (value?: string | number) => {
        if (!value) return ''
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
        if (isNaN(numValue)) return ''
        return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
    : undefined

  const parser = allowComma
    ? (value?: string) => {
        if (!value) return ''
        return value.replace(/\$\s?|(,*)/g, '')
      }
    : undefined

  return (
    <InputNumber
      {...props}
      formatter={formatter}
      parser={parser}
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
    />
  )
}

export default NumberInput

