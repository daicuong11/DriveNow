/**
 * Get user-friendly error message from API error
 * @param error - The error object from axios or mutation
 * @param defaultMessage - Default error message if cannot determine
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'Có lỗi xảy ra. Vui lòng thử lại!'): string => {
  // Check if it's an axios error
  if (error?.response) {
    const status = error.response.status
    const data = error.response.data

    // Handle 403 Forbidden - Permission denied
    if (status === 403) {
      return data?.message || 'Bạn không có quyền thực hiện chức năng này.'
    }

    // Handle 401 Unauthorized
    if (status === 401) {
      return data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }

    // Handle 404 Not Found
    if (status === 404) {
      return data?.message || 'Không tìm thấy dữ liệu.'
    }

    // Handle 400 Bad Request
    if (status === 400) {
      return data?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.'
    }

    // Handle 500+ Server errors
    if (status >= 500) {
      return data?.message || 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
    }

    // Return message from server if available
    if (data?.message) {
      return data.message
    }
  }

  // Handle network errors
  if (error?.request && !error?.response) {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.'
  }

  // Handle other errors
  if (error?.message) {
    return error.message
  }

  return defaultMessage
}

/**
 * Check if error is a 403 Forbidden error
 */
export const isForbiddenError = (error: any): boolean => {
  return error?.response?.status === 403
}

/**
 * Check if error is an authentication error (401)
 */
export const isUnauthorizedError = (error: any): boolean => {
  return error?.response?.status === 401
}

