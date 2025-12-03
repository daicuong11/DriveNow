import { useState, useCallback } from 'react'
import { Modal, Upload, Button, Progress, message } from 'antd'
import { InboxOutlined, UploadOutlined, CloseOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd/es/upload'
import { showError } from '../../utils/notifications'

interface ImportModalProps {
  open: boolean
  onCancel: () => void
  onImport: (file: File) => Promise<void>
  accept?: string
  title?: string
}

const ImportModal = ({ open, onCancel, onImport, accept = '.xlsx,.xls', title = 'Import Excel' }: ImportModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList]

    // Only keep the latest file
    newFileList = newFileList.slice(-1)

    // Read from response and show file link
    newFileList = newFileList.map((file) => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url
      }
      return file
    })

    setFileList(newFileList)
  }

  const handleRemove = () => {
    setFileList([])
    setUploadProgress(0)
  }

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn file để import!')
      return
    }

    const file = fileList[0].originFileObj
    if (!file) {
      showError('File không hợp lệ!')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onImport(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Close modal after a short delay
      setTimeout(() => {
        setFileList([])
        setUploadProgress(0)
        setUploading(false)
        onCancel()
      }, 500)
    } catch (error: any) {
      // Progress will be reset in finally
      // Error is already handled in onImport
    } finally {
      setUploadProgress(0)
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: accept,
    fileList,
    onChange: handleChange,
    onRemove: handleRemove,
    beforeUpload: () => false, // Prevent auto upload
    maxCount: 1,
    disabled: uploading
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key='cancel' onClick={onCancel} disabled={uploading}>
          Hủy bỏ
        </Button>,
        <Button key='import' type='primary' onClick={handleImport} loading={uploading} disabled={fileList.length === 0}>
          Import
        </Button>
      ]}
      width={600}
      closable={!uploading}
      maskClosable={!uploading}
    >
      <div className='space-y-4'>
        <Upload.Dragger {...uploadProps}>
          <p className='ant-upload-drag-icon'>
            <InboxOutlined />
          </p>
          <p className='ant-upload-text'>Nhấp hoặc kéo thả file vào đây để tải lên</p>
          <p className='ant-upload-hint'>Chỉ chấp nhận file Excel (.xlsx, .xls)</p>
        </Upload.Dragger>

        {uploading && (
          <div className='mt-4'>
            <Progress percent={uploadProgress} status='active' />
            <p className='text-center text-gray-500 mt-2'>Đang import dữ liệu, vui lòng đợi...</p>
          </div>
        )}

        {fileList.length > 0 && !uploading && (
          <div className='mt-2'>
            <p className='text-sm text-gray-600'>File đã chọn: {fileList[0].name}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ImportModal

