# Frontend - Backend Configuration Guide

## Port Configuration

### Backend Ports:

- **HTTP Profile**: `http://localhost:5151` (Development - không cần SSL)
- **HTTPS Profile**: `https://localhost:7291` (Production-like - cần SSL certificate)

### Frontend Port:

- **Development**: `http://localhost:5173`

## Current Configuration

### Frontend (vite.config.ts):

- Proxy target: `https://localhost:7291`
- Frontend sẽ tự động proxy tất cả requests từ `/api/*` đến `https://localhost:7291/api/*`

### Backend CORS:

- Đã cấu hình để allow tất cả origins trong development (`SetIsOriginAllowed(_ => true)`)
- Cho phép frontend tại `http://localhost:5173` và `http://127.0.0.1:5173`

## Cách chạy:

### Option 1: Backend HTTPS (Port 7291) - Recommended cho production-like testing

```bash
# Backend
cd backend/DriveNow.API
dotnet run --launch-profile https

# Frontend
cd frontend
npm run dev
```

### Option 2: Backend HTTP (Port 5151) - Recommended cho development

Nếu muốn dùng HTTP (port 5151) thay vì HTTPS:

1. **Cập nhật vite.config.ts**:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5151', // Đổi lại thành HTTP
    changeOrigin: true,
    secure: false,
    ws: true
  }
}
```

2. **Chạy backend với HTTP profile**:

```bash
cd backend/DriveNow.API
dotnet run --launch-profile http
```

## Environment Variables (Optional)

Nếu muốn linh hoạt hơn, có thể tạo file `.env` trong frontend:

```env
VITE_API_URL=https://localhost:7291/api
```

Và cập nhật `axios.ts` để dùng:

```typescript
baseURL: import.meta.env.VITE_API_URL || '/api'
```

## Lưu ý:

1. **HTTPS với self-signed certificate**:
   - Vite proxy có `secure: false` để chấp nhận self-signed certificates
   - Browser có thể hiển thị warning về certificate, nhưng vẫn hoạt động được

2. **CORS**:
   - Backend đã cấu hình để allow mọi origin trong development
   - Không cần lo về CORS issues

3. **Restart**:
   - Sau khi thay đổi `vite.config.ts`, cần restart frontend dev server
   - Sau khi thay đổi backend port, cần restart backend
