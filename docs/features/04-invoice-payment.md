# TÀI LIỆU NGHIỆP VỤ - HÓA ĐƠN VÀ THANH TOÁN

## 1. TỔNG QUAN

Quản lý hóa đơn điện tử và thanh toán cho các đơn thuê xe. Hệ thống hỗ trợ xuất hóa đơn PDF và quản lý các khoản thanh toán.

## 2. HÓA ĐƠN (Invoice)

### 2.1. Mô tả

Hóa đơn điện tử được tạo từ đơn thuê đã hoàn thành (Status = Completed).

### 2.2. Entity: Invoice

| Tên cột         | Kiểu dữ liệu  | Ràng buộc                   | Mô tả                      |
| --------------- | ------------- | --------------------------- | -------------------------- |
| Id              | int           | PK, Identity                | Khóa chính                 |
| InvoiceNumber   | string(50)    | Required, Unique            | Số hóa đơn (HD20240101001) |
| RentalOrderId   | int           | Required, FK, Unique        | Đơn thuê                   |
| CustomerId      | int           | Required, FK                | Khách hàng                 |
| InvoiceDate     | DateTime      | Required                    | Ngày xuất hóa đơn          |
| DueDate         | DateTime      | Required                    | Ngày đến hạn thanh toán    |
| SubTotal        | decimal(18,2) | Required                    | Tổng tiền (chưa VAT)       |
| TaxRate         | decimal(5,2)  | Required, Default: 10       | Thuế suất VAT (%)          |
| TaxAmount       | decimal(18,2) | Required                    | Số tiền thuế               |
| DiscountAmount  | decimal(18,2) | Optional, Default: 0        | Số tiền giảm giá           |
| TotalAmount     | decimal(18,2) | Required                    | Tổng tiền (sau VAT)        |
| PaidAmount      | decimal(18,2) | Required, Default: 0        | Số tiền đã thanh toán      |
| RemainingAmount | decimal(18,2) | Required                    | Số tiền còn lại            |
| Status          | string(20)    | Required, Default: 'Unpaid' | Trạng thái (xem 2.3)       |
| Notes           | string(1000)  | Optional                    | Ghi chú                    |
| CreatedDate     | DateTime      | Required                    | Ngày tạo                   |
| CreatedBy       | string(100)   | Optional                    | Người tạo                  |
| ModifiedDate    | DateTime?     | Optional                    | Ngày sửa                   |
| ModifiedBy      | string(100)   | Optional                    | Người sửa                  |
| IsDeleted       | bool          | Required, Default: false    | Đã xóa                     |

**Foreign Keys:**

- RentalOrderId → RentalOrder.Id
- CustomerId → Customer.Id

### 2.3. Trạng thái Hóa đơn (InvoiceStatus)

| Giá trị   | Mô tả               | Màu sắc |
| --------- | ------------------- | ------- |
| Unpaid    | Chưa thanh toán     | Đỏ      |
| Partial   | Thanh toán một phần | Vàng    |
| Paid      | Đã thanh toán đủ    | Xanh lá |
| Overdue   | Quá hạn             | Đỏ đậm  |
| Cancelled | Đã hủy              | Xám     |

**Logic:**

- Unpaid: PaidAmount = 0
- Partial: 0 < PaidAmount < TotalAmount
- Paid: PaidAmount >= TotalAmount
- Overdue: DueDate < Today và Status != Paid
- Cancelled: Hóa đơn bị hủy

### 2.4. Giao diện

#### 2.4.1. Màn hình danh sách hóa đơn

- **Layout:** Table với Ant Design Table
- **Cột hiển thị:**
  - STT
  - Số hóa đơn (InvoiceNumber)
  - Số đơn thuê (RentalOrder.OrderNumber)
  - Khách hàng (Customer.FullName)
  - Ngày xuất (InvoiceDate)
  - Ngày đến hạn (DueDate)
  - Tổng tiền (TotalAmount) - Format currency
  - Đã thanh toán (PaidAmount) - Format currency
  - Còn lại (RemainingAmount) - Format currency
  - Trạng thái (Status) - Badge màu
  - Thao tác (Actions)
- **Chức năng:**
  - Tìm kiếm: Theo số hóa đơn, số đơn thuê, tên khách hàng
  - Lọc nâng cao:
    - Trạng thái
    - Khách hàng
    - Ngày xuất (từ - đến)
    - Ngày đến hạn (từ - đến)
    - Số tiền (từ - đến)
  - Phân trang
  - Sắp xếp
  - Xem chi tiết
  - In hóa đơn (PDF)
  - Thanh toán (button "Thanh toán")
  - Xem lịch sử thanh toán

#### 2.4.2. Màn hình tạo hóa đơn

- **Layout:** Modal hoặc Page
- **Trigger:** Từ màn hình đơn thuê (button "Xuất hóa đơn")
- **Form fields:**
  - **Thông tin đơn thuê (readonly):**
    - Số đơn thuê
    - Khách hàng
    - Xe
    - Ngày thuê
    - Tổng tiền đơn thuê
  - **Thông tin hóa đơn:**
    - Ngày xuất: DatePicker, Default: Today
    - Ngày đến hạn: DatePicker, Required (thường = InvoiceDate + 7 ngày)
    - Thuế suất VAT: Number, Default: 10%
    - Số tiền giảm giá: Number (từ đơn thuê)
    - Ghi chú: TextArea
  - **Tính toán tự động:**
    - Tổng tiền (chưa VAT) = RentalOrder.TotalAmount - DiscountAmount
    - Số tiền thuế = SubTotal \* (TaxRate / 100)
    - Tổng tiền (sau VAT) = SubTotal + TaxAmount
    - Còn lại = TotalAmount
- **Actions:**
  - Tạo hóa đơn
  - Hủy

#### 2.4.3. Màn hình chi tiết hóa đơn

- **Layout:** Drawer hoặc Page
- **Tabs:**
  - Thông tin hóa đơn
  - Chi tiết đơn thuê
  - Lịch sử thanh toán
  - In hóa đơn (preview)

#### 2.4.4. Màn hình in hóa đơn (PDF Preview)

- **Layout:** Modal full screen
- **Nội dung hóa đơn:**
  - Header: Logo công ty, Tên công ty, Địa chỉ, SĐT, Email
  - Thông tin hóa đơn: Số hóa đơn, Ngày xuất, Ngày đến hạn
  - Thông tin khách hàng: Tên, Địa chỉ, SĐT, Email, Mã số thuế (nếu có)
  - Chi tiết:
    - STT
    - Mô tả (VD: "Cho thuê xe [Biển số] từ [StartDate] đến [EndDate]")
    - Số lượng (số ngày)
    - Đơn giá (giá/ngày)
    - Thành tiền
  - Tổng cộng:
    - Tổng tiền (chưa VAT)
    - Giảm giá
    - Thuế VAT (10%)
    - Tổng cộng (sau VAT)
  - Thông tin thanh toán: Đã thanh toán, Còn lại
  - Footer: Chữ ký, Ghi chú
- **Actions:**
  - In PDF
  - Tải PDF
  - Đóng

## 3. CHI TIẾT HÓA ĐƠN (InvoiceDetail)

### 3.1. Mô tả

Chi tiết các dòng trong hóa đơn (có thể mở rộng cho nhiều dịch vụ).

### 3.2. Entity: InvoiceDetail

| Tên cột     | Kiểu dữ liệu  | Ràng buộc            | Mô tả           |
| ----------- | ------------- | -------------------- | --------------- |
| Id          | int           | PK, Identity         | Khóa chính      |
| InvoiceId   | int           | Required, FK         | Hóa đơn         |
| Description | string(500)   | Required             | Mô tả           |
| Quantity    | decimal(18,2) | Required             | Số lượng        |
| UnitPrice   | decimal(18,2) | Required             | Đơn giá         |
| Amount      | decimal(18,2) | Required             | Thành tiền      |
| SortOrder   | int           | Required, Default: 0 | Thứ tự hiển thị |

**Foreign Keys:**

- InvoiceId → Invoice.Id

**Logic:**

- Amount = Quantity \* UnitPrice

## 4. THANH TOÁN (Payment)

### 4.1. Mô tả

Quản lý các khoản thanh toán của khách hàng cho hóa đơn.

### 4.2. Entity: Payment

| Tên cột         | Kiểu dữ liệu  | Ràng buộc                | Mô tả                                      |
| --------------- | ------------- | ------------------------ | ------------------------------------------ |
| Id              | int           | PK, Identity             | Khóa chính                                 |
| PaymentNumber   | string(50)    | Required, Unique         | Số phiếu thu (PT20240101001)               |
| InvoiceId       | int           | Required, FK             | Hóa đơn                                    |
| PaymentDate     | DateTime      | Required                 | Ngày thanh toán                            |
| Amount          | decimal(18,2) | Required                 | Số tiền thanh toán                         |
| PaymentMethod   | string(20)    | Required                 | Phương thức (Cash/BankTransfer/CreditCard) |
| BankAccount     | string(200)   | Optional                 | Tài khoản ngân hàng                        |
| TransactionCode | string(100)   | Optional                 | Mã giao dịch                               |
| Notes           | string(1000)  | Optional                 | Ghi chú                                    |
| CreatedDate     | DateTime      | Required                 | Ngày tạo                                   |
| CreatedBy       | string(100)   | Optional                 | Người tạo                                  |
| ModifiedDate    | DateTime?     | Optional                 | Ngày sửa                                   |
| ModifiedBy      | string(100)   | Optional                 | Người sửa                                  |
| IsDeleted       | bool          | Required, Default: false | Đã xóa                                     |

**Foreign Keys:**

- InvoiceId → Invoice.Id

### 4.3. Phương thức thanh toán

| Giá trị      | Mô tả        |
| ------------ | ------------ |
| Cash         | Tiền mặt     |
| BankTransfer | Chuyển khoản |
| CreditCard   | Thẻ tín dụng |

### 4.4. Giao diện

#### 4.4.1. Màn hình danh sách thanh toán

- **Cột hiển thị:**
  - STT
  - Số phiếu thu (PaymentNumber)
  - Số hóa đơn (Invoice.InvoiceNumber)
  - Khách hàng (Invoice.Customer.FullName)
  - Ngày thanh toán (PaymentDate)
  - Số tiền (Amount) - Format currency
  - Phương thức (PaymentMethod)
  - Thao tác (Actions)

#### 4.4.2. Màn hình thêm thanh toán

- **Layout:** Modal
- **Trigger:** Từ màn hình hóa đơn (button "Thanh toán")
- **Form fields:**
  - **Thông tin hóa đơn (readonly):**
    - Số hóa đơn
    - Khách hàng
    - Tổng tiền
    - Đã thanh toán
    - Còn lại
  - **Thông tin thanh toán:**
    - Ngày thanh toán: DatePicker, Default: Today
    - Số tiền: Number, Required, Max: RemainingAmount
    - Phương thức: Select, Required
    - Tài khoản ngân hàng: Input (nếu PaymentMethod = BankTransfer)
    - Mã giao dịch: Input (nếu PaymentMethod = BankTransfer/CreditCard)
    - Ghi chú: TextArea
- **Actions:**
  - Lưu
  - Hủy

### 4.5. Logic cập nhật hóa đơn

Khi tạo Payment:

1. Validate: Amount <= Invoice.RemainingAmount
2. Tạo Payment
3. Cập nhật Invoice:
   - PaidAmount = Invoice.PaidAmount + Amount
   - RemainingAmount = Invoice.RemainingAmount - Amount
   - Status:
     - Nếu RemainingAmount = 0: Status = Paid
     - Nếu RemainingAmount > 0: Status = Partial
     - Nếu RemainingAmount < 0: Error (không cho thanh toán quá số tiền)

## 5. ĐỒNG BỘ VỚI ĐƠN THUÊ

### 5.1. Khi tạo hóa đơn

- Từ RentalOrder (Status = Completed)
- Tạo Invoice
- Tạo InvoiceDetail từ thông tin RentalOrder
- Cập nhật RentalOrder.Status = Invoiced

### 5.2. Khi thanh toán đủ

- Invoice.Status = Paid
- Có thể tự động cập nhật RentalOrder (nếu cần)

## 6. API ENDPOINTS

### Invoice

```
GET    /api/invoices                    # Danh sách (pagination, filter, search)
GET    /api/invoices/{id}               # Chi tiết
POST   /api/invoices                    # Tạo mới
PUT    /api/invoices/{id}               # Cập nhật
DELETE /api/invoices/{id}               # Xóa (chỉ khi Unpaid)
GET    /api/invoices/{id}/pdf           # Xuất PDF
GET    /api/invoices/{id}/preview       # Preview hóa đơn
GET    /api/invoices/{id}/payments      # Lịch sử thanh toán
POST   /api/invoices/from-rental/{rentalOrderId}  # Tạo từ đơn thuê
```

### Payment

```
GET    /api/payments                    # Danh sách
GET    /api/payments/{id}               # Chi tiết
POST   /api/payments                    # Tạo mới
PUT    /api/payments/{id}               # Cập nhật
DELETE /api/payments/{id}               # Xóa
GET    /api/payments/invoice/{invoiceId}  # Thanh toán theo hóa đơn
```

## 7. LUỒNG XỬ LÝ

### 7.1. Tạo hóa đơn từ đơn thuê

1. User click "Xuất hóa đơn" từ màn hình đơn thuê (Status = Completed)
2. Mở form tạo hóa đơn
3. Hiển thị thông tin đơn thuê (readonly)
4. Nhập ngày xuất, ngày đến hạn
5. Hệ thống tự tính: SubTotal, TaxAmount, TotalAmount
6. Click "Tạo hóa đơn"
7. Tạo Invoice và InvoiceDetail
8. Cập nhật RentalOrder.Status = Invoiced
9. Thành công → Redirect đến màn hình chi tiết hóa đơn

### 7.2. Thanh toán

1. User click "Thanh toán" từ màn hình hóa đơn
2. Mở form thanh toán
3. Hiển thị thông tin hóa đơn (readonly)
4. Nhập số tiền, phương thức, thông tin thanh toán
5. Validate: Số tiền <= Còn lại
6. Submit
7. Tạo Payment
8. Cập nhật Invoice (PaidAmount, RemainingAmount, Status)
9. Thành công → Refresh, hiển thị cập nhật trạng thái

### 7.3. In hóa đơn

1. User click "In hóa đơn" từ màn hình hóa đơn
2. Gọi API GET /api/invoices/{id}/pdf
3. Backend tạo PDF (dùng QuestPDF hoặc iTextSharp)
4. Hiển thị preview hoặc download PDF
5. User có thể in hoặc lưu file

## 8. TEMPLATE HÓA ĐƠN

### 8.1. Cấu trúc PDF

- **Header:** Logo, Tên công ty, Thông tin liên hệ
- **Thông tin hóa đơn:** Số, Ngày, Ngày đến hạn
- **Thông tin khách hàng:** Tên, Địa chỉ, SĐT, Email, MST
- **Bảng chi tiết:** STT, Mô tả, Số lượng, Đơn giá, Thành tiền
- **Tổng cộng:** SubTotal, Discount, Tax, Total
- **Thông tin thanh toán:** Đã thanh toán, Còn lại
- **Footer:** Chữ ký, Ghi chú, Điều khoản

### 8.2. Thư viện

- **QuestPDF:** Miễn phí, dễ sử dụng, hỗ trợ .NET
- **iTextSharp:** Miễn phí (LGPL), mạnh mẽ
- **Crystal Reports:** Có thể dùng cho báo cáo phức tạp hơn

## 9. YÊU CẦU KỸ THUẬT

### 9.1. Backend

- Transaction khi tạo hóa đơn và cập nhật đơn thuê
- Transaction khi thanh toán và cập nhật hóa đơn
- PDF generation với template đẹp
- Validation: Không cho thanh toán quá số tiền, không cho tạo hóa đơn trùng

### 9.2. Frontend

- Preview hóa đơn trước khi in
- Real-time tính toán khi nhập số tiền thanh toán
- Format currency đúng định dạng VNĐ
- Download PDF
- Print dialog
