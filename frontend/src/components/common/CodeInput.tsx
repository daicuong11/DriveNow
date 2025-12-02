import { Input } from 'antd'
import type { InputProps } from 'antd/es/input'

interface CodeInputProps extends InputProps {
  autoUppercase?: boolean // Tự động chuyển thành chữ hoa, mặc định true
}

/**
 * Input component cho Code field
 * Tự động chuyển thành chữ hoa khi nhập
 * Tương thích với Ant Design Form
 */
const CodeInput = ({ autoUppercase = true, onChange, value, ...inputProps }: CodeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (autoUppercase) {
      // Tạo event mới với value đã uppercase
      const upperValue = e.target.value.toUpperCase()
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: upperValue
        },
        currentTarget: {
          ...e.currentTarget,
          value: upperValue
        }
      } as React.ChangeEvent<HTMLInputElement>

      if (onChange) {
        onChange(syntheticEvent)
      }
    } else {
      if (onChange) {
        onChange(e)
      }
    }
  }

  // Đảm bảo value luôn là uppercase khi hiển thị
  const displayValue = autoUppercase && typeof value === 'string' ? value.toUpperCase() : value

  return <Input {...inputProps} value={displayValue} onChange={handleChange} />
}

export default CodeInput

