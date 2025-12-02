# TÀI LIỆU NGHIỆP VỤ - QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN

## 1. TỔNG QUAN

Quản lý tài khoản người dùng đăng nhập hệ thống, phân quyền theo vai trò (Role), và các chức năng bảo mật như đăng nhập, đăng xuất, đổi mật khẩu qua email.

## 2. NGƯỜI DÙNG (User)

### 2.1. Mô tả

Tài khoản đăng nhập hệ thống (khác với Employee - nhân viên trong danh mục).

### 2.2. Entity: User

| Tên cột             | Kiểu dữ liệu | Ràng buộc                     | Mô tả                    |
| ------------------- | ------------ | ----------------------------- | ------------------------ |
| Id                  | int          | PK, Identity                  | Khóa chính               |
| Username            | string(100)  | Required, Unique              | Tên đăng nhập            |
| Email               | string(200)  | Required, Unique              | Email                    |
| PasswordHash        | string(500)  | Required                      | Mật khẩu đã hash         |
| FullName            | string(200)  | Required                      | Họ và tên                |
| Phone               | string(20)   | Optional                      | Số điện thoại            |
| Role                | string(20)   | Required, Default: 'Employee' | Vai trò (Admin/Employee) |
| IsActive            | bool         | Required, Default: true       | Đang hoạt động           |
| IsLocked            | bool         | Required, Default: false      | Đã khóa                  |
| LockedUntil         | DateTime?    | Optional                      | Khóa đến ngày            |
| LastLoginDate       | DateTime?    | Optional                      | Lần đăng nhập cuối       |
| FailedLoginAttempts | int          | Required, Default: 0          | Số lần đăng nhập sai     |
| EmployeeId          | int?         | Optional, FK                  | Liên kết với Employee    |
| CreatedDate         | DateTime     | Required                      | Ngày tạo                 |
| CreatedBy           | string(100)  | Optional                      | Người tạo                |
| ModifiedDate        | DateTime?    | Optional                      | Ngày sửa                 |
| ModifiedBy          | string(100)  | Optional                      | Người sửa                |
| IsDeleted           | bool         | Required, Default: false      | Đã xóa                   |

**Foreign Keys:**

- EmployeeId → Employee.Id

### 2.3. Vai trò (Role)

| Giá trị  | Mô tả         | Quyền hạn                                                                                                                            |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Admin    | Quản trị viên | Tất cả quyền: Quản lý người dùng, Cấu hình hệ thống, Tất cả master data, Tất cả nghiệp vụ, Báo cáo                                   |
| Employee | Nhân viên     | Xem master data, Quản lý cho thuê xe, Quản lý xe, Quản lý khách hàng, Xem hóa đơn, Không được: Quản lý người dùng, Cấu hình hệ thống |

### 2.4. Giao diện

#### 2.4.1. Màn hình danh sách người dùng (Chỉ Admin)

- **Layout:** Table với Ant Design Table
- **Cột hiển thị:**
  - STT
  - Tên đăng nhập (Username)
  - Email
  - Họ tên (FullName)
  - Vai trò (Role) - Badge
  - Trạng thái (IsActive) - Badge (Hoạt động/Khóa)
  - Lần đăng nhập cuối (LastLoginDate)
  - Thao tác (Actions)
- **Chức năng:**
  - Tìm kiếm: Theo username, email, họ tên
  - Lọc nâng cao:
    - Vai trò
    - Trạng thái (Hoạt động/Khóa)
  - Phân trang
  - Sắp xếp
  - Thêm mới
  - Sửa
  - Xóa (soft delete)
  - Khóa/Mở khóa tài khoản
  - Đặt lại mật khẩu

#### 2.4.2. Màn hình thêm mới/sửa người dùng

- **Layout:** Modal hoặc Drawer
- **Form fields:**
  - Tên đăng nhập (Username): Required, Unique, Min: 3, Max: 100
  - Email: Required, Unique, Validate email format
  - Mật khẩu: Password input (chỉ khi thêm mới hoặc đặt lại)
    - Min: 8 ký tự
    - Có chữ hoa, chữ thường, số
  - Xác nhận mật khẩu: Password input
  - Họ tên: Required
  - Số điện thoại: Optional, Validate format
  - Vai trò: Select (Admin/Employee), Required
  - Nhân viên: Select (Employee) - Optional, liên kết với Employee
  - Trạng thái: Switch (Hoạt động/Khóa)
- **Actions:**
  - Lưu
  - Hủy

#### 2.4.3. Màn hình đặt lại mật khẩu

- **Layout:** Modal
- **Form fields:**
  - Mật khẩu mới: Password input, Required
  - Xác nhận mật khẩu: Password input, Required
- **Actions:**
  - Đặt lại
  - Hủy

## 3. ĐĂNG NHẬP (Login)

### 3.1. Mô tả

Xác thực người dùng và cấp JWT token.

### 3.2. Giao diện

#### 3.2.1. Màn hình đăng nhập

- **Layout:** Centered form, đẹp mắt
- **Form fields:**
  - Tên đăng nhập hoặc Email: Input, Required
  - Mật khẩu: Password input, Required
  - Ghi nhớ đăng nhập: Checkbox
  - Link "Quên mật khẩu?"
- **Actions:**
  - Đăng nhập: Button primary
- **Validation:**
  - Kiểm tra username/email và password
  - Kiểm tra IsActive = true
  - Kiểm tra IsLocked = false hoặc LockedUntil < Now
  - Nếu sai: Tăng FailedLoginAttempts
  - Nếu FailedLoginAttempts >= 5: Khóa tài khoản 30 phút

### 3.3. API Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
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

## 4. ĐĂNG XUẤT (Logout)

### 4.1. Mô tả

Đăng xuất và vô hiệu hóa token.

### 4.2. Giao diện

- Button "Đăng xuất" ở Header
- Confirm dialog (optional)
- Clear token và redirect về trang đăng nhập

## 5. ĐỔI MẬT KHẨU QUA EMAIL

### 5.1. Mô tả

Cho phép người dùng đặt lại mật khẩu qua email khi quên mật khẩu.

### 5.2. Entity: PasswordResetToken

| Tên cột     | Kiểu dữ liệu | Ràng buộc                | Mô tả                 |
| ----------- | ------------ | ------------------------ | --------------------- |
| Id          | int          | PK, Identity             | Khóa chính            |
| UserId      | int          | Required, FK             | Người dùng            |
| Token       | string(500)  | Required, Unique         | Token reset           |
| ExpiryDate  | DateTime     | Required                 | Ngày hết hạn (24 giờ) |
| IsUsed      | bool         | Required, Default: false | Đã sử dụng            |
| CreatedDate | DateTime     | Required                 | Ngày tạo              |

**Foreign Keys:**

- UserId → User.Id

### 5.3. Giao diện

#### 5.3.1. Màn hình quên mật khẩu

- **Layout:** Centered form
- **Form fields:**
  - Email: Input, Required, Validate email
- **Actions:**
  - Gửi email đặt lại mật khẩu
- **Logic:**
  1. Validate email tồn tại trong hệ thống
  2. Tạo PasswordResetToken
  3. Gửi email với link reset (VD: /reset-password?token=xxx)
  4. Hiển thị thông báo: "Đã gửi email, vui lòng kiểm tra hộp thư"

#### 5.3.2. Màn hình đặt lại mật khẩu

- **Layout:** Centered form
- **URL:** /reset-password?token={token}
- **Form fields:**
  - Mật khẩu mới: Password input, Required, Min: 8
  - Xác nhận mật khẩu: Password input, Required
- **Actions:**
  - Đặt lại mật khẩu
- **Logic:**
  1. Validate token (tồn tại, chưa hết hạn, chưa sử dụng)
  2. Validate mật khẩu mới
  3. Hash mật khẩu mới
  4. Cập nhật User.PasswordHash
  5. Đánh dấu PasswordResetToken.IsUsed = true
  6. Redirect về trang đăng nhập

### 5.4. Email Template

- **Subject:** "Đặt lại mật khẩu - DriveNow"
- **Body:** HTML email đẹp với:
  - Logo công ty
  - Lời chào
  - Link đặt lại mật khẩu (có token)
  - Thời hạn link (24 giờ)
  - Lưu ý bảo mật

### 5.5. Thư viện Email

- **MailKit:** Miễn phí, hỗ trợ SMTP
- **FluentEmail:** Wrapper dễ sử dụng hơn
- **Cấu hình:** SMTP Gmail hoặc SMTP server khác

## 6. ĐỔI MẬT KHẨU (Change Password)

### 6.1. Mô tả

Người dùng đổi mật khẩu khi đã đăng nhập.

### 6.2. Giao diện

#### 6.2.1. Màn hình đổi mật khẩu

- **Layout:** Modal hoặc Page trong Profile
- **Form fields:**
  - Mật khẩu hiện tại: Password input, Required
  - Mật khẩu mới: Password input, Required, Min: 8
  - Xác nhận mật khẩu mới: Password input, Required
- **Actions:**
  - Đổi mật khẩu
  - Hủy
- **Logic:**
  1. Validate mật khẩu hiện tại đúng
  2. Validate mật khẩu mới (khác mật khẩu cũ)
  3. Hash mật khẩu mới
  4. Cập nhật User.PasswordHash
  5. Thành công → Thông báo, đóng form

## 7. JWT AUTHENTICATION

### 7.1. Access Token

- **Expiration:** 60 phút
- **Claims:**
  - UserId
  - Username
  - Email
  - Role
  - FullName

### 7.2. Refresh Token

- **Expiration:** 7 ngày
- **Storage:** Database (bảng RefreshToken)
- **Logic:**
  - Khi đăng nhập: Tạo cả AccessToken và RefreshToken
  - Khi AccessToken hết hạn: Dùng RefreshToken để lấy AccessToken mới
  - Khi đăng xuất: Xóa RefreshToken

### 7.3. Entity: RefreshToken

| Tên cột     | Kiểu dữ liệu | Ràng buộc                | Mô tả         |
| ----------- | ------------ | ------------------------ | ------------- |
| Id          | int          | PK, Identity             | Khóa chính    |
| UserId      | int          | Required, FK             | Người dùng    |
| Token       | string(500)  | Required, Unique         | Refresh token |
| ExpiryDate  | DateTime     | Required                 | Ngày hết hạn  |
| IsRevoked   | bool         | Required, Default: false | Đã thu hồi    |
| CreatedDate | DateTime     | Required                 | Ngày tạo      |

**Foreign Keys:**

- UserId → User.Id

## 8. PHÂN QUYỀN

### 8.1. Quyền Admin

- ✅ Quản lý người dùng (CRUD)
- ✅ Cấu hình hệ thống
- ✅ Tất cả Master Data (CRUD, Import/Export)
- ✅ Quản lý xe (CRUD, Xuất/Nhập bãi, Bảo dưỡng)
- ✅ Quản lý cho thuê xe (Tất cả chức năng)
- ✅ Quản lý hóa đơn và thanh toán
- ✅ Dashboard và báo cáo (Tất cả)
- ✅ Export báo cáo

### 8.2. Quyền Employee

- ❌ Quản lý người dùng
- ❌ Cấu hình hệ thống
- ✅ Xem Master Data (chỉ xem, không sửa/xóa)
- ✅ Quản lý xe (Xem, Xuất/Nhập bãi)
- ✅ Quản lý cho thuê xe (Tạo, Xác nhận, Bắt đầu, Hoàn thành)
- ✅ Xem hóa đơn (không được xóa)
- ✅ Tạo thanh toán
- ✅ Xem Dashboard (giới hạn)
- ✅ Xem báo cáo (không export)

### 8.3. Implementation

- **Backend:** Sử dụng `[Authorize(Roles = "Admin")]` attribute
- **Frontend:** Kiểm tra role trong Redux store, ẩn/hiện menu và buttons

## 9. API ENDPOINTS

### Auth

```
POST   /api/auth/login                   # Đăng nhập
POST   /api/auth/logout                  # Đăng xuất
POST   /api/auth/refresh                 # Refresh token
POST   /api/auth/forgot-password         # Quên mật khẩu
POST   /api/auth/reset-password         # Đặt lại mật khẩu
POST   /api/auth/change-password        # Đổi mật khẩu (cần đăng nhập)
GET    /api/auth/me                     # Thông tin user hiện tại
```

### User (Chỉ Admin)

```
GET    /api/users                        # Danh sách
GET    /api/users/{id}                   # Chi tiết
POST   /api/users                        # Tạo mới
PUT    /api/users/{id}                   # Cập nhật
DELETE /api/users/{id}                   # Xóa
POST   /api/users/{id}/lock              # Khóa tài khoản
POST   /api/users/{id}/unlock            # Mở khóa
POST   /api/users/{id}/reset-password    # Đặt lại mật khẩu
```

## 10. LUỒNG XỬ LÝ

### 10.1. Đăng nhập

1. User nhập username/email và password
2. Validate input
3. Tìm User theo username/email
4. Kiểm tra IsActive = true
5. Kiểm tra IsLocked = false hoặc LockedUntil < Now
6. Verify password (BCrypt hoặc ASP.NET Identity)
7. Nếu đúng:
   - Tạo AccessToken và RefreshToken
   - Cập nhật LastLoginDate, FailedLoginAttempts = 0
   - Return tokens và user info
8. Nếu sai:
   - Tăng FailedLoginAttempts
   - Nếu >= 5: Khóa tài khoản 30 phút (IsLocked = true, LockedUntil = Now + 30 phút)
   - Return error

### 10.2. Quên mật khẩu

1. User nhập email
2. Tìm User theo email
3. Tạo PasswordResetToken (token random, expiry = 24 giờ)
4. Gửi email với link reset
5. Return success message

### 10.3. Đặt lại mật khẩu

1. User click link trong email (có token)
2. Validate token (tồn tại, chưa hết hạn, chưa dùng)
3. User nhập mật khẩu mới
4. Hash mật khẩu
5. Cập nhật User.PasswordHash
6. Đánh dấu PasswordResetToken.IsUsed = true
7. Return success

## 11. YÊU CẦU KỸ THUẬT

### 11.1. Backend

- Password hashing: BCrypt.Net hoặc ASP.NET Identity PasswordHasher
- JWT token generation với secret key mạnh
- Refresh token rotation (tạo token mới khi refresh)
- Email service với SMTP
- Lock mechanism khi đăng nhập sai nhiều lần
- CORS configuration cho frontend

### 11.2. Frontend

- Lưu AccessToken trong memory (không localStorage để bảo mật hơn)
- Lưu RefreshToken trong httpOnly cookie (nếu có thể)
- Axios interceptor để tự động refresh token
- Protected routes với React Router
- Role-based UI (ẩn/hiện menu, buttons)
- Auto logout khi token hết hạn
