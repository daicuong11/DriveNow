# TÀI LIỆU NGHIỆP VỤ - QUẢN LÝ XE

## 1. TỔNG QUAN

Quản lý toàn bộ thông tin xe trong hệ thống, bao gồm: Thông tin cơ bản, Trạng thái xe, Lịch sử hoạt động, Xuất/Nhập bãi, Bảo dưỡng/Sửa chữa.

## 2. DANH MỤC XE (Vehicle)

### 2.1. Mô tả

Quản lý thông tin chi tiết của từng xe trong kho.

### 2.2. Entity: Vehicle

| Tên cột             | Kiểu dữ liệu  | Ràng buộc                      | Mô tả                           |
| ------------------- | ------------- | ------------------------------ | ------------------------------- |
| Id                  | int           | PK, Identity                   | Khóa chính                      |
| Code                | string(50)    | Required, Unique               | Biển số xe (VD: 30A-12345)      |
| VehicleTypeId       | int           | Required, FK                   | Loại xe                         |
| VehicleBrandId      | int           | Required, FK                   | Hãng xe                         |
| VehicleColorId      | int           | Required, FK                   | Màu xe                          |
| Model               | string(100)   | Required                       | Model xe (VD: Camry 2023)       |
| Year                | int           | Required                       | Năm sản xuất                    |
| SeatCount           | int           | Required                       | Số chỗ ngồi                     |
| FuelType            | string(20)    | Required                       | Loại nhiên liệu (Xăng/Dầu/Điện) |
| LicensePlate        | string(20)    | Required, Unique               | Biển số đăng ký                 |
| ChassisNumber       | string(100)   | Optional, Unique               | Số khung                        |
| EngineNumber        | string(100)   | Optional                       | Số máy                          |
| RegistrationDate    | DateTime?     | Optional                       | Ngày đăng ký                    |
| InsuranceExpiryDate | DateTime?     | Optional                       | Ngày hết hạn bảo hiểm           |
| Status              | string(20)    | Required, Default: 'Available' | Trạng thái xe (xem bảng 2.3)    |
| CurrentLocation     | string(200)   | Optional                       | Vị trí hiện tại                 |
| DailyRentalPrice    | decimal(18,2) | Required                       | Giá thuê theo ngày              |
| ImageUrl            | string(500)   | Optional                       | URL hình ảnh xe                 |
| Description         | string(1000)  | Optional                       | Mô tả                           |
| CreatedDate         | DateTime      | Required                       | Ngày tạo                        |
| CreatedBy           | string(100)   | Optional                       | Người tạo                       |
| ModifiedDate        | DateTime?     | Optional                       | Ngày sửa                        |
| ModifiedBy          | string(100)   | Optional                       | Người sửa                       |
| IsDeleted           | bool          | Required, Default: false       | Đã xóa                          |

**Foreign Keys:**

- VehicleTypeId → VehicleType.Id
- VehicleBrandId → VehicleBrand.Id
- VehicleColorId → VehicleColor.Id

### 2.3. Trạng thái Xe (VehicleStatus)

| Giá trị      | Mô tả           | Màu sắc    |
| ------------ | --------------- | ---------- |
| Available    | Có sẵn          | Xanh lá    |
| Rented       | Đang cho thuê   | Vàng       |
| Maintenance  | Đang bảo dưỡng  | Cam        |
| Repair       | Đang sửa chữa   | Đỏ         |
| OutOfService | Ngừng hoạt động | Xám        |
| InTransit    | Đang vận chuyển | Xanh dương |

### 2.4. Giao diện

#### 2.4.1. Màn hình danh sách xe

- **Layout:** Table với Ant Design Table
- **Cột hiển thị:**
  - STT
  - Biển số (Code/LicensePlate)
  - Loại xe (VehicleType.Name)
  - Hãng xe (VehicleBrand.Name)
  - Model
  - Năm sản xuất (Year)
  - Số chỗ (SeatCount)
  - Trạng thái (Status) - Badge màu theo trạng thái
  - Giá thuê/ngày (DailyRentalPrice) - Format currency
  - Vị trí (CurrentLocation)
  - Thao tác (Actions)
- **Chức năng:**
  - Tìm kiếm: Theo biển số, model, hãng xe
  - Lọc nâng cao:
    - Trạng thái
    - Loại xe
    - Hãng xe
    - Năm sản xuất
    - Giá thuê (từ - đến)
  - Phân trang
  - Sắp xếp
  - Thêm mới
  - Sửa
  - Xóa
  - Xem chi tiết (mở drawer với thông tin đầy đủ)
  - Xuất/Nhập bãi (button riêng)
  - Xem lịch sử (button riêng)

#### 2.4.2. Màn hình thêm mới/sửa xe

- **Layout:** Modal hoặc Drawer (full width)
- **Form fields:**
  - **Thông tin cơ bản:**
    - Biển số (Code): Required, validate format
    - Loại xe: Select (VehicleType), Required
    - Hãng xe: Select (VehicleBrand), Required
    - Màu xe: Select (VehicleColor), Required
    - Model: Input, Required
    - Năm sản xuất: Number, Required, Range 1900-2100
    - Số chỗ ngồi: Number, Required, Min: 2, Max: 50
    - Loại nhiên liệu: Select (Xăng/Dầu/Điện), Required
  - **Thông tin đăng ký:**
    - Biển số đăng ký (LicensePlate): Required, Unique
    - Số khung (ChassisNumber): Optional, Unique
    - Số máy (EngineNumber): Optional
    - Ngày đăng ký: DatePicker
    - Ngày hết hạn bảo hiểm: DatePicker
  - **Thông tin giá:**
    - Giá thuê/ngày: Number, Required, Min: 0
  - **Thông tin khác:**
    - Trạng thái: Select, Default: Available
    - Vị trí hiện tại: Input
    - Hình ảnh: Upload (multiple images)
    - Mô tả: TextArea
- **Actions:**
  - Lưu
  - Hủy
  - Upload ảnh (preview)

#### 2.4.3. Màn hình chi tiết xe

- **Layout:** Drawer từ bên phải
- **Tabs:**
  - Thông tin chung
  - Lịch sử cho thuê
  - Lịch sử bảo dưỡng/sửa chữa
  - Lịch sử xuất/nhập bãi
  - Hình ảnh

## 3. XUẤT/NHẬP BÃI XE (VehicleInOut)

### 3.1. Mô tả

Quản lý việc xuất xe ra khỏi bãi và nhập xe vào bãi.

### 3.2. Entity: VehicleInOut

| Tên cột      | Kiểu dữ liệu | Ràng buộc                | Mô tả               |
| ------------ | ------------ | ------------------------ | ------------------- |
| Id           | int          | PK, Identity             | Khóa chính          |
| VehicleId    | int          | Required, FK             | Xe                  |
| Type         | string(20)   | Required                 | Loại (Out/In)       |
| Date         | DateTime     | Required                 | Ngày giờ xuất/nhập  |
| Location     | string(200)  | Optional                 | Địa điểm            |
| Reason       | string(500)  | Optional                 | Lý do               |
| EmployeeId   | int          | Required, FK             | Nhân viên thực hiện |
| Notes        | string(1000) | Optional                 | Ghi chú             |
| CreatedDate  | DateTime     | Required                 | Ngày tạo            |
| CreatedBy    | string(100)  | Optional                 | Người tạo           |
| ModifiedDate | DateTime?    | Optional                 | Ngày sửa            |
| ModifiedBy   | string(100)  | Optional                 | Người sửa           |
| IsDeleted    | bool         | Required, Default: false | Đã xóa              |

**Foreign Keys:**

- VehicleId → Vehicle.Id
- EmployeeId → Employee.Id

### 3.3. Giao diện

#### 3.3.1. Màn hình xuất/nhập bãi

- **Layout:** Form với 2 tabs: Xuất bãi / Nhập bãi
- **Form fields:**
  - Xe: Select (chỉ hiển thị xe Available khi xuất, xe Rented/InTransit khi nhập)
  - Ngày giờ: DateTimePicker, Default: Now
  - Địa điểm: Input
  - Lý do: TextArea
  - Nhân viên: Select (auto = current user)
  - Ghi chú: TextArea
- **Logic:**
  - Khi xuất bãi: Cập nhật Vehicle.Status = InTransit (nếu không phải cho thuê)
  - Khi nhập bãi: Cập nhật Vehicle.Status = Available, Vehicle.CurrentLocation = Location

## 4. BẢO DƯỠNG/ SỬA CHỮA XE (VehicleMaintenance)

### 4.1. Mô tả

Quản lý lịch sử bảo dưỡng và sửa chữa xe.

### 4.2. Entity: VehicleMaintenance

| Tên cột         | Kiểu dữ liệu  | Ràng buộc                       | Mô tả                                       |
| --------------- | ------------- | ------------------------------- | ------------------------------------------- |
| Id              | int           | PK, Identity                    | Khóa chính                                  |
| VehicleId       | int           | Required, FK                    | Xe                                          |
| Type            | string(20)    | Required                        | Loại (Maintenance/Repair)                   |
| StartDate       | DateTime      | Required                        | Ngày bắt đầu                                |
| EndDate         | DateTime?     | Optional                        | Ngày kết thúc                               |
| Description     | string(1000)  | Required                        | Mô tả công việc                             |
| Cost            | decimal(18,2) | Optional                        | Chi phí                                     |
| ServiceProvider | string(200)   | Optional                        | Đơn vị thực hiện                            |
| Status          | string(20)    | Required, Default: 'InProgress' | Trạng thái (InProgress/Completed/Cancelled) |
| CreatedDate     | DateTime      | Required                        | Ngày tạo                                    |
| CreatedBy       | string(100)   | Optional                        | Người tạo                                   |
| ModifiedDate    | DateTime?     | Optional                        | Ngày sửa                                    |
| ModifiedBy      | string(100)   | Optional                        | Người sửa                                   |
| IsDeleted       | bool          | Required, Default: false        | Đã xóa                                      |

**Foreign Keys:**

- VehicleId → Vehicle.Id

### 4.3. Giao diện

#### 4.3.1. Màn hình danh sách bảo dưỡng/sửa chữa

- **Cột hiển thị:**
  - STT
  - Xe (Vehicle.Code)
  - Loại (Type) - Badge
  - Ngày bắt đầu
  - Ngày kết thúc
  - Mô tả
  - Chi phí
  - Trạng thái
  - Thao tác

#### 4.3.2. Màn hình thêm mới/sửa

- **Form fields:**
  - Xe: Select, Required
  - Loại: Radio (Bảo dưỡng/Sửa chữa), Required
  - Ngày bắt đầu: DateTimePicker, Required
  - Ngày kết thúc: DateTimePicker, Optional
  - Mô tả: TextArea, Required
  - Chi phí: Number, Optional
  - Đơn vị thực hiện: Input, Optional
  - Trạng thái: Select, Required
- **Logic:**
  - Khi tạo mới với Status = InProgress: Cập nhật Vehicle.Status = Maintenance hoặc Repair
  - Khi hoàn thành (Status = Completed): Cập nhật Vehicle.Status = Available

## 5. LỊCH SỬ HOẠT ĐỘNG XE (VehicleHistory)

### 5.1. Mô tả

Lưu lại tất cả các thay đổi trạng thái và hoạt động của xe.

### 5.2. Entity: VehicleHistory

| Tên cột       | Kiểu dữ liệu | Ràng buộc    | Mô tả                                                      |
| ------------- | ------------ | ------------ | ---------------------------------------------------------- |
| Id            | int          | PK, Identity | Khóa chính                                                 |
| VehicleId     | int          | Required, FK | Xe                                                         |
| ActionType    | string(50)   | Required     | Loại hành động (Rented/Returned/Maintenance/Repair/In/Out) |
| OldStatus     | string(20)   | Optional     | Trạng thái cũ                                              |
| NewStatus     | string(20)   | Optional     | Trạng thái mới                                             |
| ReferenceId   | int?         | Optional     | ID tham chiếu (RentalId, MaintenanceId, v.v.)              |
| ReferenceType | string(50)   | Optional     | Loại tham chiếu                                            |
| Description   | string(1000) | Optional     | Mô tả                                                      |
| CreatedDate   | DateTime     | Required     | Ngày giờ                                                   |
| CreatedBy     | string(100)  | Optional     | Người thực hiện                                            |

**Foreign Keys:**

- VehicleId → Vehicle.Id

### 5.3. Giao diện

- Hiển thị trong tab "Lịch sử" của màn hình chi tiết xe
- Timeline view hoặc Table view
- Filter theo loại hành động, thời gian

## 6. ĐỒNG BỘ TRẠNG THÁI XE

### 6.1. Quy tắc đồng bộ

#### 6.1.1. Khi cho thuê xe

- Vehicle.Status = Rented
- Tạo VehicleHistory: ActionType = "Rented", ReferenceId = RentalId

#### 6.1.2. Khi trả xe

- Vehicle.Status = Available (nếu không có bảo dưỡng/sửa chữa)
- Vehicle.CurrentLocation = Location trả xe
- Tạo VehicleHistory: ActionType = "Returned", ReferenceId = RentalId

#### 6.1.3. Khi bảo dưỡng/sửa chữa

- Vehicle.Status = Maintenance hoặc Repair
- Tạo VehicleHistory: ActionType = "Maintenance" hoặc "Repair", ReferenceId = MaintenanceId

#### 6.1.4. Khi hoàn thành bảo dưỡng/sửa chữa

- Vehicle.Status = Available
- Tạo VehicleHistory: ActionType = "MaintenanceCompleted" hoặc "RepairCompleted"

#### 6.1.5. Khi xuất/nhập bãi

- Xuất: Vehicle.Status = InTransit (nếu không phải cho thuê)
- Nhập: Vehicle.Status = Available, Vehicle.CurrentLocation = Location
- Tạo VehicleHistory: ActionType = "Out" hoặc "In"

## 7. API ENDPOINTS

### Vehicle

```
GET    /api/vehicles                    # Danh sách (pagination, filter, search)
GET    /api/vehicles/{id}               # Chi tiết
POST   /api/vehicles                    # Tạo mới
PUT    /api/vehicles/{id}               # Cập nhật
DELETE /api/vehicles/{id}               # Xóa
GET    /api/vehicles/{id}/history       # Lịch sử
GET    /api/vehicles/available          # Danh sách xe có sẵn
POST   /api/vehicles/import              # Import Excel
GET    /api/vehicles/export              # Export Excel
```

### VehicleInOut

```
GET    /api/vehicle-in-outs              # Danh sách
GET    /api/vehicle-in-outs/{id}         # Chi tiết
POST   /api/vehicle-in-outs              # Tạo mới (xuất/nhập)
PUT    /api/vehicle-in-outs/{id}         # Cập nhật
DELETE /api/vehicle-in-outs/{id}         # Xóa
```

### VehicleMaintenance

```
GET    /api/vehicle-maintenances         # Danh sách
GET    /api/vehicle-maintenances/{id}    # Chi tiết
POST   /api/vehicle-maintenances         # Tạo mới
PUT    /api/vehicle-maintenances/{id}    # Cập nhật
DELETE /api/vehicle-maintenances/{id}    # Xóa
PUT    /api/vehicle-maintenances/{id}/complete  # Hoàn thành
```

### VehicleHistory

```
GET    /api/vehicle-histories            # Danh sách (có filter)
GET    /api/vehicle-histories/vehicle/{vehicleId}  # Lịch sử theo xe
```

## 8. LUỒNG XỬ LÝ

### 8.1. Thêm mới xe

1. User click "Thêm mới"
2. Mở form
3. Nhập thông tin
4. Validate (đặc biệt: Biển số, LicensePlate phải unique)
5. Submit
6. Tạo VehicleHistory: ActionType = "Created"
7. Thành công → Refresh danh sách

### 8.2. Xuất bãi

1. User chọn tab "Xuất bãi"
2. Chọn xe (chỉ hiển thị xe Available)
3. Nhập thông tin
4. Submit
5. Tạo VehicleInOut (Type = Out)
6. Cập nhật Vehicle.Status = InTransit
7. Tạo VehicleHistory
8. Thành công → Refresh

### 8.3. Nhập bãi

1. User chọn tab "Nhập bãi"
2. Chọn xe (chỉ hiển thị xe Rented/InTransit)
3. Nhập thông tin
4. Submit
5. Tạo VehicleInOut (Type = In)
6. Cập nhật Vehicle.Status = Available, CurrentLocation
7. Tạo VehicleHistory
8. Thành công → Refresh

### 8.4. Bảo dưỡng/Sửa chữa

1. User click "Bảo dưỡng/Sửa chữa" từ danh sách xe
2. Mở form
3. Chọn xe, loại, nhập thông tin
4. Submit
5. Tạo VehicleMaintenance
6. Cập nhật Vehicle.Status = Maintenance/Repair
7. Tạo VehicleHistory
8. Thành công → Refresh

### 8.5. Hoàn thành bảo dưỡng

1. User click "Hoàn thành" từ danh sách bảo dưỡng
2. Confirm
3. Cập nhật VehicleMaintenance.Status = Completed, EndDate = Now
4. Cập nhật Vehicle.Status = Available
5. Tạo VehicleHistory
6. Thành công → Refresh

## 9. YÊU CẦU KỸ THUẬT

### 9.1. Backend

- Transaction khi cập nhật trạng thái xe và tạo history
- Lock mechanism để tránh race condition khi cập nhật trạng thái
- Validation: Không cho xuất xe đang cho thuê, không cho nhập xe không tồn tại, v.v.

### 9.2. Frontend

- Real-time update trạng thái xe (có thể dùng polling hoặc SignalR)
- Optimistic update cho UX tốt hơn
- Confirmation dialogs cho các hành động quan trọng
- Loading states
