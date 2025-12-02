# DriveNow

Ứng dụng Quản lý Cho thuê Xe hơi Tự lái

## Mô tả

DriveNow là một hệ thống quản lý cho thuê xe hơi tự lái hoàn chỉnh, được xây dựng với:

- **Frontend:** React TypeScript với Ant Design, TailwindCSS, Redux Toolkit, TanStack Query
- **Backend:** ASP.NET Core 9 Web API với Entity Framework Core, SQL Server

## Cấu trúc dự án

```
DriveNow/
├── docs/                    # Tài liệu dự án
│   ├── features/           # Tài liệu nghiệp vụ chi tiết
│   └── project-plan.md     # Kế hoạch dự án
├── rules/                   # Quy tắc, convention, hướng dẫn
│   ├── code-base.md        # Mô tả code base
│   └── setup-guide.md      # Hướng dẫn khởi tạo
├── backend/                 # Backend API (.NET Core)
│   ├── DriveNow.API/       # Web API Project
│   ├── DriveNow.Business/  # Business Logic Layer
│   ├── DriveNow.Data/      # Data Access Layer
│   └── DriveNow.Common/    # Common utilities
└── frontend/                # Frontend React
    └── src/                 # Source code
```

## Yêu cầu

- .NET SDK 9.0
- Node.js 18+
- SQL Server (LAPTOP-H70JFSCF\MSSQLSERVER01)

## Cài đặt

### Backend

```bash
cd backend
dotnet restore
dotnet build
```

### Frontend

```bash
cd frontend
npm install
```

## Chạy ứng dụng

### Backend

```bash
cd backend/DriveNow.API
dotnet run
```

Backend sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Tài liệu

Xem thêm tài liệu trong thư mục `docs/` và `rules/` để biết chi tiết về:

- Kế hoạch dự án
- Cấu trúc code base
- Hướng dẫn setup
- Tài liệu nghiệp vụ
