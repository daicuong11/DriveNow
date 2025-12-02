# Hướng dẫn Routing Frontend

## Vấn đề: NotFound khi truy cập `/api/vehicle-types`

### Nguyên nhân:

- URL `/api/vehicle-types` là **API endpoint của backend**, không phải route frontend
- Frontend routes được định nghĩa khác với API endpoints

## Frontend Routes

### Routes hợp lệ:

- `/` → Redirect to `/dashboard`
- `/login` → Trang đăng nhập
- `/dashboard` → Trang Dashboard
- `/master-data/vehicle-types` → Quản lý Loại xe ✅
- `/master-data/vehicle-brands` → Quản lý Hãng xe ✅
- `*` (bất kỳ route nào khác) → Trang 404

### API Endpoints (Backend):

- `/api/vehicle-types` → API endpoint (không phải frontend route)
- `/api/vehicle-brands` → API endpoint (không phải frontend route)
- `/api/auth/login` → API endpoint (không phải frontend route)

## Cách truy cập đúng:

### ✅ Đúng:

```
http://localhost:5173/master-data/vehicle-types
```

### ❌ Sai:

```
http://localhost:5173/api/vehicle-types
```

## Vite Proxy Configuration

Frontend sử dụng Vite proxy để forward requests từ `/api/*` đến backend:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://localhost:7291',
    changeOrigin: true,
    secure: false,
  }
}
```

Điều này có nghĩa:

- Khi frontend code gọi `api.get('/vehicle-types')`, nó sẽ được proxy đến `https://localhost:7291/api/vehicle-types`
- Nhưng khi bạn truy cập trực tiếp URL `/api/vehicle-types` trong browser, nó sẽ không match với frontend routes và sẽ bị 404

## Giải pháp:

1. **Sử dụng đúng URL frontend**: `/master-data/vehicle-types`
2. **Truy cập qua Sidebar menu**: Click vào "Danh mục" → "Loại xe"
3. **Nếu gặp 404**: Sẽ hiển thị trang NotFound với nút "Về Trang chủ"

## Lưu ý:

- Frontend routes và API endpoints là **khác nhau**
- Frontend routes dùng cho navigation trong ứng dụng
- API endpoints dùng cho data fetching từ backend
- Vite proxy chỉ hoạt động khi gọi API từ code, không phải khi truy cập trực tiếp URL
