# Hướng dẫn Test và Chạy Migration

## 1. Chạy Migration

```bash
cd backend/DriveNow.API
dotnet ef database update --project ../DriveNow.Data/DriveNow.Data.csproj
```

Sau khi migration chạy thành công, database sẽ được tạo và seed data sẽ tự động được thêm vào.

## 2. Chạy Backend API

```bash
cd backend/DriveNow.API
dotnet run
```

API sẽ chạy tại:

- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

## 3. Test Authentication

### Login với Admin:

- Username: `admin`
- Password: `Admin@123`

### Login với Employee:

- Username: `employee`
- Password: `Employee@123`

### Test API với Postman/Thunder Client:

1. **Login:**

   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "usernameOrEmail": "admin",
     "password": "Admin@123"
   }
   ```

2. **Get Dashboard Overview:**

   ```
   GET http://localhost:5000/api/dashboard/overview
   Authorization: Bearer {accessToken}
   ```

3. **Get Vehicle Types:**

   ```
   GET http://localhost:5000/api/vehicle-types?pageNumber=1&pageSize=10
   Authorization: Bearer {accessToken}
   ```

4. **Get Vehicle Brands:**
   ```
   GET http://localhost:5000/api/vehicle-brands?pageNumber=1&pageSize=10
   Authorization: Bearer {accessToken}
   ```

## 4. Chạy Frontend

```bash
cd frontend
npm install  # Nếu chưa cài
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 5. Test Flow

1. Mở browser: `http://localhost:5173`
2. Đăng nhập với `admin` / `Admin@123`
3. Kiểm tra Dashboard hiển thị các widgets
4. Test các Master Data pages:
   - Loại xe (Vehicle Types)
   - Hãng xe (Vehicle Brands)

## 6. Seed Data đã được tạo

- **Users:**

  - Admin: `admin` / `Admin@123`
  - Employee: `employee` / `Employee@123`

- **Vehicle Types:**

  - SEDAN, SUV, HATCHBACK, COUPE

- **Vehicle Brands:**

  - Toyota, Honda, Ford, BMW

- **Vehicle Colors:**
  - Đỏ, Xanh dương, Đen, Trắng, Bạc

## 7. Troubleshooting

### Lỗi kết nối database:

- Kiểm tra SQL Server đang chạy
- Kiểm tra connection string trong `appsettings.json`
- Đảm bảo database `DriveNowDB` đã được tạo

### Lỗi migration:

- Xóa migration cũ: `dotnet ef migrations remove`
- Tạo lại: `dotnet ef migrations add InitialCreate`
- Update: `dotnet ef database update`

### Lỗi CORS:

- Kiểm tra CORS policy trong `Program.cs`
- Đảm bảo frontend URL đúng (http://localhost:5173)
