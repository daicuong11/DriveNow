import { Modal, List, Typography, Alert } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

interface ImportError {
  row: number
  message: string
  field?: string
}

interface ImportErrorModalProps {
  open: boolean
  errors: ImportError[]
  onClose: () => void
  totalRows?: number
}

const ImportErrorModal = ({ open, errors, onClose, totalRows }: ImportErrorModalProps) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
          <span>Lỗi Import Excel</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 50 }}
    >
      <Alert
        message="Import thất bại"
        description={`File Excel có ${errors.length} lỗi. Vui lòng kiểm tra và sửa lại trước khi import.`}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {totalRows && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Tổng số dòng trong file: {totalRows}</Text>
        </div>
      )}

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <List
          size="small"
          bordered
          dataSource={errors}
          renderItem={(error, index) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>Dòng {error.row}</Text>
                  {error.field && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cột: {error.field}
                    </Text>
                  )}
                </div>
                <Text type="danger" style={{ fontSize: 13 }}>
                  {error.message}
                </Text>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  )
}

export default ImportErrorModal

