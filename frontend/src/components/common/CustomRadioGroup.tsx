import { Radio } from 'antd'
import type { RadioGroupProps } from 'antd/es/radio'

interface CustomRadioGroupProps extends RadioGroupProps {
  options?: Array<{ label: string; value: string | number }>
}

const CustomRadioGroup = ({ options, children, ...props }: CustomRadioGroupProps) => {
  if (options && options.length > 0) {
    return (
      <Radio.Group {...props}>
        {options.map((option) => (
          <Radio key={String(option.value)} value={option.value}>
            {option.label}
          </Radio>
        ))}
      </Radio.Group>
    )
  }

  return <Radio.Group {...props}>{children}</Radio.Group>
}

export default CustomRadioGroup

