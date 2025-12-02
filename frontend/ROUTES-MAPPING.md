# Frontend Routes Mapping với Backend API

## Mapping Table

| Frontend Route    | Backend API Route         | Controller              | Description                         |
| ----------------- | ------------------------- | ----------------------- | ----------------------------------- |
| `/login`          | `/api/Auth/login`         | AuthController          | Trang đăng nhập                     |
| `/dashboard`      | `/api/Dashboard/overview` | DashboardController     | Trang Dashboard                     |
| `/vehicle-types`  | `/api/VehicleTypes`       | VehicleTypesController  | Quản lý Loại xe                     |
| `/vehicle-brands` | `/api/VehicleBrands`      | VehicleBrandsController | Quản lý Hãng xe                     |
| `/vehicle-colors` | `/api/VehicleColors`      | VehicleColorsController | Quản lý Màu xe (chưa implement)     |
| `/customers`      | `/api/Customers`          | CustomersController     | Quản lý Khách hàng (chưa implement) |
| `/employees`      | `/api/Employees`          | EmployeesController     | Quản lý Nhân viên (chưa implement)  |

## Routes Structure

### Frontend Routes (UI Navigation)

- **Pattern**: `/resource-name` (không có prefix `/api` hoặc `/master-data`)
- **Purpose**: Dùng cho navigation trong ứng dụng
- **Example**: `/vehicle-types`, `/dashboard`, `/login`

### Backend API Routes

- **Pattern**: `/api/ControllerName` (PascalCase, bỏ suffix "Controller")
- **Purpose**: Dùng cho API endpoints
- **Example**: `/api/VehicleTypes`, `/api/Dashboard/overview`, `/api/Auth/login`

## Route Naming Convention

### Frontend Routes

- Sử dụng kebab-case: `/vehicle-types`, `/vehicle-brands`
- Không có prefix `/api` (vì đó là cho backend)
- Không có prefix `/master-data` (đã được bỏ để khớp với backend)

### Backend API Routes

- Sử dụng kebab-case trong controller name: `VehicleTypesController` → `/api/vehicle-types`
- Có prefix `/api` để phân biệt với frontend routes

## Legacy Routes (Redirect)

Các routes cũ vẫn được hỗ trợ và sẽ redirect đến routes mới:

- `/master-data/vehicle-types` → `/vehicle-types`
- `/master-data/vehicle-brands` → `/vehicle-brands`

## Benefits

1. **Consistency**: Frontend routes khớp với backend API routes (bỏ prefix)
2. **Simplicity**: Routes ngắn gọn, dễ nhớ
3. **Maintainability**: Dễ maintain khi thêm features mới
4. **Backward Compatibility**: Legacy routes vẫn hoạt động

## Implementation Notes

- Frontend routes được định nghĩa trong `AppLayout.tsx`
- Backend routes được định nghĩa trong Controllers với `[Route("api/[controller]")]`
- Vite proxy forward `/api/*` requests đến backend
- React Router xử lý frontend navigation
