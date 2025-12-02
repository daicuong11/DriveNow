# TÀI LIỆU NGHIỆP VỤ - DASHBOARD VÀ BÁO CÁO

## 1. TỔNG QUAN

Dashboard cung cấp cái nhìn tổng quan về hoạt động kinh doanh, và các báo cáo chi tiết về doanh thu, số lượng xe, khách hàng, v.v. với khả năng export PDF/Excel.

## 2. DASHBOARD

### 2.1. Mô tả

Trang chủ hiển thị các thống kê tổng quan và biểu đồ.

### 2.2. Giao diện

#### 2.2.1. Layout

- **Header:** Tiêu đề "Dashboard"
- **Content:** Grid layout với các cards và charts
- **Refresh:** Button refresh dữ liệu

#### 2.2.2. Các Widgets

##### 2.2.2.1. Thống kê tổng quan (Cards)

- **Tổng số xe:** Tổng số xe trong hệ thống (Available + Rented + Maintenance + ...)
- **Xe đang cho thuê:** Số xe có Status = Rented
- **Xe có sẵn:** Số xe có Status = Available
- **Đơn thuê hôm nay:** Số đơn thuê được tạo hôm nay
- **Doanh thu hôm nay:** Tổng doanh thu từ các hóa đơn thanh toán hôm nay
- **Doanh thu tháng này:** Tổng doanh thu tháng hiện tại
- **Khách hàng mới:** Số khách hàng mới trong tháng
- **Hóa đơn chưa thanh toán:** Số hóa đơn có Status = Unpaid hoặc Partial

**Hiển thị:**

- Icon
- Số liệu (format số, currency)
- Mô tả
- Màu sắc khác nhau cho mỗi card
- Animation khi load

##### 2.2.2.2. Biểu đồ doanh thu

- **Loại:** Line chart hoặc Area chart
- **Dữ liệu:** Doanh thu theo ngày trong 30 ngày gần nhất
- **Trục X:** Ngày
- **Trục Y:** Số tiền (VNĐ)
- **Tùy chọn:** Có thể chọn khoảng thời gian (7 ngày, 30 ngày, 3 tháng, 6 tháng, 1 năm)

##### 2.2.2.3. Biểu đồ đơn thuê

- **Loại:** Bar chart
- **Dữ liệu:** Số đơn thuê theo trạng thái
- **Trục X:** Trạng thái (Draft, Confirmed, InProgress, Completed, Invoiced, Cancelled)
- **Trục Y:** Số lượng

##### 2.2.2.4. Biểu đồ xe theo trạng thái

- **Loại:** Pie chart hoặc Doughnut chart
- **Dữ liệu:** Số lượng xe theo trạng thái
- **Labels:** Available, Rented, Maintenance, Repair, OutOfService, InTransit
- **Màu sắc:** Khác nhau cho mỗi trạng thái

##### 2.2.2.5. Top khách hàng

- **Loại:** Table
- **Cột:** STT, Tên khách hàng, Số đơn thuê, Tổng tiền
- **Sắp xếp:** Theo tổng tiền giảm dần
- **Giới hạn:** Top 10

##### 2.2.2.6. Top xe được thuê nhiều nhất

- **Loại:** Table
- **Cột:** STT, Biển số, Model, Hãng, Số lần thuê, Tổng doanh thu
- **Sắp xếp:** Theo số lần thuê giảm dần
- **Giới hạn:** Top 10

##### 2.2.2.7. Đơn thuê gần đây

- **Loại:** Table
- **Cột:** Số đơn, Khách hàng, Xe, Ngày bắt đầu, Ngày kết thúc, Trạng thái
- **Giới hạn:** 10 đơn gần nhất
- **Link:** Click vào đơn để xem chi tiết

##### 2.2.2.8. Hóa đơn chưa thanh toán

- **Loại:** Table
- **Cột:** Số hóa đơn, Khách hàng, Ngày xuất, Ngày đến hạn, Tổng tiền, Còn lại, Trạng thái
- **Filter:** Chỉ hiển thị Unpaid và Partial
- **Giới hạn:** 10 hóa đơn gần nhất
- **Link:** Click để xem chi tiết

### 2.3. Phân quyền

- **Admin:** Xem tất cả widgets
- **Employee:** Xem giới hạn (không có thống kê về người dùng, cấu hình)

### 2.4. API Endpoints

```
GET    /api/dashboard/overview           # Thống kê tổng quan
GET    /api/dashboard/revenue-chart      # Dữ liệu biểu đồ doanh thu
GET    /api/dashboard/rental-chart       # Dữ liệu biểu đồ đơn thuê
GET    /api/dashboard/vehicle-status     # Dữ liệu biểu đồ xe theo trạng thái
GET    /api/dashboard/top-customers      # Top khách hàng
GET    /api/dashboard/top-vehicles       # Top xe
GET    /api/dashboard/recent-rentals     # Đơn thuê gần đây
GET    /api/dashboard/unpaid-invoices    # Hóa đơn chưa thanh toán
```

## 3. BÁO CÁO DOANH THU

### 3.1. Mô tả

Báo cáo chi tiết về doanh thu theo nhiều tiêu chí.

### 3.2. Giao diện

#### 3.2.1. Màn hình báo cáo doanh thu

- **Layout:** Form filter + Table kết quả
- **Form filter:**
  - Khoảng thời gian: DateRangePicker (Từ ngày - Đến ngày)
  - Khách hàng: Select (optional)
  - Xe: Select (optional)
  - Nhân viên: Select (optional)
  - Trạng thái hóa đơn: MultiSelect (optional)
- **Kết quả:**
  - **Tổng hợp:**
    - Tổng số hóa đơn
    - Tổng doanh thu
    - Tổng đã thanh toán
    - Tổng còn lại
  - **Bảng chi tiết:**
    - STT
    - Số hóa đơn
    - Số đơn thuê
    - Khách hàng
    - Xe
    - Ngày xuất
    - Tổng tiền
    - Đã thanh toán
    - Còn lại
    - Trạng thái
- **Actions:**
  - Tìm kiếm (áp dụng filter)
  - Export Excel
  - Export PDF
  - In

### 3.3. API Endpoints

```
GET    /api/reports/revenue              # Báo cáo doanh thu (có filter)
GET    /api/reports/revenue/export-excel # Export Excel
GET    /api/reports/revenue/export-pdf   # Export PDF
```

## 4. BÁO CÁO ĐƠN THUÊ

### 4.1. Mô tả

Báo cáo chi tiết về các đơn thuê.

### 4.2. Giao diện

#### 4.2.1. Màn hình báo cáo đơn thuê

- **Form filter:**
  - Khoảng thời gian: DateRangePicker
  - Khách hàng: Select
  - Xe: Select
  - Trạng thái: MultiSelect
  - Nhân viên: Select
- **Kết quả:**
  - **Tổng hợp:**
    - Tổng số đơn
    - Tổng số ngày thuê
    - Tổng doanh thu
    - Đơn đã hoàn thành
    - Đơn đã hủy
  - **Bảng chi tiết:**
    - STT
    - Số đơn
    - Khách hàng
    - Xe
    - Ngày bắt đầu
    - Ngày kết thúc
    - Số ngày
    - Tổng tiền
    - Trạng thái
- **Actions:**
  - Tìm kiếm
  - Export Excel
  - Export PDF

### 4.3. API Endpoints

```
GET    /api/reports/rentals              # Báo cáo đơn thuê
GET    /api/reports/rentals/export-excel
GET    /api/reports/rentals/export-pdf
```

## 5. BÁO CÁO XE

### 5.1. Mô tả

Báo cáo về tình trạng và hoạt động của xe.

### 5.2. Giao diện

#### 5.2.1. Màn hình báo cáo xe

- **Form filter:**
  - Loại xe: Select
  - Hãng xe: Select
  - Trạng thái: MultiSelect
  - Năm sản xuất: Number range
- **Kết quả:**
  - **Tổng hợp:**
    - Tổng số xe
    - Xe đang cho thuê
    - Xe có sẵn
    - Xe đang bảo dưỡng
    - Xe ngừng hoạt động
  - **Bảng chi tiết:**
    - STT
    - Biển số
    - Loại xe
    - Hãng xe
    - Model
    - Năm sản xuất
    - Trạng thái
    - Số lần thuê
    - Tổng doanh thu
    - Vị trí hiện tại
- **Actions:**
  - Tìm kiếm
  - Export Excel
  - Export PDF

### 5.3. API Endpoints

```
GET    /api/reports/vehicles             # Báo cáo xe
GET    /api/reports/vehicles/export-excel
GET    /api/reports/vehicles/export-pdf
```

## 6. BÁO CÁO KHÁCH HÀNG

### 6.1. Mô tả

Báo cáo về khách hàng và hoạt động thuê xe của họ.

### 6.2. Giao diện

#### 6.2.1. Màn hình báo cáo khách hàng

- **Form filter:**
  - Khoảng thời gian: DateRangePicker (theo ngày tạo hoặc ngày thuê)
  - Trạng thái: Select (Active/InActive)
- **Kết quả:**
  - **Tổng hợp:**
    - Tổng số khách hàng
    - Khách hàng mới (trong khoảng thời gian)
    - Tổng số đơn thuê
    - Tổng doanh thu
  - **Bảng chi tiết:**
    - STT
    - Mã khách hàng
    - Họ tên
    - Email
    - Số điện thoại
    - Số đơn thuê
    - Tổng số ngày thuê
    - Tổng doanh thu
    - Đơn thuê cuối cùng
    - Trạng thái
- **Actions:**
  - Tìm kiếm
  - Export Excel
  - Export PDF

### 6.3. API Endpoints

```
GET    /api/reports/customers            # Báo cáo khách hàng
GET    /api/reports/customers/export-excel
GET    /api/reports/customers/export-pdf
```

## 7. BÁO CÁO BẢO DƯỠNG/SỬA CHỮA

### 7.1. Mô tả

Báo cáo về chi phí bảo dưỡng và sửa chữa xe.

### 7.2. Giao diện

#### 7.2.1. Màn hình báo cáo bảo dưỡng

- **Form filter:**
  - Khoảng thời gian: DateRangePicker
  - Loại: Select (Maintenance/Repair/All)
  - Xe: Select
  - Trạng thái: MultiSelect
- **Kết quả:**
  - **Tổng hợp:**
    - Tổng số lần bảo dưỡng/sửa chữa
    - Tổng chi phí
    - Chi phí bảo dưỡng
    - Chi phí sửa chữa
  - **Bảng chi tiết:**
    - STT
    - Xe
    - Loại
    - Ngày bắt đầu
    - Ngày kết thúc
    - Mô tả
    - Chi phí
    - Đơn vị thực hiện
    - Trạng thái
- **Actions:**
  - Tìm kiếm
  - Export Excel
  - Export PDF

### 7.3. API Endpoints

```
GET    /api/reports/maintenance          # Báo cáo bảo dưỡng
GET    /api/reports/maintenance/export-excel
GET    /api/reports/maintenance/export-pdf
```

## 8. EXPORT BÁO CÁO

### 8.1. Export Excel

- **Format:** .xlsx
- **Nội dung:**
  - Header: Tên báo cáo, Khoảng thời gian, Ngày xuất
  - Tổng hợp (nếu có)
  - Bảng chi tiết với tất cả cột
  - Footer: Tổng cộng
- **Styling:**
  - Header: Bold, background color
  - Numbers: Format đúng (currency, date)
  - Auto width columns
- **Thư viện:** EPPlus hoặc ClosedXML

### 8.2. Export PDF

- **Format:** .pdf
- **Nội dung:** Tương tự Excel
- **Styling:**
  - Header với logo công ty
  - Table với borders
  - Page numbers
  - Footer với thông tin công ty
- **Thư viện:** QuestPDF hoặc iTextSharp

### 8.3. Giao diện Export

- Button "Export Excel" và "Export PDF" ở mỗi màn hình báo cáo
- Loading state khi export
- Download file tự động hoặc mở trong tab mới

## 9. API ENDPOINTS TỔNG HỢP

### Dashboard

```
GET    /api/dashboard/overview
GET    /api/dashboard/revenue-chart?days=30
GET    /api/dashboard/rental-chart
GET    /api/dashboard/vehicle-status
GET    /api/dashboard/top-customers?limit=10
GET    /api/dashboard/top-vehicles?limit=10
GET    /api/dashboard/recent-rentals?limit=10
GET    /api/dashboard/unpaid-invoices?limit=10
```

### Reports

```
GET    /api/reports/revenue?fromDate=&toDate=&customerId=&vehicleId=
GET    /api/reports/revenue/export-excel?fromDate=&toDate=...
GET    /api/reports/revenue/export-pdf?fromDate=&toDate=...

GET    /api/reports/rentals?fromDate=&toDate=&status=
GET    /api/reports/rentals/export-excel?...
GET    /api/reports/rentals/export-pdf?...

GET    /api/reports/vehicles?vehicleTypeId=&brandId=&status=
GET    /api/reports/vehicles/export-excel?...
GET    /api/reports/vehicles/export-pdf?...

GET    /api/reports/customers?fromDate=&toDate=&status=
GET    /api/reports/customers/export-excel?...
GET    /api/reports/customers/export-pdf?...

GET    /api/reports/maintenance?fromDate=&toDate=&type=&vehicleId=
GET    /api/reports/maintenance/export-excel?...
GET    /api/reports/maintenance/export-pdf?...
```

## 10. LUỒNG XỬ LÝ

### 10.1. Xem Dashboard

1. User đăng nhập → Redirect đến Dashboard
2. Load tất cả widgets (parallel requests)
3. Hiển thị loading skeleton
4. Khi có dữ liệu: Hiển thị cards và charts
5. User có thể refresh để cập nhật dữ liệu

### 10.2. Xem báo cáo

1. User chọn menu báo cáo
2. Mở màn hình báo cáo với form filter
3. User chọn filter (có thể để trống để xem tất cả)
4. Click "Tìm kiếm"
5. Load dữ liệu từ API
6. Hiển thị tổng hợp và bảng chi tiết

### 10.3. Export báo cáo

1. User xem báo cáo với filter đã chọn
2. Click "Export Excel" hoặc "Export PDF"
3. Gọi API export với các filter parameters
4. Backend tạo file (Excel hoặc PDF)
5. Return file download
6. Frontend download file tự động

## 11. YÊU CẦU KỸ THUẬT

### 11.1. Backend

- Query optimization cho các báo cáo (index, join)
- Caching cho dashboard (có thể cache 5 phút)
- Excel/PDF generation với template đẹp
- Pagination cho bảng chi tiết lớn

### 11.2. Frontend

- Chart library: Recharts hoặc Chart.js (miễn phí)
- Lazy loading cho charts
- Skeleton loading cho UX tốt
- Responsive layout
- Export với loading state
- Error handling

### 11.3. Performance

- Dashboard: Load parallel, cache 5 phút
- Báo cáo: Pagination, virtual scrolling nếu cần
- Export: Background job cho file lớn (có thể mở rộng sau)
