import { Select, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api/axios'
import type { SelectProps } from 'antd/es/select'

export interface MasterDataOption {
  id: number
  code: string
  name: string
  description?: string
  isDeleted?: boolean
  status?: string
}

interface MasterDataSelectProps extends Omit<SelectProps, 'options' | 'loading'> {
  apiEndpoint: string // API endpoint để load data (ví dụ: '/VehicleTypes')
  queryKey: string // Query key cho React Query (ví dụ: 'vehicleTypes')
  displayField?: 'name' | 'code' | 'description' // Field để hiển thị, mặc định là 'name'
  showCode?: boolean // Có hiển thị code không, mặc định true
  showDescription?: boolean // Có hiển thị description không, mặc định false
  valueField?: 'id' | 'code' // Field để lưu value, mặc định là 'id'
  filterDeleted?: boolean // Có filter deleted items không, mặc định true
  filterStatus?: string // Filter theo status (ví dụ: 'A' cho active only)
}

const MasterDataSelect = ({
  apiEndpoint,
  queryKey,
  displayField = 'name',
  showCode = true,
  showDescription = false,
  valueField = 'id',
  filterDeleted = true,
  filterStatus,
  ...selectProps
}: MasterDataSelectProps) => {
  // Fetch master data
  const { data, isLoading } = useQuery({
    queryKey: [queryKey, 'select'],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        pageNumber: 1,
        pageSize: 1000 // Load tất cả để select
      }

      if (filterStatus) {
        params.filterStatus = filterStatus
      }

      const response = await api.get<{ success: boolean; data: { data: MasterDataOption[] } }>(apiEndpoint, {
        params
      })
      return response.data.data.data || []
    },
    staleTime: 5 * 60 * 1000 // Cache 5 phút
  })

  // Format options để hiển thị
  const options = (data || [])
    .filter((item) => !filterDeleted || !(item.isDeleted === true))
    .map((item) => {
      let label = item[displayField] || item.name || item.code

      // Thêm code vào label nếu showCode = true
      if (showCode && item.code) {
        label = `${item.code} - ${label}`
      }

      // Thêm description vào label nếu showDescription = true
      if (showDescription && item.description) {
        label = `${label} (${item.description})`
      }

      return {
        label,
        value: valueField === 'code' ? item.code : item.id,
        item: item // Lưu toàn bộ item để có thể access sau
      }
    })

  return (
    <Select
      {...selectProps}
      options={options}
      loading={isLoading}
      showSearch
      filterOption={(input, option) => {
        const item = option?.item as MasterDataOption | undefined
        if (!item) return false

        const searchText = input.toLowerCase()
        const codeMatch = item.code?.toLowerCase().includes(searchText) ?? false
        const nameMatch = item.name?.toLowerCase().includes(searchText) ?? false
        const descMatch = item.description?.toLowerCase().includes(searchText) ?? false

        return codeMatch || nameMatch || descMatch
      }}
      notFoundContent={isLoading ? <Spin size='small' /> : null}
      placeholder={selectProps.placeholder || 'Chọn...'}
    />
  )
}

export default MasterDataSelect
