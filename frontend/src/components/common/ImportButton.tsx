import { useState } from 'react'
import { Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import ImportModal from './ImportModal'

interface ImportButtonProps {
  onImport: (file: File) => Promise<void>
  accept?: string
  loading?: boolean
  title?: string
}

const ImportButton = ({ onImport, accept = '.xlsx,.xls', loading = false, title = 'Import Excel' }: ImportButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        icon={<UploadOutlined />}
        onClick={() => setModalOpen(true)}
        loading={loading}
        style={{ backgroundColor: '#fff', borderColor: '#d9d9d9' }}
      >
        Import Excel
      </Button>
      <ImportModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onImport={onImport}
        accept={accept}
        title={title}
      />
    </>
  )
}

export default ImportButton
