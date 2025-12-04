import { Input } from 'antd'
import type { InputProps } from 'antd/es/input'
import { useState } from 'react'

interface PhoneInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

/**
 * Phone Input component với validation và formatting
 * Chỉ cho phép số và một số ký tự đặc biệt (+, -, space, parentheses)
 */
const PhoneInput = ({ value, onChange, ...inputProps }: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState(value || '')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Chỉ cho phép số, +, -, space, (, )
    const cleanedValue = inputValue.replace(/[^\d+\-()\s]/g, '')
    setDisplayValue(cleanedValue)
    onChange?.(cleanedValue)
  }

  // Sync với value từ form
  if (value !== displayValue && value !== undefined) {
    setDisplayValue(value)
  }

  return (
    <Input
      {...inputProps}
      value={displayValue}
      onChange={handleChange}
      placeholder={inputProps.placeholder || 'Nhập số điện thoại'}
    />
  )
}

export default PhoneInput

