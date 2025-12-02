# HƯỚNG DẪN KHỞI TẠO SOURCE CODE - DRIVENOW

Tài liệu này hướng dẫn chi tiết các bước để AI Agent khởi tạo source code cho dự án DriveNow, từ Backend đến Frontend.

## 1. YÊU CẦU TIÊN QUYẾT

### 1.1. Phần mềm cần cài đặt

- **.NET SDK 9.0** hoặc cao hơn
- **Node.js 18+** và npm/yarn
- **SQL Server Express** hoặc **SQL Server LocalDB** (miễn phí)
- **Visual Studio 2022** (Community Edition - miễn phí) hoặc **VS Code**
- **Git** (nếu cần version control)

### 1.2. Kiến thức cần có

- C# và ASP.NET Core
- React và TypeScript
- Entity Framework Core
- SQL Server

## 2. KHỞI TẠO BACKEND

### Bước 1: Tạo Solution và Projects

```bash
# Tạo thư mục backend
mkdir backend
cd backend

# Tạo Solution
dotnet new sln -n DriveNow

# Tạo các projects
dotnet new classlib -n DriveNow.Common -f net9.0
dotnet new classlib -n DriveNow.Data -f net9.0
dotnet new classlib -n DriveNow.Business -f net9.0
dotnet new webapi -n DriveNow.API -f net9.0

# Thêm projects vào solution
dotnet sln add DriveNow.Common/DriveNow.Common.csproj
dotnet sln add DriveNow.Data/DriveNow.Data.csproj
dotnet sln add DriveNow.Business/DriveNow.Business.csproj
dotnet sln add DriveNow.API/DriveNow.API.csproj
```

### Bước 2: Cấu hình Project References

```bash
# Data phụ thuộc Common
dotnet add DriveNow.Data/DriveNow.Data.csproj reference DriveNow.Common/DriveNow.Common.csproj

# Business phụ thuộc Data và Common
dotnet add DriveNow.Business/DriveNow.Business.csproj reference DriveNow.Data/DriveNow.Data.csproj
dotnet add DriveNow.Business/DriveNow.Business.csproj reference DriveNow.Common/DriveNow.Common.csproj

# API phụ thuộc Business, Data và Common
dotnet add DriveNow.API/DriveNow.API.csproj reference DriveNow.Business/DriveNow.Business.csproj
dotnet add DriveNow.API/DriveNow.API.csproj reference DriveNow.Data/DriveNow.Data.csproj
dotnet add DriveNow.API/DriveNow.API.csproj reference DriveNow.Common/DriveNow.Common.csproj
```

### Bước 3: Cài đặt NuGet Packages

#### DriveNow.Common

```bash
cd DriveNow.Common
# Không cần package đặc biệt cho Common
cd ..
```

#### DriveNow.Data

```bash
cd DriveNow.Data
dotnet add package Microsoft.EntityFrameworkCore --version 9.0.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.0.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.0.0
cd ..
```

#### DriveNow.Business

```bash
cd DriveNow.Business
dotnet add package AutoMapper --version 12.0.1
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection --version 12.0.0
dotnet add package FluentValidation --version 11.9.0
dotnet add package FluentValidation.DependencyInjectionExtensions --version 11.9.0
cd ..
```

#### DriveNow.API

```bash
cd DriveNow.API
dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.0.0
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 9.0.0
dotnet add package Serilog.AspNetCore --version 8.0.0
dotnet add package Swashbuckle.AspNetCore --version 6.5.0
dotnet add package EPPlus --version 7.0.0
dotnet add package MailKit --version 4.3.0
dotnet add package QuestPDF --version 2024.3.10
cd ..
```

### Bước 4: Tạo cấu trúc thư mục

#### DriveNow.Common

```
DriveNow.Common/
├── Helpers/
├── Constants/
├── Extensions/
└── Exceptions/
```

#### DriveNow.Data

```
DriveNow.Data/
├── Entities/
├── Repositories/
├── Interfaces/
├── DbContext/
└── Migrations/ (sẽ tự tạo khi chạy migration)
```

#### DriveNow.Business

```
DriveNow.Business/
├── Services/
├── Interfaces/
├── DTOs/
├── Validators/
└── Mappings/
```

#### DriveNow.API

```
DriveNow.API/
├── Controllers/
├── Middleware/
├── Filters/
└── Program.cs
```

### Bước 5: Tạo Base Classes và Common Code

#### DriveNow.Common/Entities/BaseEntity.cs

```csharp
namespace DriveNow.Common.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
}
```

#### DriveNow.Common/Entities/BaseMasterEntity.cs

```csharp
namespace DriveNow.Common.Entities;

public abstract class BaseMasterEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = "A"; // A = Active, I = InActive
}
```

#### DriveNow.Common/Constants/StatusConstants.cs

```csharp
namespace DriveNow.Common.Constants;

public static class StatusConstants
{
    public const string Active = "A";
    public const string InActive = "I";
}
```

### Bước 6: Cấu hình DbContext

#### DriveNow.Data/DbContext/ApplicationDbContext.cs

```csharp
using Microsoft.EntityFrameworkCore;
using DriveNow.Common.Entities;

namespace DriveNow.Data.DbContext;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets sẽ được thêm sau khi tạo Entities

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

### Bước 7: Cấu hình Program.cs (DriveNow.API)

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DriveNow.Data.DbContext;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication & Authorization
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Bước 8: Cấu hình appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=DriveNowDB;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGenerationAtLeast32Characters",
    "Issuer": "DriveNowAPI",
    "Audience": "DriveNowClient",
    "ExpirationInMinutes": 60,
    "RefreshTokenExpirationInDays": 7
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "your-app-password"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Bước 9: Tạo Migration đầu tiên

```bash
cd DriveNow.API
dotnet ef migrations add InitialCreate --project ../DriveNow.Data/DriveNow.Data.csproj
dotnet ef database update --project ../DriveNow.Data/DriveNow.Data.csproj
```

## 3. KHỞI TẠO FRONTEND

### Bước 1: Tạo React Project với Vite

```bash
# Quay về root directory
cd ../..

# Tạo React project với Vite và TypeScript
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Bước 2: Cài đặt Dependencies

```bash
# Core dependencies
npm install react-router-dom
npm install @reduxjs/toolkit react-redux
npm install @tanstack/react-query axios
npm install antd
npm install tailwindcss postcss autoprefixer

# Dev dependencies
npm install -D @types/react-router-dom
```

### Bước 3: Cấu hình TailwindCSS

```bash
# Initialize Tailwind
npx tailwindcss init -p
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
      },
    },
  },
  plugins: [],
};
```

#### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Ant Design customization */
.ant-layout {
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### Bước 4: Cấu hình Vite

#### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

### Bước 5: Cấu hình TypeScript

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Bước 6: Tạo cấu trúc thư mục

```
src/
├── components/
│   ├── common/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── antd/
│       ├── CustomTable.tsx
│       ├── CustomForm.tsx
│       └── CustomButton.tsx
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── ForgotPassword.tsx
│   └── dashboard/
│       └── Dashboard.tsx
├── services/
│   ├── api/
│   │   ├── axios.ts
│   │   └── interceptors.ts
│   └── auth.service.ts
├── store/
│   ├── slices/
│   │   └── authSlice.ts
│   ├── hooks.ts
│   └── store.ts
├── hooks/
│   ├── useAuth.ts
│   └── useQuery.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   └── validators.ts
├── types/
│   ├── api.types.ts
│   ├── entity.types.ts
│   └── common.types.ts
├── config/
│   ├── theme.ts
│   └── routes.ts
├── App.tsx
├── main.tsx
└── index.css
```

### Bước 7: Setup Redux Store

#### src/store/store.ts

```typescript
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### src/store/hooks.ts

```typescript
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Bước 8: Setup TanStack Query

#### src/main.tsx

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store/store";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
```

### Bước 9: Setup Axios với Interceptors

#### src/services/api/axios.ts

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Bước 10: Cấu hình Ant Design Theme

#### src/config/theme.ts

```typescript
import { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#0ea5e9",
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 8,
    },
    Card: {
      borderRadius: 8,
    },
  },
};
```

#### src/App.tsx

```typescript
import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import { themeConfig } from "./config/theme";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
```

## 4. KIỂM TRA VÀ CHẠY THỬ

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

## 5. CÁC BƯỚC TIẾP THEO

Sau khi khởi tạo xong, AI Agent cần:

1. Tạo các Entities theo tài liệu nghiệp vụ
2. Tạo Repositories và Services
3. Tạo API Controllers
4. Tạo Frontend pages và components
5. Implement Authentication
6. Implement các chức năng nghiệp vụ

Xem thêm các tài liệu trong `docs/features/` để biết chi tiết về nghiệp vụ.
