# KẾ HOẠCH DỰ ÁN - ỨNG DỤNG QUẢN LÝ CHO THUÊ XE HƠI TỰ LÁI

## 1. THÔNG TIN DỰ ÁN

**Tên dự án:** DriveNow - Ứng dụng Quản lý Cho thuê Xe hơi Tự lái  
**Ngày bắt đầu:** [Ngày bắt đầu dự án]  
**Ngày kết thúc dự kiến:** [Ngày kết thúc dự kiến]  
**Phiên bản:** 1.0.0

## 2. MỤC TIÊU DỰ ÁN

Xây dựng một hệ thống quản lý cho thuê xe hơi tự lái hoàn chỉnh, bao gồm:

- Quản lý danh mục (Master Data) đầy đủ
- Quản lý xe và trạng thái xe
- Quản lý quy trình cho thuê xe với workflow
- Quản lý khách hàng và hợp đồng
- Quản lý hóa đơn và thanh toán
- Dashboard và báo cáo thống kê
- Hệ thống phân quyền và bảo mật

## 3. PHẠM VI DỰ ÁN

### 3.1. Phạm vi bao gồm:

- Frontend: React TypeScript với Ant Design, TailwindCSS
- Backend: ASP.NET Core 9 Web API
- Database: SQL Server
- Authentication: JWT với Refresh Token
- Import/Export: Excel, PDF
- Báo cáo: Crystal Reports

### 3.2. Phạm vi không bao gồm:

- Ứng dụng mobile (chỉ web application)
- Tích hợp thanh toán trực tuyến (có thể mở rộng sau)
- GPS tracking (có thể mở rộng sau)

## 4. CÔNG NGHỆ SỬ DỤNG

### 4.1. Frontend

- **Framework:** React 18+ với TypeScript
- **State Management:** Redux Toolkit
- **API Client:** Axios + TanStack Query (React Query)
- **UI Library:** Ant Design (custom components)
- **Styling:** TailwindCSS
- **Authentication:** JWT Token + Refresh Token
- **Build Tool:** Vite hoặc Create React App

### 4.2. Backend

- **Framework:** ASP.NET Core 9 Web API
- **ORM:** Entity Framework Core (Code First)
- **Database:** SQL Server (miễn phí - SQL Server Express hoặc LocalDB)
- **Architecture:** 3-Layer Architecture
  - Presentation Layer (Controllers)
  - Business Logic Layer (Services)
  - Data Access Layer (Repositories, EF Core)
- **Authentication:** JWT Bearer Token
- **Dependency Injection:** Built-in DI Container

### 4.3. Thư viện hỗ trợ

- **Excel:** EPPlus hoặc ClosedXML (miễn phí)
- **Email:** MailKit hoặc FluentEmail (miễn phí)
- **PDF:** iTextSharp hoặc QuestPDF (miễn phí)
- **Reporting:** Crystal Reports (miễn phí cho development) hoặc QuestPDF
- **Logging:** Serilog hoặc NLog

## 5. CẤU TRÚC DỰ ÁN

```
DriveNow/
├── docs/                    # Tài liệu dự án
│   ├── features/           # Tài liệu nghiệp vụ chi tiết
│   └── project-plan.md     # Kế hoạch dự án
├── rules/                   # Quy tắc, convention, hướng dẫn
│   ├── code-base.md        # Mô tả code base
│   └── setup-guide.md      # Hướng dẫn khởi tạo
├── backend/                 # Backend API
│   ├── DriveNow.API/       # Web API Project
│   ├── DriveNow.Business/  # Business Logic Layer
│   ├── DriveNow.Data/      # Data Access Layer
│   └── DriveNow.Common/    # Common utilities
└── frontend/                # Frontend React
    ├── src/
    │   ├── components/     # Custom components
    │   ├── pages/          # Pages/Screens
    │   ├── services/       # API services
    │   ├── store/          # Redux store
    │   ├── hooks/          # Custom hooks
    │   └── utils/          # Utilities
    └── public/
```

## 6. GIAI ĐOẠN PHÁT TRIỂN

### Phase 1: Setup & Infrastructure (Tuần 1-2)

- [ ] Khởi tạo Backend project với cấu trúc 3 lớp
- [ ] Cấu hình Entity Framework Core
- [ ] Setup Authentication (JWT)
- [ ] Khởi tạo Frontend project
- [ ] Cấu hình Redux Toolkit, TanStack Query
- [ ] Setup Ant Design và TailwindCSS
- [ ] Tạo layout chính (Sidebar, Header, Content)

### Phase 2: Core Features - Authentication & Master Data (Tuần 3-4)

- [ ] Đăng nhập, đăng xuất
- [ ] Quản lý người dùng
- [ ] Phân quyền (Admin, Employee)
- [ ] Master Data: Loại xe, Hãng xe, Màu xe
- [ ] Master Data: Khách hàng
- [ ] Master Data: Cấu hình hệ thống
- [ ] Import/Export Excel cho Master Data

### Phase 3: Quản lý Xe (Tuần 5-6)

- [ ] Quản lý danh sách xe
- [ ] Quản lý trạng thái xe
- [ ] Xuất/Nhập bãi xe
- [ ] Bảo dưỡng, sửa chữa xe
- [ ] Lịch sử hoạt động xe

### Phase 4: Cho thuê Xe (Tuần 7-9)

- [ ] Tạo đơn thuê xe
- [ ] Workflow: Mở -> Xác nhận -> Xuất hóa đơn -> Hoàn thành
- [ ] Quản lý giá thuê
- [ ] Khuyến mãi, mã giảm giá
- [ ] Tính toán giá tự động
- [ ] Đồng bộ trạng thái xe khi cho thuê

### Phase 5: Hóa đơn & Thanh toán (Tuần 10-11)

- [ ] Tạo hóa đơn điện tử
- [ ] Quản lý thanh toán
- [ ] In hóa đơn (PDF/Crystal Report)
- [ ] Lịch sử giao dịch

### Phase 6: Dashboard & Báo cáo (Tuần 12-13)

- [ ] Dashboard tổng quan
- [ ] Báo cáo doanh thu
- [ ] Báo cáo số lượng xe
- [ ] Báo cáo khách hàng
- [ ] Export báo cáo (PDF, Excel)

### Phase 7: Testing & Optimization (Tuần 14)

- [ ] Unit Testing
- [ ] Integration Testing
- [ ] Performance Optimization
- [ ] Security Review
- [ ] Bug Fixing

### Phase 8: Deployment & Documentation (Tuần 15)

- [ ] Setup Production Environment
- [ ] Deploy Backend API
- [ ] Deploy Frontend
- [ ] Tài liệu hướng dẫn sử dụng
- [ ] Training

## 7. RỦI RO VÀ GIẢI PHÁP

### Rủi ro 1: Phức tạp của workflow cho thuê xe

**Giải pháp:** Thiết kế workflow rõ ràng, có state machine pattern

### Rủi ro 2: Đồng bộ trạng thái xe

**Giải pháp:** Sử dụng transaction, lock mechanism khi cập nhật trạng thái

### Rủi ro 3: Performance khi import Excel lớn

**Giải pháp:** Xử lý batch, background job

## 8. TIÊU CHÍ CHẤP NHẬN

- [ ] Tất cả chức năng nghiệp vụ hoạt động đúng
- [ ] Authentication và phân quyền hoạt động chính xác
- [ ] Import/Export Excel thành công
- [ ] Báo cáo xuất được PDF/Excel
- [ ] Giao diện responsive, đẹp mắt
- [ ] Code quality đạt chuẩn (theo convention)
- [ ] Không có lỗi bảo mật nghiêm trọng

## 9. TÀI NGUYÊN CẦN THIẾT

- Developer: 1-2 người
- Database: SQL Server Express (miễn phí)
- Hosting: Có thể deploy miễn phí (Azure Free Tier, Heroku, Vercel)
- Tools: Visual Studio 2022, VS Code, SQL Server Management Studio

## 10. KẾT LUẬN

Dự án được chia thành 8 giai đoạn rõ ràng với timeline cụ thể. Tập trung vào việc xây dựng nền tảng vững chắc trước, sau đó phát triển các tính năng nghiệp vụ theo thứ tự ưu tiên.
