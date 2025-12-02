# TÀI LIỆU NGHIỆP VỤ - QUẢN LÝ CHO THUÊ XE

## 1. TỔNG QUAN

Quản lý toàn bộ quy trình cho thuê xe từ khi tạo đơn thuê đến khi hoàn thành và xuất hóa đơn. Hệ thống sử dụng workflow để quản lý trạng thái đơn thuê.

## 2. ĐƠN THUÊ XE (RentalOrder)

### 2.1. Mô tả

Đơn thuê xe là đơn hàng chính trong hệ thống, quản lý việc khách hàng thuê xe.

### 2.2. Entity: RentalOrder

| Tên cột          | Kiểu dữ liệu  | Ràng buộc                  | Mô tả                           |
| ---------------- | ------------- | -------------------------- | ------------------------------- |
| Id               | int           | PK, Identity               | Khóa chính                      |
| OrderNumber      | string(50)    | Required, Unique           | Số đơn (tự động: RO20240101001) |
| CustomerId       | int           | Required, FK               | Khách hàng                      |
| VehicleId        | int           | Required, FK               | Xe thuê                         |
| EmployeeId       | int           | Required, FK               | Nhân viên tạo đơn               |
| StartDate        | DateTime      | Required                   | Ngày bắt đầu thuê               |
| EndDate          | DateTime      | Required                   | Ngày kết thúc thuê              |
| ActualStartDate  | DateTime?     | Optional                   | Ngày bắt đầu thực tế            |
| ActualEndDate    | DateTime?     | Optional                   | Ngày kết thúc thực tế           |
| PickupLocation   | string(200)   | Required                   | Địa điểm nhận xe                |
| ReturnLocation   | string(200)   | Required                   | Địa điểm trả xe                 |
| DailyRentalPrice | decimal(18,2) | Required                   | Giá thuê/ngày                   |
| TotalDays        | int           | Required                   | Tổng số ngày thuê               |
| SubTotal         | decimal(18,2) | Required                   | Tổng tiền (chưa giảm giá)       |
| DiscountAmount   | decimal(18,2) | Optional, Default: 0       | Số tiền giảm giá                |
| PromotionCode    | string(50)    | Optional                   | Mã khuyến mãi                   |
| TotalAmount      | decimal(18,2) | Required                   | Tổng tiền (sau giảm giá)        |
| DepositAmount    | decimal(18,2) | Optional, Default: 0       | Tiền cọc                        |
| Status           | string(20)    | Required, Default: 'Draft' | Trạng thái đơn (xem 2.3)        |
| Notes            | string(1000)  | Optional                   | Ghi chú                         |
| CreatedDate      | DateTime      | Required                   | Ngày tạo                        |
| CreatedBy        | string(100)   | Optional                   | Người tạo                       |
| ModifiedDate     | DateTime?     | Optional                   | Ngày sửa                        |
| ModifiedBy       | string(100)   | Optional                   | Người sửa                       |
| IsDeleted        | bool          | Required, Default: false   | Đã xóa                          |

**Foreign Keys:**

- CustomerId → Customer.Id
- VehicleId → Vehicle.Id
- EmployeeId → Employee.Id

### 2.3. Trạng thái Đơn thuê (RentalStatus) - Workflow

| Giá trị    | Mô tả           | Màu sắc    | Có thể chuyển sang    |
| ---------- | --------------- | ---------- | --------------------- |
| Draft      | Nháp            | Xám        | Confirmed, Cancelled  |
| Confirmed  | Đã xác nhận     | Xanh dương | InProgress, Cancelled |
| InProgress | Đang cho thuê   | Vàng       | Completed, Cancelled  |
| Completed  | Đã hoàn thành   | Xanh lá    | Invoiced              |
| Invoiced   | Đã xuất hóa đơn | Tím        | -                     |
| Cancelled  | Đã hủy          | Đỏ         | -                     |

**Workflow Rules:**

- Draft → Confirmed: Xác nhận đơn, kiểm tra xe có sẵn
- Confirmed → InProgress: Khi khách nhận xe (ActualStartDate)
- InProgress → Completed: Khi khách trả xe (ActualEndDate)
- Completed → Invoiced: Khi xuất hóa đơn
- Bất kỳ → Cancelled: Hủy đơn (có thể hủy ở bất kỳ trạng thái nào)

### 2.4. Giao diện

#### 2.4.1. Màn hình danh sách đơn thuê

- **Layout:** Table với Ant Design Table
- **Cột hiển thị:**
  - STT
  - Số đơn (OrderNumber)
  - Khách hàng (Customer.FullName)
  - Xe (Vehicle.Code)
  - Ngày bắt đầu (StartDate)
  - Ngày kết thúc (EndDate)
  - Số ngày (TotalDays)
  - Tổng tiền (TotalAmount) - Format currency
  - Trạng thái (Status) - Badge màu
  - Thao tác (Actions)
- **Chức năng:**
  - Tìm kiếm: Theo số đơn, tên khách hàng, biển số xe
  - Lọc nâng cao:
    - Trạng thái
    - Khách hàng
    - Xe
    - Ngày tạo (từ - đến)
    - Ngày thuê (từ - đến)
    - Nhân viên
  - Phân trang
  - Sắp xếp
  - Thêm mới
  - Xem chi tiết
  - Sửa (chỉ khi Status = Draft)
  - Xóa (chỉ khi Status = Draft hoặc Cancelled)
  - Chuyển trạng thái (buttons theo workflow)
  - Xuất hóa đơn (khi Status = Completed)

#### 2.4.2. Màn hình tạo mới/sửa đơn thuê

- **Layout:** Modal hoặc Page (full screen)
- **Form fields:**
  - **Thông tin khách hàng:**
    - Khách hàng: Select (có thể tìm kiếm), Required
    - Button "Thêm khách hàng mới" (mở modal)
  - **Thông tin xe:**
    - Xe: Select (chỉ hiển thị xe Available), Required
    - Hiển thị thông tin xe: Model, Hãng, Màu, Giá thuê/ngày
  - **Thông tin thuê:**
    - Ngày bắt đầu: DatePicker, Required, Min: Today
    - Ngày kết thúc: DatePicker, Required, Min: StartDate
    - Địa điểm nhận xe: Input, Required
    - Địa điểm trả xe: Input, Required
  - **Thông tin giá:**
    - Giá thuê/ngày: Auto từ Vehicle, có thể chỉnh sửa
    - Số ngày: Auto tính từ StartDate và EndDate
    - Tổng tiền (chưa giảm): Auto tính = DailyRentalPrice \* TotalDays
    - Mã khuyến mãi: Input (có button "Áp dụng")
    - Số tiền giảm: Auto tính khi áp dụng promotion
    - Tổng tiền (sau giảm): Auto tính
    - Tiền cọc: Number, Optional
  - **Thông tin khác:**
    - Ghi chú: TextArea
- **Actions:**
  - Lưu nháp (Status = Draft)
  - Xác nhận (Status = Confirmed) - Validate và submit
  - Hủy

#### 2.4.3. Màn hình chi tiết đơn thuê

- **Layout:** Drawer hoặc Page
- **Tabs:**
  - Thông tin chung
  - Lịch sử thay đổi trạng thái
  - Thanh toán
  - Hóa đơn

### 2.5. Tính toán giá tự động

#### 2.5.1. Công thức

```
TotalDays = (EndDate - StartDate).Days + 1
SubTotal = DailyRentalPrice * TotalDays
DiscountAmount = Tính từ PromotionCode (nếu có)
TotalAmount = SubTotal - DiscountAmount
```

#### 2.5.2. Áp dụng khuyến mãi

- User nhập PromotionCode
- Validate code (còn hiệu lực, đúng điều kiện)
- Tính DiscountAmount theo loại promotion:
  - Percentage: DiscountAmount = SubTotal \* (Percentage / 100)
  - FixedAmount: DiscountAmount = FixedAmount
- Cập nhật TotalAmount

## 3. KHuyẾN MÃI (Promotion)

### 3.1. Mô tả

Quản lý các chương trình khuyến mãi và mã giảm giá.

### 3.2. Entity: Promotion

| Tên cột      | Kiểu dữ liệu  | Ràng buộc                | Mô tả                         |
| ------------ | ------------- | ------------------------ | ----------------------------- |
| Id           | int           | PK, Identity             | Khóa chính                    |
| Code         | string(50)    | Required, Unique         | Mã khuyến mãi                 |
| Name         | string(200)   | Required                 | Tên chương trình              |
| Type         | string(20)    | Required                 | Loại (Percentage/FixedAmount) |
| Value        | decimal(18,2) | Required                 | Giá trị (% hoặc số tiền)      |
| MinAmount    | decimal(18,2) | Optional                 | Đơn hàng tối thiểu            |
| MaxDiscount  | decimal(18,2) | Optional                 | Giảm tối đa (cho Percentage)  |
| StartDate    | DateTime      | Required                 | Ngày bắt đầu                  |
| EndDate      | DateTime      | Required                 | Ngày kết thúc                 |
| UsageLimit   | int?          | Optional                 | Giới hạn số lần sử dụng       |
| UsedCount    | int           | Required, Default: 0     | Số lần đã sử dụng             |
| Status       | string(1)     | Required, Default: 'A'   | Trạng thái (A/I)              |
| CreatedDate  | DateTime      | Required                 | Ngày tạo                      |
| CreatedBy    | string(100)   | Optional                 | Người tạo                     |
| ModifiedDate | DateTime?     | Optional                 | Ngày sửa                      |
| ModifiedBy   | string(100)   | Optional                 | Người sửa                     |
| IsDeleted    | bool          | Required, Default: false | Đã xóa                        |

### 3.3. Giao diện

#### 3.3.1. Màn hình danh sách khuyến mãi

- Tương tự Master Data
- Cột hiển thị: Code, Name, Type, Value, StartDate, EndDate, UsageLimit, UsedCount, Status

#### 3.3.2. Màn hình thêm mới/sửa

- **Form fields:**
  - Mã: Required, Unique
  - Tên: Required
  - Loại: Radio (Phần trăm/Số tiền cố định)
  - Giá trị: Number, Required
  - Đơn hàng tối thiểu: Number, Optional
  - Giảm tối đa: Number, Optional (chỉ khi Type = Percentage)
  - Ngày bắt đầu: DatePicker, Required
  - Ngày kết thúc: DatePicker, Required, Min: StartDate
  - Giới hạn sử dụng: Number, Optional
  - Trạng thái: Switch

### 3.4. Validation khi áp dụng

- Code phải tồn tại và Status = 'A'
- Ngày hiện tại phải trong khoảng StartDate - EndDate
- SubTotal >= MinAmount (nếu có)
- UsedCount < UsageLimit (nếu có)

## 4. LỊCH SỬ THAY ĐỔI TRẠNG THÁI (RentalStatusHistory)

### 4.1. Mô tả

Lưu lại lịch sử thay đổi trạng thái đơn thuê.

### 4.2. Entity: RentalStatusHistory

| Tên cột       | Kiểu dữ liệu | Ràng buộc    | Mô tả             |
| ------------- | ------------ | ------------ | ----------------- |
| Id            | int          | PK, Identity | Khóa chính        |
| RentalOrderId | int          | Required, FK | Đơn thuê          |
| OldStatus     | string(20)   | Optional     | Trạng thái cũ     |
| NewStatus     | string(20)   | Required     | Trạng thái mới    |
| ChangedDate   | DateTime     | Required     | Ngày giờ thay đổi |
| ChangedBy     | string(100)  | Optional     | Người thay đổi    |
| Notes         | string(500)  | Optional     | Ghi chú           |

**Foreign Keys:**

- RentalOrderId → RentalOrder.Id

### 4.3. Giao diện

- Hiển thị trong tab "Lịch sử" của màn hình chi tiết đơn thuê
- Timeline view
- Hiển thị: Trạng thái cũ → Trạng thái mới, Ngày giờ, Người thay đổi, Ghi chú

## 5. ĐỒNG BỘ VỚI QUẢN LÝ XE

### 5.1. Khi tạo đơn thuê (Status = Confirmed)

- Kiểm tra Vehicle.Status = Available
- Cập nhật Vehicle.Status = Rented (khi chuyển sang InProgress)
- Tạo VehicleHistory: ActionType = "Rented", ReferenceId = RentalOrderId

### 5.2. Khi khách nhận xe (Status = InProgress)

- Cập nhật RentalOrder.ActualStartDate = Now
- Cập nhật Vehicle.Status = Rented (nếu chưa)
- Cập nhật Vehicle.CurrentLocation = PickupLocation

### 5.3. Khi khách trả xe (Status = Completed)

- Cập nhật RentalOrder.ActualEndDate = Now
- Tính số ngày thực tế: ActualDays = (ActualEndDate - ActualStartDate).Days + 1
- Nếu ActualDays > TotalDays: Tính thêm phí (có thể tạo thêm bảng phụ phí)
- Cập nhật Vehicle.Status = Available
- Cập nhật Vehicle.CurrentLocation = ReturnLocation
- Tạo VehicleHistory: ActionType = "Returned", ReferenceId = RentalOrderId

### 5.4. Khi hủy đơn

- Nếu Vehicle.Status = Rented: Cập nhật Vehicle.Status = Available
- Tạo VehicleHistory: ActionType = "RentalCancelled", ReferenceId = RentalOrderId

## 6. API ENDPOINTS

### RentalOrder

```
GET    /api/rental-orders                # Danh sách (pagination, filter, search)
GET    /api/rental-orders/{id}           # Chi tiết
POST   /api/rental-orders                # Tạo mới
PUT    /api/rental-orders/{id}           # Cập nhật (chỉ khi Draft)
DELETE /api/rental-orders/{id}           # Xóa (chỉ khi Draft/Cancelled)
POST   /api/rental-orders/{id}/confirm   # Xác nhận (Draft → Confirmed)
POST   /api/rental-orders/{id}/start     # Bắt đầu (Confirmed → InProgress)
POST   /api/rental-orders/{id}/complete  # Hoàn thành (InProgress → Completed)
POST   /api/rental-orders/{id}/cancel    # Hủy
GET    /api/rental-orders/{id}/history   # Lịch sử thay đổi trạng thái
POST   /api/rental-orders/calculate-price # Tính giá (dùng khi tạo/sửa)
```

### Promotion

```
GET    /api/promotions                   # Danh sách
GET    /api/promotions/{id}              # Chi tiết
POST   /api/promotions                   # Tạo mới
PUT    /api/promotions/{id}              # Cập nhật
DELETE /api/promotions/{id}              # Xóa
POST   /api/promotions/validate          # Validate code
```

## 7. LUỒNG XỬ LÝ

### 7.1. Tạo đơn thuê

1. User click "Thêm mới"
2. Mở form
3. Chọn khách hàng (hoặc tạo mới)
4. Chọn xe (chỉ hiển thị xe Available)
5. Chọn ngày bắt đầu/kết thúc
6. Hệ thống tự tính giá
7. Nhập mã khuyến mãi (nếu có) → Validate và áp dụng
8. Chọn "Lưu nháp" hoặc "Xác nhận"
9. Nếu xác nhận: Validate xe còn sẵn, tạo đơn với Status = Confirmed
10. Thành công → Refresh danh sách

### 7.2. Khách nhận xe

1. User click "Bắt đầu" từ danh sách đơn (Status = Confirmed)
2. Confirm
3. Cập nhật ActualStartDate = Now
4. Chuyển Status = InProgress
5. Cập nhật Vehicle.Status = Rented
6. Tạo RentalStatusHistory và VehicleHistory
7. Thành công → Refresh

### 7.3. Khách trả xe

1. User click "Hoàn thành" từ danh sách đơn (Status = InProgress)
2. Mở form nhập thông tin trả xe:
   - Ngày giờ trả thực tế
   - Địa điểm trả
   - Tình trạng xe (có hư hỏng không?)
   - Phụ phí (nếu có)
3. Submit
4. Cập nhật ActualEndDate
5. Tính lại tổng tiền (nếu có phụ phí)
6. Chuyển Status = Completed
7. Cập nhật Vehicle.Status = Available
8. Tạo RentalStatusHistory và VehicleHistory
9. Thành công → Refresh, hiển thị button "Xuất hóa đơn"

### 7.4. Xuất hóa đơn

1. User click "Xuất hóa đơn" (Status = Completed)
2. Chuyển sang màn hình tạo hóa đơn (xem tài liệu Hóa đơn)
3. Hoặc tự động tạo hóa đơn và chuyển Status = Invoiced

## 8. YÊU CẦU KỸ THUẬT

### 8.1. Backend

- Transaction khi chuyển trạng thái và cập nhật xe
- Lock mechanism để tránh double booking
- Validation workflow: Chỉ cho phép chuyển trạng thái theo đúng workflow
- Tính toán giá tự động với caching

### 8.2. Frontend

- Real-time validation khi chọn xe (kiểm tra xe còn sẵn không)
- Auto-calculate giá khi thay đổi ngày hoặc giá
- Workflow buttons chỉ hiển thị khi đúng trạng thái
- Confirmation dialogs cho các hành động quan trọng
- Loading states và optimistic updates
