# TÀI LIỆU NGHIỆP VỤ - MASTER DATA

## 1. TỔNG QUAN

Master Data là các danh mục cơ bản của hệ thống, được sử dụng làm dữ liệu tham chiếu cho các nghiệp vụ khác. Tất cả Master Data đều có các đặc điểm chung:

- Có trường `Code` (string) để làm khóa import/export
- Có trường `Status` (A = Active, I = InActive)
- Hỗ trợ CRUD đầy đủ
- Hỗ trợ Import/Export Excel
- Tìm kiếm và lọc nâng cao

## 2. DANH MỤC LOẠI XE (VehicleType)

### 2.1. Mô tả

Quản lý các loại xe như: Sedan, SUV, Hatchback, Coupe, Convertible, v.v.

### 2.2. Entity: VehicleType

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả            |
| ------------ | ------------ | ------------------------ | ---------------- |
| Id           | int          | PK, Identity             | Khóa chính       |
| Code         | string(50)   | Required, Unique         | Mã loại xe       |
| Name         | string(200)  | Required                 | Tên loại xe      |
| Description  | string(500)  | Optional                 | Mô tả            |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái (A/I) |
| CreatedDate  | DateTime     | Required                 | Ngày tạo         |
| CreatedBy    | string(100)  | Optional                 | Người tạo        |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa         |
| ModifiedBy   | string(100)  | Optional                 | Người sửa        |
| IsDeleted    | bool         | Required, Default: false | Đã xóa           |

### 2.3. Giao diện

#### 2.3.1. Màn hình danh sách

- **Layout:** Table với Ant Design Table component
- **Cột hiển thị:**
  - STT (số thứ tự)
  - Mã (Code)
  - Tên (Name)
  - Mô tả (Description)
  - Trạng thái (Status) - Badge màu xanh (Active) / đỏ (InActive)
  - Thao tác (Actions)
- **Chức năng:**
  - Tìm kiếm: Search box ở đầu bảng, tìm theo Code, Name
  - **Bộ lọc nâng cao:** Hiển thị ngay trên lưới (không phải modal), có nút ẩn/hiện
    - **Vị trí:** Nằm giữa toolbar và bảng dữ liệu
    - **Giao diện:** Card với title "Bộ lọc nâng cao", có nút đóng và nút "Xóa bộ lọc"
    - **Các loại filter:**
      - **Text input:** Nhập giá trị và nhấn Enter để áp dụng filter (ví dụ: Mã, Tên, Mô tả, Quốc gia)
      - **Select box:** Chọn giá trị từ dropdown, filter được áp dụng ngay khi chọn (ví dụ: Trạng thái)
    - **Filter theo cột:**
      - Mã (Code): Text input, filter theo mã
      - Tên (Name): Text input, filter theo tên
      - Trạng thái (Status): Select box với options "Hoạt động" (A) / "Không hoạt động" (I)
      - Mô tả (Description): Text input, filter theo mô tả
      - Quốc gia (Country): Text input, chỉ có ở VehicleBrand
    - **Chức năng:**
      - Nút ẩn/hiện: Click để ẩn hoặc hiển thị bộ lọc
      - Nút hiển thị số lượng filter đang active khi bộ lọc bị ẩn
      - Nút "Xóa bộ lọc": Xóa tất cả filter đang áp dụng
      - Khi nhấn nút Refresh: Tự động xóa tất cả bộ lọc nâng cao
      - Filter được gửi về backend qua query params (filterCode, filterName, filterStatus, etc.)
  - Phân trang: 10, 20, 50, 100 records/page
  - Sắp xếp: Click header để sort
  - **Làm mới dữ liệu:** Nút Refresh (icon ReloadOutlined, background trắng) ở bên trái nút "Thêm mới"
    - Chức năng: Refresh lưới dữ liệu, xóa bỏ tất cả bộ lọc và tìm kiếm đang áp dụng
    - Reset về trang đầu tiên, xóa search term, xóa advanced filters, invalidate cache và refetch data
  - Thêm mới: Button "Thêm mới" ở góc trên phải
  - Sửa: Icon edit trong cột Actions
  - Xóa: Icon delete trong cột Actions (confirm dialog)
  - Tạo bản sao: Icon copy trong cột Actions
  - Export Excel: Button "Xuất Excel"
  - Import Excel: Button "Nhập Excel" (mở modal upload file)

#### 2.3.2. Màn hình thêm mới/sửa

- **Layout:** Modal hoặc Drawer
- **Form fields:**
  - Mã (Code): Input, required, max 50 ký tự, disabled khi sửa
  - Tên (Name): Input, required, max 200 ký tự
  - Mô tả (Description): TextArea, max 500 ký tự
  - Trạng thái (Status): Radio hoặc Switch (Active/InActive)
- **Actions:**
  - Lưu: Validate và submit
  - Hủy: Đóng form

### 2.4. API Endpoints

```
GET    /api/vehicle-types              # Lấy danh sách (có pagination, filter, search)
GET    /api/vehicle-types/{id}         # Lấy chi tiết
POST   /api/vehicle-types              # Tạo mới
PUT    /api/vehicle-types/{id}         # Cập nhật
DELETE /api/vehicle-types/{id}         # Xóa (soft delete)
POST   /api/vehicle-types/import       # Import Excel
GET    /api/vehicle-types/export       # Export Excel
POST   /api/vehicle-types/{id}/copy    # Tạo bản sao
```

## 3. DANH MỤC HÃNG XE (VehicleBrand)

### 3.1. Mô tả

Quản lý các hãng xe như: Toyota, Honda, Ford, BMW, Mercedes-Benz, v.v.

### 3.2. Entity: VehicleBrand

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả       |
| ------------ | ------------ | ------------------------ | ----------- |
| Id           | int          | PK, Identity             | Khóa chính  |
| Code         | string(50)   | Required, Unique         | Mã hãng xe  |
| Name         | string(200)  | Required                 | Tên hãng xe |
| Country      | string(100)  | Optional                 | Quốc gia    |
| Logo         | string(500)  | Optional                 | URL logo    |
| Description  | string(500)  | Optional                 | Mô tả       |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái  |
| CreatedDate  | DateTime     | Required                 | Ngày tạo    |
| CreatedBy    | string(100)  | Optional                 | Người tạo   |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa    |
| ModifiedBy   | string(100)  | Optional                 | Người sửa   |
| IsDeleted    | bool         | Required, Default: false | Đã xóa      |

### 3.3. Giao diện

#### 3.3.1. Màn hình danh sách

Tương tự như VehicleType, thêm cột:

- Quốc gia (Country)
- Logo (hình ảnh thumbnail)

**Chức năng:** Tương tự VehicleType, có nút Refresh để làm mới dữ liệu và xóa bộ lọc

## 4. DANH MỤC MÀU XE (VehicleColor)

### 4.1. Mô tả

Quản lý màu sắc xe: Đỏ, Xanh, Đen, Trắng, Bạc, v.v.

### 4.2. Entity: VehicleColor

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả                |
| ------------ | ------------ | ------------------------ | -------------------- |
| Id           | int          | PK, Identity             | Khóa chính           |
| Code         | string(50)   | Required, Unique         | Mã màu               |
| Name         | string(200)  | Required                 | Tên màu              |
| HexCode      | string(7)    | Optional                 | Mã màu hex (#RRGGBB) |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái           |
| CreatedDate  | DateTime     | Required                 | Ngày tạo             |
| CreatedBy    | string(100)  | Optional                 | Người tạo            |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa             |
| ModifiedBy   | string(100)  | Optional                 | Người sửa            |
| IsDeleted    | bool         | Required, Default: false | Đã xóa               |

### 4.3. Giao diện

#### 4.3.1. Màn hình danh sách

Tương tự VehicleType, thêm:

- Mã màu (HexCode): Color picker

**Chức năng:** Tương tự VehicleType, có nút Refresh để làm mới dữ liệu và xóa bộ lọc

## 5. DANH MỤC KHÁCH HÀNG (Customer)

### 5.1. Mô tả

Quản lý thông tin khách hàng thuê xe.

### 5.2. Entity: Customer

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả                             |
| ------------ | ------------ | ------------------------ | --------------------------------- |
| Id           | int          | PK, Identity             | Khóa chính                        |
| Code         | string(50)   | Required, Unique         | Mã khách hàng (tự động: KH000001) |
| FullName     | string(200)  | Required                 | Họ và tên                         |
| Email        | string(200)  | Required, Unique         | Email                             |
| Phone        | string(20)   | Required                 | Số điện thoại                     |
| Address      | string(500)  | Optional                 | Địa chỉ                           |
| IdentityCard | string(20)   | Optional, Unique         | CMND/CCCD                         |
| DateOfBirth  | DateTime?    | Optional                 | Ngày sinh                         |
| Gender       | string(1)    | Optional                 | Giới tính (M/F/O)                 |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái                        |
| CreatedDate  | DateTime     | Required                 | Ngày tạo                          |
| CreatedBy    | string(100)  | Optional                 | Người tạo                         |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa                          |
| ModifiedBy   | string(100)  | Optional                 | Người sửa                         |
| IsDeleted    | bool         | Required, Default: false | Đã xóa                            |

### 5.3. Giao diện

#### 5.3.1. Màn hình danh sách

- **Cột hiển thị:**
  - STT
  - Mã khách hàng (Code)
  - Họ tên (FullName)
  - Email
  - Số điện thoại (Phone)
  - CMND/CCCD (IdentityCard)
  - Trạng thái (Status)
  - Thao tác (Actions)
- **Chức năng:** Tương tự VehicleType, có nút Refresh để làm mới dữ liệu và xóa bộ lọc

#### 5.3.2. Màn hình thêm mới/sửa

- **Form fields:**
  - Mã khách hàng: Auto generate, disabled
  - Họ và tên: Required
  - Email: Required, validate email format
  - Số điện thoại: Required, validate phone format
  - Địa chỉ: Optional
  - CMND/CCCD: Optional, validate format
  - Ngày sinh: DatePicker
  - Giới tính: Radio (Nam/Nữ/Khác)
  - Trạng thái: Switch

## 6. DANH MỤC NHÂN VIÊN (Employee)

### 6.1. Mô tả

Quản lý nhân viên của công ty (khác với User - tài khoản đăng nhập).

### 6.2. Entity: Employee

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả                   |
| ------------ | ------------ | ------------------------ | ----------------------- |
| Id           | int          | PK, Identity             | Khóa chính              |
| Code         | string(50)   | Required, Unique         | Mã nhân viên (NV000001) |
| FullName     | string(200)  | Required                 | Họ và tên               |
| Email        | string(200)  | Required, Unique         | Email                   |
| Phone        | string(20)   | Required                 | Số điện thoại           |
| Address      | string(500)  | Optional                 | Địa chỉ                 |
| Position     | string(100)  | Optional                 | Chức vụ                 |
| Department   | string(100)  | Optional                 | Phòng ban               |
| HireDate     | DateTime?    | Optional                 | Ngày vào làm            |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái              |
| CreatedDate  | DateTime     | Required                 | Ngày tạo                |
| CreatedBy    | string(100)  | Optional                 | Người tạo               |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa                |
| ModifiedBy   | string(100)  | Optional                 | Người sửa               |
| IsDeleted    | bool         | Required, Default: false | Đã xóa                  |

### 6.3. Giao diện

#### 6.3.1. Màn hình danh sách

Tương tự Customer, thêm:

- Chức vụ (Position)
- Phòng ban (Department)
- Ngày vào làm (HireDate)

**Chức năng:** Tương tự VehicleType, có nút Refresh để làm mới dữ liệu và xóa bộ lọc

## 7. CẤU HÌNH HỆ THỐNG (SystemConfig)

### 7.1. Mô tả

Quản lý các cấu hình hệ thống như: Tên công ty, Địa chỉ, Số điện thoại, Email, Logo, v.v.

### 7.2. Entity: SystemConfig

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả         |
| ------------ | ------------ | ------------------------ | ------------- |
| Id           | int          | PK, Identity             | Khóa chính    |
| Code         | string(50)   | Required, Unique         | Mã cấu hình   |
| Name         | string(200)  | Required                 | Tên cấu hình  |
| Value        | string(1000) | Optional                 | Giá trị       |
| Description  | string(500)  | Optional                 | Mô tả         |
| Category     | string(100)  | Optional                 | Nhóm cấu hình |
| Status       | string(1)    | Required, Default: 'A'   | Trạng thái    |
| CreatedDate  | DateTime     | Required                 | Ngày tạo      |
| CreatedBy    | string(100)  | Optional                 | Người tạo     |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa      |
| ModifiedBy   | string(100)  | Optional                 | Người sửa     |
| IsDeleted    | bool         | Required, Default: false | Đã xóa        |

### 7.3. Giao diện

- Hiển thị dạng form với các nhóm cấu hình
- Chỉ Admin mới được chỉnh sửa

## 8. CHỨC NĂNG CHUNG CHO TẤT CẢ MASTER DATA

### 8.1. Bộ lọc nâng cao (Advanced Filter)

- **Component:** `AdvancedFilter` - Component tái sử dụng trong `frontend/src/components/common/AdvancedFilter.tsx`
- **Vị trí:** Hiển thị ngay trên lưới dữ liệu, giữa toolbar và bảng
- **Giao diện:**
  - Card với title "Bộ lọc nâng cao"
  - Layout responsive: Grid layout với Row/Col (xs=24, sm=12, md=8, lg=6)
  - Nút ẩn/hiện: Button với icon FilterOutlined, hiển thị số lượng filter active khi có filter
  - Nút đóng: Button với icon CloseOutlined ở góc trên phải
  - Nút "Xóa bộ lọc": Button để clear tất cả filters
- **Loại filter:**
  - **Text input:** 
    - Nhập giá trị và nhấn Enter để áp dụng filter
    - Có placeholder hướng dẫn
    - Có nút clear (allowClear)
  - **Select box:**
    - Chọn giá trị từ dropdown
    - Filter được áp dụng ngay khi chọn (onChange)
    - Có nút clear (allowClear)
- **Cấu hình filter:**
  - Mỗi entity có danh sách filter configs riêng
  - Filter config bao gồm: key, label, type, options (cho select), placeholder
- **Tích hợp với backend:**
  - Filter params được gửi qua query string: `filterCode`, `filterName`, `filterStatus`, `filterCountry`, `filterDescription`
  - Backend `PagedRequest` đã được mở rộng để nhận các filter params
  - Backend services xử lý filter theo từng cột (case-insensitive, contains search cho text)
- **Tương tác với Refresh:**
  - Khi nhấn nút Refresh, tất cả advanced filters được xóa
  - Reset về trang đầu tiên sau khi clear filters

### 8.2. Làm mới dữ liệu (Refresh)

- **Vị trí:** Nút Refresh nằm bên trái nút "Thêm mới" trong toolbar
- **Giao diện:**
  - Icon: `ReloadOutlined` từ Ant Design Icons
  - Background: Màu trắng (#fff)
  - Border: Màu xám nhạt (#d9d9d9)
  - Không có text, chỉ có icon
  - Có tooltip: "Làm mới dữ liệu và xóa bộ lọc"
- **Chức năng:**
  - Reset search term về rỗng
  - Reset pagination về trang đầu tiên (giữ nguyên pageSize)
  - Invalidate query cache để force refetch
  - Hiển thị loading state khi đang refresh
- **Component:** `RefreshButton` - Component tái sử dụng trong `frontend/src/components/common/RefreshButton.tsx`

### 8.3. Import Excel

- **Format:** File Excel (.xlsx)
- **Cột bắt buộc:** Code
- **Logic:**
  - Nếu Code đã tồn tại: Cập nhật
  - Nếu Code chưa tồn tại: Tạo mới
- **Validation:** Validate dữ liệu trước khi import
- **Kết quả:** Hiển thị số lượng thành công/thất bại

### 8.4. Export Excel

- Export tất cả dữ liệu (hoặc theo filter)
- Format chuẩn, có header
- Tên file: `{EntityName}_{DateTime}.xlsx`

### 8.5. Tạo bản sao

- Copy tất cả thông tin (trừ Code - tự generate mới)
- Mở form với dữ liệu đã copy, cho phép chỉnh sửa

### 8.6. Xóa

- Soft delete (IsDeleted = true)
- Không xóa nếu đang được sử dụng ở các bảng khác (check foreign key)

## 9. LUỒNG XỬ LÝ

### 9.1. Thêm mới

1. User click "Thêm mới"
2. Mở form trống
3. Nhập thông tin (Code tự động hoặc nhập thủ công)
4. Validate
5. Submit → API POST
6. Thành công → Refresh danh sách, đóng form

### 9.2. Sửa

1. User click icon Edit
2. Mở form với dữ liệu hiện tại
3. Chỉnh sửa (Code disabled)
4. Validate
5. Submit → API PUT
6. Thành công → Refresh danh sách, đóng form

### 9.3. Xóa

1. User click icon Delete
2. Hiển thị confirm dialog
3. Xác nhận → API DELETE
4. Thành công → Refresh danh sách

### 9.4. Import Excel

1. User click "Nhập Excel"
2. Mở modal upload file
3. Chọn file Excel
4. Preview dữ liệu (optional)
5. Click "Import"
6. Hiển thị progress
7. Hiển thị kết quả (success/error list)
8. Refresh danh sách

## 10. YÊU CẦU KỸ THUẬT

### 10.1. Backend

- Repository pattern với Generic Repository
- Service layer xử lý business logic
- Validation với FluentValidation
- AutoMapper cho DTO mapping
- EPPlus hoặc ClosedXML cho Excel

### 10.2. Frontend

- TanStack Query cho data fetching và caching
- Ant Design Table với custom pagination, filter
- Form validation với Ant Design Form
- Excel import/export với xlsx library
- Loading states và error handling
