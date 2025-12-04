import { Input } from 'antd'
import type { InputProps } from 'antd/es/input'
import { normalizeCode } from '../../utils/validation'

interface CodeInputProps extends InputProps {
  autoUppercase?: boolean // Tự động chuyển thành chữ hoa, mặc định true
}

/**
 * Input component cho Code field
 * Tự động chuyển thành chữ hoa khi nhập
 * Tự động loại bỏ khoảng trắng và ký tự đặc biệt (chỉ giữ chữ, số và _)
 * Tương thích với Ant Design Form
 */
const CodeInput = ({ autoUppercase = true, onChange, value, ...inputProps }: CodeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalize value: uppercase, remove spaces, remove special chars (except _)
    const normalizedValue = normalizeCode(e.target.value)

    // Tạo event mới với value đã normalized
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: normalizedValue
      },
      currentTarget: {
        ...e.currentTarget,
        value: normalizedValue
      }
    } as React.ChangeEvent<HTMLInputElement>

    if (onChange) {
      onChange(syntheticEvent)
    }
  }

  // Đảm bảo value luôn được normalize khi hiển thị
  const displayValue =
    typeof value === 'string' && value ? (autoUppercase ? normalizeCode(value) : value) : value

  return <Input {...inputProps} value={displayValue} onChange={handleChange} />
}

export default CodeInput

