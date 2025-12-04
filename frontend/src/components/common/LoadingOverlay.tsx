import { useEffect, useState } from 'react'
import '../../styles/loading-overlay.css'

interface LoadingOverlayProps {
  loading: boolean
  tip?: string
}

const LoadingOverlay = ({ loading }: LoadingOverlayProps) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (loading) {
      // Reset progress khi bắt đầu loading
      setProgress(0)

      // Simulate progress với animation mượt mà và tự nhiên hơn
      let currentProgress = 0
      const interval = setInterval(() => {
        // Tăng progress với tốc độ giảm dần (giống như real progress)
        const remaining = 90 - currentProgress
        const increment = remaining > 20 ? Math.random() * 8 + 2 : Math.random() * 3 + 1
        currentProgress = Math.min(90, currentProgress + increment)
        setProgress(currentProgress)
      }, 100)

      return () => clearInterval(interval)
    } else {
      // Khi loading xong, animate đến 100% rồi reset
      setProgress(100)
      const timeout = setTimeout(() => {
        setProgress(0)
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [loading])

  if (!loading && progress === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        zIndex: 10000,
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1890ff 0%, #52c41a 30%, #13c2c2 60%, #722ed1 90%, #1890ff 100%)',
          backgroundSize: '200% 100%',
          transition: loading ? 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.2s ease-in',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0 0 2px 2px'
        }}
        className='loading-progress-bar'
      >
        {/* Animated gradient background */}
        <div
          className='progress-gradient-animation'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #1890ff 0%, #52c41a 30%, #13c2c2 60%, #722ed1 90%, #1890ff 100%)',
            backgroundSize: '200% 100%'
          }}
        />
        {/* Shimmer effect */}
        <div
          className='progress-shimmer'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
            transform: 'skewX(-20deg)'
          }}
        />
      </div>
    </div>
  )
}

export default LoadingOverlay

