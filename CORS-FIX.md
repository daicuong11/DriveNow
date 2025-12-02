# Hướng dẫn Fix CORS Error

## Vấn đề

Frontend gọi API đến backend bị lỗi CORS: `strict-origin-when-cross-origin`

## Đã sửa

### 1. Backend - CORS Configuration

- ✅ Đã di chuyển `UseCors` lên trước `UseHttpsRedirection`
- ✅ Đã cấu hình CORS để allow any origin trong development
- ✅ Đã thêm `WithExposedHeaders("*")` để expose tất cả headers

### 2. Frontend - Axios Configuration

- ✅ Đã thay đổi baseURL từ `http://localhost:5000/api` sang `/api` (sử dụng Vite proxy)
- ✅ Đã thêm `Accept: application/json` header

### 3. Vite Proxy Configuration

- ✅ Đã cập nhật proxy target từ `http://localhost:5000` sang `http://localhost:5151` (port đúng của backend)

## Cách test

1. **Chạy Backend:**

   ```bash
   cd backend/DriveNow.API
   dotnet run
   ```

   Backend sẽ chạy tại: `http://localhost:5151`

2. **Chạy Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend sẽ chạy tại: `http://localhost:5173`

3. **Test API call:**
   - Frontend sẽ tự động sử dụng Vite proxy (`/api` → `http://localhost:5151/api`)
   - Không còn lỗi CORS

## Lưu ý

- Nếu vẫn còn lỗi, kiểm tra:

  1. Backend đang chạy đúng port (5151)
  2. Frontend đang chạy đúng port (5173)
  3. Browser console để xem lỗi chi tiết
  4. Network tab để xem request headers

- Trong production, cần:
  1. Bỏ `SetIsOriginAllowed(_ => true)`
  2. Chỉ allow specific origins
  3. Cấu hình đúng domain của frontend
