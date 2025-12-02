import { Button, Dropdown, Space, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd/es/menu'

interface ActionSelectProps {
  onAdd: () => void
  onDelete: () => void
  deleteDisabled?: boolean
  deleteLoading?: boolean
}

const ActionSelect = ({ onAdd, onDelete, deleteDisabled = true, deleteLoading = false }: ActionSelectProps) => {
  const handleDelete = () => {
    onDelete()
  }

  const items: MenuProps['items'] = [
    {
      key: 'add',
      label: 'Thêm mới',
      icon: <PlusOutlined />,
      onClick: onAdd
    },
    {
      key: 'delete',
      label: (
        <Popconfirm
          title='Xóa dữ liệu'
          description='Bạn có chắc chắn muốn xóa các dòng đã chọn?'
          onConfirm={handleDelete}
          okText='Xóa'
          cancelText='Hủy'
          disabled={deleteDisabled}
        >
          <span>Xóa</span>
        </Popconfirm>
      ),
      icon: <DeleteOutlined />,
      danger: true,
      disabled: deleteDisabled
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} disabled={deleteLoading}>
      <Button type='primary' onClick={(e) => e.preventDefault()}>
        <Space>
          Thao tác
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  )
}

export default ActionSelect
