# TÀI LIỆU DỰ ÁN DRIVENOW

Chào mừng đến với tài liệu dự án **DriveNow - Ứng dụng Quản lý Cho thuê Xe hơi Tự lái**.

## CẤU TRÚC TÀI LIỆU

### 1. Kế hoạch Dự án

- **[Kế hoạch Dự án](./project-plan.md)**: Tổng quan về dự án, timeline, giai đoạn phát triển, công nghệ sử dụng

### 2. Tài liệu Nghiệp vụ (Features)

Tất cả tài liệu nghiệp vụ được lưu trong thư mục `features/`:

#### 2.1. Master Data

- **[01-master-data.md](./features/01-master-data.md)**: Quản lý các danh mục cơ bản
  - Loại xe (VehicleType)
  - Hãng xe (VehicleBrand)
  - Màu xe (VehicleColor)
  - Khách hàng (Customer)
  - Nhân viên (Employee)
  - Cấu hình hệ thống (SystemConfig)
  - Chức năng Import/Export Excel

#### 2.2. Quản lý Xe

- **[02-vehicle-management.md](./features/02-vehicle-management.md)**: Quản lý toàn bộ thông tin xe
  - Danh mục xe (Vehicle)
  - Trạng thái xe và đồng bộ
  - Xuất/Nhập bãi (VehicleInOut)
  - Bảo dưỡng/Sửa chữa (VehicleMaintenance)
  - Lịch sử hoạt động (VehicleHistory)

#### 2.3. Cho thuê Xe

- **[03-rental-management.md](./features/03-rental-management.md)**: Quản lý quy trình cho thuê
  - Đơn thuê xe (RentalOrder)
  - Workflow trạng thái đơn thuê
  - Khuyến mãi (Promotion)
  - Tính toán giá tự động
  - Đồng bộ với quản lý xe

#### 2.4. Hóa đơn và Thanh toán

- **[04-invoice-payment.md](./features/04-invoice-payment.md)**: Quản lý hóa đơn và thanh toán
  - Hóa đơn (Invoice)
  - Chi tiết hóa đơn (InvoiceDetail)
  - Thanh toán (Payment)
  - Xuất hóa đơn PDF
  - Template hóa đơn

#### 2.5. Quản lý Người dùng và Phân quyền

- **[05-user-permission.md](./features/05-user-permission.md)**: Authentication và Authorization
  - Người dùng (User)
  - Đăng nhập/Đăng xuất
  - JWT Authentication với Refresh Token
  - Đổi mật khẩu qua Email
  - Phân quyền (Admin/Employee)

#### 2.6. Dashboard và Báo cáo

- **[06-dashboard-reports.md](./features/06-dashboard-reports.md)**: Thống kê và báo cáo
  - Dashboard tổng quan
  - Báo cáo doanh thu
  - Báo cáo đơn thuê
  - Báo cáo xe
  - Báo cáo khách hàng
  - Báo cáo bảo dưỡng
  - Export Excel/PDF

## QUY TẮC VÀ HƯỚNG DẪN

Tất cả quy tắc và hướng dẫn được lưu trong thư mục `../rules/`:

- **[code-base.md](../rules/code-base.md)**: Mô tả chi tiết về Code Base, Công nghệ, Yêu cầu kỹ thuật, Code Convention
- **[setup-guide.md](../rules/setup-guide.md)**: Hướng dẫn chi tiết khởi tạo source code cho Backend và Frontend

## CÁCH SỬ DỤNG TÀI LIỆU

### Cho AI Agents

1. Đọc **[setup-guide.md](../rules/setup-guide.md)** để khởi tạo source code base
2. Đọc **[code-base.md](../rules/code-base.md)** để hiểu cấu trúc và convention
3. Đọc các tài liệu nghiệp vụ trong `features/` để implement từng chức năng:
   - Bắt đầu với Master Data (01-master-data.md)
   - Tiếp theo Quản lý Xe (02-vehicle-management.md)
   - Sau đó Cho thuê Xe (03-rental-management.md)
   - Và các chức năng còn lại

### Cho Developers

1. Đọc **[project-plan.md](./project-plan.md)** để hiểu tổng quan dự án
2. Đọc **[code-base.md](../rules/code-base.md)** để hiểu convention và best practices
3. Tham khảo các tài liệu nghiệp vụ khi implement từng feature

## LƯU Ý

- Tất cả tài liệu được viết bằng tiếng Việt
- Entity, API endpoints, và các thuật ngữ kỹ thuật được giữ nguyên tiếng Anh
- Mỗi tài liệu nghiệp vụ bao gồm:
  - Mô tả chi tiết
  - Entity với đầy đủ cột, kiểu dữ liệu, ràng buộc
  - Giao diện và chức năng
  - API Endpoints
  - Luồng xử lý
  - Yêu cầu kỹ thuật

## CẬP NHẬT

Khi có thay đổi về nghiệp vụ hoặc yêu cầu, vui lòng cập nhật tài liệu tương ứng để đảm bảo tính nhất quán.
