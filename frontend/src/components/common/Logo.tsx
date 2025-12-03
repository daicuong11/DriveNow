import { CarOutlined } from '@ant-design/icons'
import '../../styles/logo.css'

interface LogoProps {
  collapsed?: boolean
  className?: string
}

const Logo = ({ collapsed = false, className = '' }: LogoProps) => {
  if (collapsed) {
    // Collapsed version: Small square icon with gradient
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
          boxShadow: '0 4px 16px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shine effect */}
        <div
          className='logo-shine'
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
          }}
        />
        <CarOutlined
          style={{
            fontSize: 24,
            color: '#fff',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
          }}
        />
      </div>
    )
  }

  // Full version: Logo with text and gradient
  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(14, 165, 233, 0.25) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
        height: '48px'
      }}
    >
      {/* Background glow effect */}
      <div
        className='logo-pulse'
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)'
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}
      >
        <CarOutlined
          style={{
            fontSize: 20,
            color: '#fff',
            fontWeight: 'bold',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.5px',
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          DriveNow
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: 1,
            textTransform: 'uppercase',
            opacity: 0.9
          }}
        >
          Car Rental
        </div>
      </div>
    </div>
  )
}

export default Logo

