import { Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import api from '../../services/api/axios'

interface ExportButtonProps {
  selectedIds: (string | number)[]
  apiEndpoint: string // e.g., '/VehicleTypes/export'
  filename: string // e.g., 'loai-xe' -> will become 'loai-xe_Export.xlsx'
  loading?: boolean
  disabled?: boolean
}

const ExportButton = ({ selectedIds, apiEndpoint, filename, loading = false, disabled = false }: ExportButtonProps) => {
  const handleExport = async () => {
    try {
      // Send request to backend with list of IDs (empty array = export all)
      const response = await api.post(
        apiEndpoint,
        { ids: selectedIds },
        {
          responseType: 'blob' // Important: tell axios to expect binary data
        }
      )

      // Get blob from response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Get filename from Content-Disposition header if available
      let downloadFilename = `${filename}_Export.xlsx`
      const contentDisposition = response.headers['content-disposition']
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1]
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: unknown) {
      console.error('Export error:', error)
      throw error
    }
  }

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleExport}
      loading={loading}
      disabled={disabled}
      style={{ backgroundColor: '#fff', borderColor: '#d9d9d9' }}
    >
      Export Excel
    </Button>
  )
}

export default ExportButton
