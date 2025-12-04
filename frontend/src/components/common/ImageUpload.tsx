import { Upload, message } from 'antd'
import type { UploadProps } from 'antd/es/upload'
import { UploadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import type { UploadFile } from 'antd/es/upload/interface'

interface ImageUploadProps extends Omit<UploadProps, 'listType' | 'beforeUpload' | 'onChange'> {
  value?: string
  onChange?: (url?: string) => void
  maxSize?: number // in MB
  maxCount?: number
}

const ImageUpload = ({ value, onChange, maxSize = 5, maxCount = 1, ...props }: ImageUploadProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Helper to get full URL from relative path
  // Convert /uploads/vehicles/xxx.jpg to https://localhost:7291/api/Images/vehicles/xxx.jpg
  const getFullUrl = (url: string) => {
    if (!url) return url
    // If already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Get API base URL from environment
    const apiURL = import.meta.env.VITE_API_URL || '/api'

    // Extract backend base URL
    let backendBaseURL: string
    if (apiURL.startsWith('http://') || apiURL.startsWith('https://')) {
      // Use the protocol from VITE_API_URL, but ensure https for localhost:7291
      backendBaseURL = apiURL.replace(/\/api\/?$/, '')
      // If it's http://localhost:7291, convert to https
      if (backendBaseURL.startsWith('http://localhost:7291')) {
        backendBaseURL = backendBaseURL.replace('http://', 'https://')
      }
    } else {
      // Relative URL: construct from window.location but use https for backend
      if (typeof window !== 'undefined') {
        const { hostname } = window.location
        const portMatch = apiURL.match(/:(\d+)/)
        const port = portMatch ? portMatch[1] : '7291'
        // Force HTTPS for backend API (localhost:7291 should use https)
        backendBaseURL = `https://${hostname}:${port}`
      } else {
        backendBaseURL = ''
      }
    }

    // If URL is from uploads/vehicles folder, use Images controller endpoint
    if (url.startsWith('/uploads/vehicles/')) {
      const fileName = url.replace('/uploads/vehicles/', '')
      // Use Images controller endpoint with https
      return `${backendBaseURL}/api/Images/vehicles/${fileName}`
    }

    // For other URLs, use static files
    return `${backendBaseURL}${url.startsWith('/') ? url : '/' + url}`
  }

  useEffect(() => {
    if (value) {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: getFullUrl(value)
        }
      ])
    } else {
      setFileList([])
    }
  }, [value])

  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList]

    // Limit file count
    newFileList = newFileList.slice(-maxCount)

    // Process each file in the list
    newFileList = newFileList.map((file) => {
      // If upload is done, extract URL from response
      if (file.status === 'done' && file.response) {
        // Handle response format: { success: true, url: string }
        const response = file.response
        const url = response?.url || (response?.data && response.data?.url)
        if (url) {
          // Set full URL for preview
          file.url = getFullUrl(url)
          file.thumbUrl = getFullUrl(url) // Also set thumbUrl for picture-card preview
          file.status = 'done'
        }
      }
      return file
    })

    // Update fileList state
    setFileList(newFileList)

    // If upload is done, get the URL and call onChange
    if (info.file.status === 'done') {
      const response = info.file.response
      // Handle response format: { success: true, url: string }
      const url = response?.url || (response?.data && response.data?.url)
      if (url) {
        // Store relative URL in form (backend expects relative path like /uploads/vehicles/xxx.jpg)
        console.log('ImageUpload: Upload successful, URL:', url)
        onChange?.(url)
        message.success(`${info.file.name} upload thành công`)
      } else {
        console.error('ImageUpload: No URL in response', response)
        message.error('Không nhận được URL từ server')
      }
    } else if (info.file.status === 'error') {
      const errorMsg = info.file.response?.message || info.file.response?.data?.message || 'Upload thất bại'
      console.error('ImageUpload: Upload failed', info.file.response)
      message.error(`${info.file.name}: ${errorMsg}`)
    }
  }

  const beforeUpload = (file: File) => {
    const isValidType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
    if (!isValidType) {
      message.error('Chỉ chấp nhận file JPG/PNG!')
      return Upload.LIST_IGNORE
    }

    const isValidSize = file.size / 1024 / 1024 < maxSize
    if (!isValidSize) {
      message.error(`Hình ảnh phải nhỏ hơn ${maxSize}MB!`)
      return Upload.LIST_IGNORE
    }

    return true // Allow auto upload
  }

  const handleRemove = () => {
    setFileList([])
    onChange?.(undefined)
  }

  // Get token for authentication
  const getHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  return (
    <Upload
      {...props}
      listType='picture-card'
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={beforeUpload}
      onRemove={handleRemove}
      maxCount={maxCount}
      headers={getHeaders()}
    >
      {fileList.length < maxCount && (
        <div>
          <UploadOutlined />
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Upload>
  )
}

export default ImageUpload
