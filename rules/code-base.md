# MÔ TẢ CODE BASE - DRIVENOW

## 1. TỔNG QUAN

Dự án **DriveNow** là một ứng dụng web quản lý cho thuê xe hơi tự lái, được xây dựng với kiến trúc hiện đại, tách biệt Frontend và Backend.

## 2. CẤU TRÚC DỰ ÁN

### 2.1. Root Structure

```
DriveNow/
├── docs/                    # Tài liệu dự án
│   └── features/           # Tài liệu nghiệp vụ chi tiết
├── rules/                   # Quy tắc và convention
├── backend/                 # Backend API (.NET Core)
└── frontend/                # Frontend React
```

### 2.2. Backend Structure (ASP.NET Core 9)

```
backend/
├── DriveNow.API/                    # Web API Project (Presentation Layer)
│   ├── Controllers/                 # API Controllers
│   ├── Middleware/                  # Custom Middleware
│   ├── Filters/                     # Action Filters
│   ├── Program.cs                   # Entry point
│   └── appsettings.json
│
├── DriveNow.Business/               # Business Logic Layer
│   ├── Services/                    # Business Services
│   ├── Interfaces/                  # Service Interfaces
│   ├── DTOs/                        # Data Transfer Objects
│   ├── Validators/                  # FluentValidation
│   └── Mappings/                    # AutoMapper Profiles
│
├── DriveNow.Data/                   # Data Access Layer
│   ├── Entities/                    # Entity Models
│   ├── Repositories/                # Repository Pattern
│   ├── Interfaces/                  # Repository Interfaces
│   ├── DbContext/                   # ApplicationDbContext
│   └── Migrations/                  # EF Migrations
│
└── DriveNow.Common/                 # Common Utilities
    ├── Helpers/                     # Helper Classes
    ├── Constants/                   # Constants
    ├── Extensions/                  # Extension Methods
    └── Exceptions/                  # Custom Exceptions
```

### 2.3. Frontend Structure (React TypeScript)

```
frontend/
├── public/                          # Static files
├── src/
│   ├── components/                  # Reusable Components
│   │   ├── common/                  # Common components
│   │   ├── layout/                  # Layout components
│   │   └── antd/                    # Custom Ant Design components
│   │
│   ├── pages/                       # Page Components
│   │   ├── auth/                    # Authentication pages
│   │   ├── dashboard/               # Dashboard
│   │   ├── master-data/             # Master data pages
│   │   ├── vehicles/                # Vehicle management
│   │   ├── rentals/                 # Rental management
│   │   └── reports/                 # Reports
│   │
│   ├── services/                    # API Services
│   │   ├── api/                     # Axios instance & config
│   │   ├── auth.service.ts          # Auth API
│   │   ├── vehicle.service.ts       # Vehicle API
│   │   └── ...
│   │
│   ├── store/                       # Redux Store
│   │   ├── slices/                  # Redux Slices
│   │   ├── hooks.ts                 # Typed hooks
│   │   └── store.ts                 # Store configuration
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useAuth.ts               # Auth hook
│   │   └── useQuery.ts              # TanStack Query hooks
│   │
│   ├── utils/                       # Utilities
│   │   ├── constants.ts             # Constants
│   │   ├── helpers.ts               # Helper functions
│   │   └── validators.ts            # Form validators
│   │
│   ├── types/                       # TypeScript Types
│   │   ├── api.types.ts             # API response types
│   │   ├── entity.types.ts          # Entity types
│   │   └── common.types.ts          # Common types
│   │
│   ├── config/                      # Configuration
│   │   ├── theme.ts                 # Theme config
│   │   └── routes.ts                # Route config
│   │
│   ├── App.tsx                      # Root Component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
│
├── package.json
├── tsconfig.json
├── vite.config.ts (hoặc craco.config.js)
└── tailwind.config.js
```

## 3. CÔNG NGHỆ SỬ DỤNG

### 3.1. Frontend Stack

| Công nghệ      | Phiên bản | Mục đích               |
| -------------- | --------- | ---------------------- |
| React          | 18+       | UI Framework           |
| TypeScript     | 5+        | Type Safety            |
| Redux Toolkit  | Latest    | State Management       |
| TanStack Query | Latest    | Server State & Caching |
| Axios          | Latest    | HTTP Client            |
| Ant Design     | Latest    | UI Component Library   |
| TailwindCSS    | Latest    | Utility-first CSS      |
| React Router   | Latest    | Routing                |
| Vite           | Latest    | Build Tool             |

### 3.2. Backend Stack

| Công nghệ             | Phiên bản       | Mục đích       |
| --------------------- | --------------- | -------------- |
| .NET                  | 9.0             | Framework      |
| ASP.NET Core          | 9.0             | Web API        |
| Entity Framework Core | 9.0             | ORM            |
| SQL Server            | Express/LocalDB | Database       |
| JWT Bearer            | Latest          | Authentication |
| AutoMapper            | Latest          | Object Mapping |
| FluentValidation      | Latest          | Validation     |
| Serilog               | Latest          | Logging        |

### 3.3. Thư viện hỗ trợ

| Thư viện                 | Mục đích                     | Ghi chú          |
| ------------------------ | ---------------------------- | ---------------- |
| EPPlus hoặc ClosedXML    | Excel Import/Export          | Miễn phí         |
| MailKit hoặc FluentEmail | Email (đổi mật khẩu)         | Miễn phí         |
| QuestPDF hoặc iTextSharp | PDF Generation               | Miễn phí         |
| Crystal Reports          | Báo cáo (Hóa đơn, Nhập/Xuất) | Miễn phí cho dev |

## 4. YÊU CẦU KỸ THUẬT

### 4.1. Backend Requirements

#### 4.1.1. Entity Framework - Code First

- Sử dụng Code First approach
- Tất cả Entity phải kế thừa từ base class có các trường chung
- Khóa chính: `int Id` với `[Key]` và `[DatabaseGenerated(DatabaseGeneratedOption.Identity)]`
- Master Data Entity phải có:
  - `string Code` - Khóa import/export
  - `string Status` - Trạng thái (I = InActive, A = Active)
- Soft Delete: Sử dụng `bool IsDeleted` thay vì xóa vật lý
- Audit Fields: `CreatedDate`, `CreatedBy`, `ModifiedDate`, `ModifiedBy`

#### 4.1.2. Architecture Pattern

- **3-Layer Architecture:**
  - **Presentation Layer (API):** Controllers, Middleware, Filters
  - **Business Logic Layer:** Services, DTOs, Validators
  - **Data Access Layer:** Repositories, Entities, DbContext

#### 4.1.3. Dependency Injection

- Sử dụng built-in DI Container của .NET Core
- Đăng ký services trong `Program.cs` hoặc `Startup.cs`
- Lifetime: Scoped cho Services và Repositories

#### 4.1.4. Authentication & Authorization

- JWT Bearer Token Authentication
- Refresh Token mechanism
- Role-based Authorization (Admin, Employee)
- Claims-based cho các quyền chi tiết

#### 4.1.5. API Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "errors": []
}
```

### 4.2. Frontend Requirements

#### 4.2.1. State Management

- **Redux Toolkit:** Quản lý global state (auth, theme, settings)
- **TanStack Query:** Quản lý server state, caching, auto refetch
- **Local State:** useState cho component-specific state

#### 4.2.2. API Integration

- Axios instance với interceptors cho:
  - Request: Thêm JWT token
  - Response: Handle refresh token, error handling
- TanStack Query hooks cho tất cả API calls
- Custom hooks wrap TanStack Query để dễ sử dụng

#### 4.2.3. Component Architecture

- **Ant Design Components:** Sử dụng làm base
- **Custom Components:** Wrap Ant Design components để:
  - Thống nhất styling
  - Dễ maintain
  - Dễ customize
  - AI-friendly (có thể học và tái sử dụng)
- Component naming: PascalCase
- File naming: PascalCase cho components, camelCase cho utilities

#### 4.2.4. Styling

- **TailwindCSS:** Utility-first CSS
- **Ant Design Theme:** Custom theme config
- **Global Styles:** Thống nhất màu sắc, typography
- **Responsive:** Mobile-first approach

#### 4.2.5. Authentication Flow

- JWT Token lưu trong memory hoặc secure storage
- Refresh Token tự động khi token hết hạn
- Redirect to login khi unauthorized
- Protected routes với React Router

## 5. CODE CONVENTION

### 5.1. Naming Convention

#### Backend (C#)

- **Classes:** PascalCase (VD: `VehicleService`, `RentalRepository`)
- **Methods:** PascalCase (VD: `GetVehicleById`, `CreateRental`)
- **Properties:** PascalCase (VD: `VehicleId`, `RentalDate`)
- **Private fields:** camelCase với prefix `_` (VD: `_vehicleRepository`)
- **Interfaces:** PascalCase với prefix `I` (VD: `IVehicleService`)
- **Constants:** PascalCase (VD: `MaxRentalDays`)
- **Enums:** PascalCase (VD: `VehicleStatus`, `RentalStatus`)

#### Frontend (TypeScript/React)

- **Components:** PascalCase (VD: `VehicleList`, `RentalForm`)
- **Files:**
  - Components: PascalCase (VD: `VehicleList.tsx`)
  - Utilities: camelCase (VD: `formatDate.ts`)
- **Variables/Functions:** camelCase (VD: `getVehicleList`, `vehicleId`)
- **Constants:** UPPER_SNAKE_CASE (VD: `MAX_RENTAL_DAYS`)
- **Types/Interfaces:** PascalCase (VD: `Vehicle`, `RentalFormData`)

### 5.2. File Organization

#### Backend

- Mỗi Entity một file
- Mỗi Service một file
- Mỗi Repository một file
- DTOs trong thư mục riêng

#### Frontend

- Mỗi component một folder (nếu có nhiều file liên quan)
- Hoặc mỗi component một file
- Hooks trong thư mục `hooks/`
- Types trong thư mục `types/`

### 5.3. Code Style

#### Backend

- Sử dụng async/await thay vì .Result
- Sử dụng LINQ cho queries
- Validation trong Business Layer
- Exception handling với try-catch
- Logging cho các operations quan trọng

#### Frontend

- Functional Components với Hooks
- TypeScript strict mode
- ESLint + Prettier
- Component composition over inheritance
- Custom hooks cho logic tái sử dụng

### 5.4. Comments & Documentation

- XML comments cho public methods (Backend)
- JSDoc comments cho functions phức tạp (Frontend)
- README cho mỗi module quan trọng
- Inline comments cho logic phức tạp

## 6. DATABASE CONVENTION

### 6.1. Table Naming

- PascalCase hoặc snake_case (VD: `Vehicles`, `RentalOrders`)
- Số ít cho Entity, số nhiều cho Table (EF Core convention)

### 6.2. Column Naming

- PascalCase (VD: `VehicleId`, `RentalDate`)
- Foreign Keys: `{EntityName}Id` (VD: `VehicleId`, `CustomerId`)

### 6.3. Indexes

- Index cho các cột thường query
- Index cho Foreign Keys
- Composite Index cho queries phức tạp

## 7. API CONVENTION

### 7.1. RESTful API

- GET: Lấy dữ liệu
- POST: Tạo mới
- PUT: Cập nhật toàn bộ
- PATCH: Cập nhật một phần
- DELETE: Xóa

### 7.2. Endpoint Naming

- `/api/{controller}` (VD: `/api/vehicles`, `/api/rentals`)
- Resource-based naming
- Nested resources: `/api/vehicles/{id}/rentals`

### 7.3. Versioning

- Có thể sử dụng version trong URL: `/api/v1/vehicles`
- Hoặc trong header: `api-version: 1.0`

## 8. SECURITY REQUIREMENTS

- JWT Token với expiration time hợp lý
- Refresh Token rotation
- HTTPS trong production
- CORS configuration
- Input validation (Backend và Frontend)
- SQL Injection prevention (EF Core parameterized queries)
- XSS prevention (React tự động escape)
- CSRF protection

## 9. PERFORMANCE REQUIREMENTS

- Database indexing
- Query optimization (EF Core)
- Pagination cho danh sách lớn
- Lazy loading cho images
- Code splitting (Frontend)
- Caching với TanStack Query
- Debounce cho search inputs

## 10. TESTING REQUIREMENTS

- Unit Tests cho Business Logic
- Integration Tests cho API
- Frontend: Component tests (có thể bỏ qua nếu không có thời gian)

## 11. DEPLOYMENT

### 11.1. Backend

- Publish thành DLL
- Deploy lên IIS hoặc Azure App Service
- Connection string trong appsettings.Production.json

### 11.2. Frontend

- Build thành static files
- Deploy lên Vercel, Netlify, hoặc Azure Static Web Apps
- Environment variables cho API URL
