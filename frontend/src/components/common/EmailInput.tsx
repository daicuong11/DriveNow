import { Input } from 'antd'
import type { InputProps } from 'antd/es/input'

interface EmailInputProps extends InputProps {
  // No additional props needed, just for consistency
}

/**
 * Email Input component với validation
 * Tương thích với Ant Design Form validation
 */
const EmailInput = ({ ...inputProps }: EmailInputProps) => {
  return <Input {...inputProps} type='email' placeholder={inputProps.placeholder || 'Nhập email'} />
}

export default EmailInput

