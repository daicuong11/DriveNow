import { Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload'

interface ImportButtonProps {
  onImport: (file: File) => Promise<void>
  accept?: string
  loading?: boolean
}

const ImportButton = ({ onImport, accept = '.xlsx,.xls', loading = false }: ImportButtonProps) => {
  const handleChange: UploadProps['onChange'] = async (info) => {
    if (info.file.originFileObj) {
      const file = info.file.originFileObj
      await onImport(file)
    }
  }

  return (
    <Upload
      accept={accept}
      showUploadList={false}
      beforeUpload={() => false} // Prevent auto upload
      onChange={handleChange}
      maxCount={1}
    >
      <Button icon={<UploadOutlined />} loading={loading} style={{ backgroundColor: '#fff', borderColor: '#d9d9d9' }}>
        Import Excel
      </Button>
    </Upload>
  )
}

export default ImportButton
