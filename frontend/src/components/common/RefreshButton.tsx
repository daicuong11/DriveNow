import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface RefreshButtonProps {
  onRefresh: () => void
  loading?: boolean
}

const RefreshButton = ({ onRefresh, loading = false }: RefreshButtonProps) => {
  return (
    <Button
      icon={<ReloadOutlined />}
      onClick={onRefresh}
      loading={loading}
      style={{
        backgroundColor: '#fff',
        borderColor: '#d9d9d9'
      }}
      title='Làm mới dữ liệu và xóa bộ lọc'
    />
  )
}

export default RefreshButton
