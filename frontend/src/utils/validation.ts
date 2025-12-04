/**
 * Validation utilities
 */

/**
 * Validate Code field
 * Rules:
 * - In hoa
 * - Không được chứa ký tự đặc biệt ngoài "_"
 * - Không được chứa dấu tiếng Việt
 * - Không chứa khoảng trắng
 */
export const validateCode = (_: unknown, value: string) => {
  if (!value) {
    return Promise.resolve()
  }

  // Kiểm tra khoảng trắng
  if (/\s/.test(value)) {
    return Promise.reject(new Error('Mã không được chứa khoảng trắng'))
  }

  // Kiểm tra ký tự đặc biệt (chỉ cho phép chữ, số và dấu gạch dưới)
  if (!/^[A-Z0-9_]+$/.test(value)) {
    return Promise.reject(new Error('Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới (_)'))
  }

  // Kiểm tra dấu tiếng Việt (các ký tự có dấu)
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/
  if (vietnamesePattern.test(value)) {
    return Promise.reject(new Error('Mã không được chứa dấu tiếng Việt'))
  }

  return Promise.resolve()
}

/**
 * Filter và normalize Code value khi nhập
 * - Chuyển thành chữ hoa
 * - Loại bỏ khoảng trắng
 * - Chỉ giữ lại chữ, số và dấu gạch dưới
 */
export const normalizeCode = (value: string): string => {
  if (!value) return value

  // Chuyển thành chữ hoa
  let normalized = value.toUpperCase()

  // Loại bỏ khoảng trắng
  normalized = normalized.replace(/\s/g, '')

  // Chỉ giữ lại chữ, số và dấu gạch dưới
  normalized = normalized.replace(/[^A-Z0-9_]/g, '')

  return normalized
}

