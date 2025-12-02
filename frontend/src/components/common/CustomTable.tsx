import { useState } from 'react'
import { Table, Input, Space, Button } from 'antd'
import type { TableProps, ColumnType } from 'antd/es/table'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import type { FilterDropdownProps } from 'antd/es/table/interface'

interface CustomTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: (ColumnType<T> & {
    filterable?: boolean
    searchable?: boolean
  })[]
  onFilterChange?: (filters: Record<string, any>) => void
  onSortChange?: (sorter: { field?: string; order?: 'ascend' | 'descend' }) => void
  enableRowSelection?: boolean
  selectedRowKeys?: React.Key[]
  onSelectChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
}

const CustomTable = <T extends Record<string, any>>({
  columns,
  onFilterChange,
  onSortChange,
  enableRowSelection = false,
  selectedRowKeys,
  onSelectChange,
  ...tableProps
}: CustomTableProps<T>) => {
  const [filteredColumns, setFilteredColumns] = useState<Record<string, any>>({})

  const getColumnSearchProps = (dataIndex: string, title: string): Partial<ColumnType<T>> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
          value={selectedKeys?.[0]}
          onChange={(e) => {
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }}
          onPressEnter={() => {
            confirm()
            if (onFilterChange) {
              onFilterChange({
                ...filteredColumns,
                [dataIndex]: selectedKeys?.[0] || undefined
              })
            }
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type='primary'
            onClick={() => {
              confirm()
              if (onFilterChange) {
                onFilterChange({
                  ...filteredColumns,
                  [dataIndex]: selectedKeys?.[0] || undefined
                })
              }
            }}
            icon={<SearchOutlined />}
            size='small'
            style={{ width: 90 }}
          >
            Tìm kiếm
          </Button>
          <Button
            onClick={() => {
              if (clearFilters) {
                clearFilters()
                if (onFilterChange) {
                  const newFilters = { ...filteredColumns }
                  delete newFilters[dataIndex]
                  onFilterChange(newFilters)
                }
              }
            }}
            size='small'
            style={{ width: 90 }}
          >
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value: any, record: T) => {
      const recordValue = record[dataIndex]
      if (recordValue == null) return false
      return recordValue.toString().toLowerCase().includes(value.toString().toLowerCase())
    }
  })

  const getColumnFilterProps = (
    dataIndex: string,
    filterOptions?: { text: string; value: any }[]
  ): Partial<ColumnType<T>> => {
    if (filterOptions && filterOptions.length > 0) {
      return {
        filters: filterOptions,
        onFilter: (value: any, record: T) => {
          const recordValue = record[dataIndex]
          return recordValue === value
        },
        filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      }
    }
    return {}
  }

  const enhancedColumns = columns.map((col) => {
    const { filterable, searchable, ...restCol } = col

    let enhancedCol: ColumnType<T> = { ...restCol }

    // Add search functionality
    if (searchable && col.dataIndex) {
      const dataIndex = Array.isArray(col.dataIndex) ? col.dataIndex[0] : col.dataIndex
      const title = (col.title as string) || dataIndex
      enhancedCol = {
        ...enhancedCol,
        ...getColumnSearchProps(dataIndex as string, title)
      }
    }

    // Add filter functionality
    if (filterable && col.dataIndex) {
      const dataIndex = Array.isArray(col.dataIndex) ? col.dataIndex[0] : col.dataIndex
      const title = (col.title as string) || dataIndex

      // If column has filter options, use them
      if (col.filters) {
        enhancedCol = {
          ...enhancedCol,
          ...getColumnFilterProps(dataIndex as string, col.filters as any)
        }
      }
    }

    // Add sort functionality if not already present
    if (col.sorter && !enhancedCol.sorter) {
      enhancedCol.sorter = col.sorter
    }

    return enhancedCol
  })

  // Row selection configuration
  const rowSelection = enableRowSelection
    ? {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[], selectedRows: T[]) => {
          if (onSelectChange) {
            onSelectChange(selectedKeys, selectedRows)
          }
        },
        getCheckboxProps: (record: T) => ({
          name: (record as any).name || (record as any).code || (record as any).id
        })
      }
    : undefined

  return (
    <Table<T>
      {...tableProps}
      columns={enhancedColumns}
      rowSelection={rowSelection}
      className='custom-table'
      style={{
        ...tableProps.style
      }}
      onChange={(pagination, filters, sorter, extra) => {
        // Handle column filters
        const newFilters: Record<string, any> = {}
        Object.keys(filters).forEach((key) => {
          if (filters[key] && filters[key]!.length > 0) {
            newFilters[key] = filters[key]![0]
          }
        })
        setFilteredColumns(newFilters)
        if (onFilterChange) {
          onFilterChange(newFilters)
        }

        // Handle sorting
        if (sorter && !Array.isArray(sorter)) {
          const sortField = sorter.field as string
          const sortOrder = sorter.order
          if (onSortChange) {
            onSortChange({
              field: sortField,
              order: sortOrder === 'ascend' ? 'ascend' : sortOrder === 'descend' ? 'descend' : undefined
            })
          }
        }

        // Call original onChange if provided
        if (tableProps.onChange) {
          tableProps.onChange(pagination, filters, sorter, extra)
        }
      }}
    />
  )
}

export default CustomTable
