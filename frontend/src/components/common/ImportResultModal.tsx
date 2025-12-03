import { Modal, Button, Space, Typography, Alert } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface ImportError {
  row: number
  message: string
  field?: string
}

interface ImportResultModalProps {
  open: boolean
  success: boolean
  message: string
  totalRows?: number
  successCount?: number
  errors?: ImportError[]
  onClose: () => void
}

const ImportResultModal = ({
  open,
  success,
  message: resultMessage,
  totalRows,
  successCount,
  errors = [],
  onClose
}: ImportResultModalProps) => {
  return (
    <Modal
      title={
        <Space>
          {success ? (
            <>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <span>Import thành công</span>
            </>
          ) : (
            <>
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              <span>Import thất bại</span>
            </>
          )}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key='close' type='primary' onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={700}
    >
      <div className='space-y-4'>
        {success ? (
          <Alert
            message='Import thành công!'
            description={
              <div>
                <p>{resultMessage}</p>
                {totalRows !== undefined && (
                  <p className='mt-2'>
                    <Text strong>Tổng số dòng:</Text> {totalRows} | <Text strong>Thành công:</Text> {successCount || 0}
                  </p>
                )}
              </div>
            }
            type='success'
            showIcon
          />
        ) : (
          <Alert
            message='Import thất bại!'
            description={resultMessage}
            type='error'
            showIcon
          />
        )}

        {errors.length > 0 && (
          <div>
            <Text strong>Chi tiết lỗi ({errors.length} lỗi):</Text>
            <div className='mt-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50'>
              {errors.map((error, index) => (
                <div key={index} className='mb-2 text-sm'>
                  <Text type='danger'>
                    Dòng {error.row}: {error.message}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {success && totalRows !== undefined && successCount !== undefined && totalRows > successCount && (
          <Alert
            message='Lưu ý'
            description={`Có ${totalRows - successCount} dòng không được import do lỗi validation.`}
            type='warning'
            showIcon
          />
        )}
      </div>
    </Modal>
  )
}

export default ImportResultModal

