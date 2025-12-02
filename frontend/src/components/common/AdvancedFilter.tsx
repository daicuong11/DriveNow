import { useState, useEffect, useRef } from 'react'
import { Row, Col, Input, Select, Button, Space, Card } from 'antd'
import { FilterOutlined, CloseOutlined } from '@ant-design/icons'

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select'
  options?: { label: string; value: string }[]
  placeholder?: string
}

interface AdvancedFilterProps {
  filters: FilterConfig[]
  onFilterChange: (filters: Record<string, string | undefined>) => void
  onClear: () => void
  resetTrigger?: number // Trigger để reset form từ bên ngoài
}

const AdvancedFilter = ({ filters, onFilterChange, onClear, resetTrigger }: AdvancedFilterProps) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [isVisible, setIsVisible] = useState(false)
  const prevResetTrigger = useRef(resetTrigger)

  // Reset form khi resetTrigger thay đổi
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger !== prevResetTrigger.current) {
      setFilterValues({})
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger])

  const handleTextChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value }
    setFilterValues(newFilters)
  }

  const handleTextEnter = () => {
    onFilterChange(filterValues)
  }

  const handleSelectChange = (key: string, value: string | undefined) => {
    const newFilters = { ...filterValues }
    if (value) {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setFilterValues(newFilters)
    onFilterChange(newFilters)
  }

  const handleClear = () => {
    setFilterValues({})
    onClear()
  }

  const hasActiveFilters = Object.keys(filterValues).some((key) => filterValues[key])

  if (!isVisible) {
    return (
      <div className='mb-4'>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setIsVisible(true)}
          type={hasActiveFilters ? 'primary' : 'default'}
        >
          Bộ lọc nâng cao {hasActiveFilters && `(${Object.keys(filterValues).filter((k) => filterValues[k]).length})`}
        </Button>
      </div>
    )
  }

  return (
    <Card
      className='mb-4'
      title={
        <div className='flex justify-between items-center'>
          <span>
            <FilterOutlined className='mr-2' />
            Bộ lọc nâng cao
          </span>
          <Space>
            <Button size='small' onClick={handleClear} disabled={!hasActiveFilters}>
              Xóa bộ lọc
            </Button>
            <Button size='small' icon={<CloseOutlined />} onClick={() => setIsVisible(false)} type='text' />
          </Space>
        </div>
      }
      size='small'
    >
      <Row gutter={[16, 16]}>
        {filters.map((filter) => (
          <Col xs={24} sm={12} md={8} lg={6} key={filter.key}>
            {filter.type === 'text' ? (
              <div>
                <div className='text-sm text-gray-600 mb-1'>{filter.label}</div>
                <Input
                  placeholder={filter.placeholder || `Nhập ${filter.label.toLowerCase()}...`}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleTextChange(filter.key, e.target.value)}
                  onPressEnter={handleTextEnter}
                  allowClear
                />
              </div>
            ) : (
              <div>
                <div className='text-sm text-gray-600 mb-1'>{filter.label}</div>
                <Select
                  placeholder={filter.placeholder || `Chọn ${filter.label.toLowerCase()}...`}
                  value={filterValues[filter.key] || undefined}
                  onChange={(value) => handleSelectChange(filter.key, value)}
                  allowClear
                  style={{ width: '100%' }}
                  options={filter.options || []}
                />
              </div>
            )}
          </Col>
        ))}
      </Row>
    </Card>
  )
}

export default AdvancedFilter
