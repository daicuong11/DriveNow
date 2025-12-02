import { toast, ToastOptions } from 'react-toastify'

/**
 * Custom toast configuration
 */
const defaultToastOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light'
}

/**
 * Show success notification
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultToastOptions,
    ...options
  })
}

/**
 * Show error notification
 */
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...defaultToastOptions,
    autoClose: 4000, // Error messages stay longer
    ...options
  })
}

/**
 * Show warning notification
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    ...defaultToastOptions,
    ...options
  })
}

/**
 * Show info notification
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    ...defaultToastOptions,
    ...options
  })
}

