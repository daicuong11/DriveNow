# Hướng dẫn sử dụng Swagger với JWT Authentication

## Vấn đề: Lỗi 401 Unauthorized khi gọi API sau khi login

### Nguyên nhân có thể:
1. Token không được gửi đúng format trong Swagger
2. Token đã hết hạn
3. Token không được đọc từ Authorization header

## Cách sử dụng JWT trong Swagger:

### Bước 1: Login để lấy token
1. Mở Swagger UI tại: `http://localhost:5151`
2. Tìm endpoint `POST /api/auth/login`
3. Click "Try it out"
4. Nhập thông tin:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
5. Click "Execute"
6. Copy giá trị `accessToken` từ response

### Bước 2: Authorize trong Swagger
1. Click nút **"Authorize"** (🔒) ở góc trên bên phải Swagger UI
2. Trong hộp "Value", nhập: `Bearer {your-token}`
   - **QUAN TRỌNG**: Phải có từ "Bearer" và một khoảng trắng trước token
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click "Authorize"
4. Click "Close"

### Bước 3: Test API
1. Bây giờ bạn có thể gọi bất kỳ API nào có `[Authorize]`
2. Token sẽ tự động được gửi trong header `Authorization: Bearer {token}`

## Troubleshooting:

### Nếu vẫn bị 401:
1. **Kiểm tra token format**: Phải là `Bearer {token}`, không chỉ `{token}`
2. **Kiểm tra token expiry**: Token có thể đã hết hạn (mặc định 60 phút)
3. **Kiểm tra logs**: Xem console logs để biết lỗi chi tiết
4. **Thử login lại**: Lấy token mới và authorize lại

### Kiểm tra token trong Response:
Sau khi login, response sẽ có dạng:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@drivenow.com",
      "fullName": "Administrator",
      "role": "Admin"
    }
  }
}
```

Copy `accessToken` và dùng trong Swagger Authorize.

## Lưu ý:
- Token mặc định có thời gian sống 60 phút
- Sau khi token hết hạn, cần login lại hoặc dùng refresh token endpoint
- Trong production, nên giảm thời gian sống của token để tăng bảo mật

