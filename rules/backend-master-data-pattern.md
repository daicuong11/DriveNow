# Backend Master Data Pattern

## Mục đích

File này mô tả pattern chuẩn để tạo các Service và Controller cho Master Data trong backend. Pattern này dựa trên `VehicleTypeService` và `VehicleTypesController` đã được hoàn thiện.

## Cấu trúc Files

### 1. Interface Service (`I{EntityName}Service.cs`)

**Location:** `backend/DriveNow.Business/Interfaces/I{EntityName}Service.cs`

**Pattern:**

```csharp
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface I{EntityName}Service
{
    Task<PagedResult<{EntityName}Dto>> GetPagedAsync(PagedRequest request);
    Task<{EntityName}Dto?> GetByIdAsync(int id);
    Task<{EntityName}Dto> CreateAsync(Create{EntityName}Request request);
    Task<{EntityName}Dto> UpdateAsync(int id, Update{EntityName}Request request);
    Task DeleteAsync(int id);
    Task<{EntityName}Dto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}
```

### 2. Service Implementation (`{EntityName}Service.cs`)

**Location:** `backend/DriveNow.Business/Services/{EntityName}Service.cs`

**Dependencies:**

- `IRepository<{EntityName}>` - Generic repository
- `ApplicationDbContext` - DbContext để query trực tiếp khi cần
- `DriveNow.Common.Extensions` - String extensions cho diacritic-insensitive search
- `OfficeOpenXml` (EPPlus) - Cho import/export Excel

**Required Methods:**

#### 2.1. GetPagedAsync

- **Mục đích:** Lấy danh sách có phân trang, tìm kiếm, lọc, sắp xếp
- **Pattern:**
  1. Bắt đầu với query filter `!IsDeleted`
  2. Normalize search term và filter terms bằng `NormalizeForSearch()`
  3. Áp dụng filter có thể translate sang SQL trước (ví dụ: Status)
  4. Materialize query bằng `ToListAsync()` để áp dụng diacritic-insensitive search trong memory
  5. Áp dụng search filter (tìm trong Code, Name, Description nếu có)
  6. Áp dụng advanced filters (FilterCode, FilterName, FilterDescription, FilterStatus, FilterCountry nếu có)
  7. Sort theo `SortBy` và `SortDescending`
  8. Pagination với `Skip()` và `Take()`
  9. Map sang DTO và return `PagedResult<{EntityName}Dto>`

**Example:**

```csharp
public async Task<PagedResult<VehicleTypeDto>> GetPagedAsync(PagedRequest request)
{
    var query = _context.VehicleTypes.Where(v => !v.IsDeleted);

    // Normalize search and filter terms
    string? normalizedSearchTerm = null;
    if (!string.IsNullOrWhiteSpace(request.SearchTerm))
    {
        normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
    }

    // Apply basic filters (can be translated to SQL)
    if (!string.IsNullOrWhiteSpace(request.FilterStatus))
    {
        query = query.Where(v => v.Status == request.FilterStatus.Trim());
    }

    // Materialize to apply diacritic-insensitive filters
    var allItems = await query.ToListAsync();

    // Apply search filter
    if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
    {
        allItems = allItems.Where(v =>
            v.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
            v.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
            (v.Description != null && v.Description.NormalizeForSearch().Contains(normalizedSearchTerm))
        ).ToList();
    }

    // Apply advanced filters
    // ... (similar pattern for FilterCode, FilterName, FilterDescription)

    // Sort
    var sortedItems = request.SortBy?.ToLower() switch
    {
        "code" => request.SortDescending ? allItems.OrderByDescending(v => v.Code) : allItems.OrderBy(v => v.Code),
        "name" => request.SortDescending ? allItems.OrderByDescending(v => v.Name) : allItems.OrderBy(v => v.Name),
        _ => allItems.OrderBy(v => v.Code)
    };

    // Pagination
    var totalCount = sortedItems.Count();
    var items = sortedItems
        .Skip((request.PageNumber - 1) * request.PageSize)
        .Take(request.PageSize)
        .Select(v => new VehicleTypeDto { /* map properties */ })
        .ToList();

    return new PagedResult<VehicleTypeDto>
    {
        Data = items,
        TotalCount = totalCount,
        PageNumber = request.PageNumber,
        PageSize = request.PageSize
    };
}
```

#### 2.2. GetByIdAsync

- **Mục đích:** Lấy một record theo ID
- **Pattern:** Dùng repository `GetByIdAsync`, map sang DTO, return null nếu không tìm thấy

#### 2.3. CreateAsync

- **Mục đích:** Tạo mới record
- **Pattern:**
  1. Validate Code unique (nếu có Code field)
  2. Tạo entity mới với `CreatedDate = DateTime.UtcNow`
  3. Dùng repository `AddAsync`
  4. Map sang DTO và return
  5. Throw `InvalidOperationException` nếu Code đã tồn tại

#### 2.4. UpdateAsync

- **Mục đích:** Cập nhật record
- **Pattern:**
  1. Lấy entity từ repository
  2. Throw `KeyNotFoundException` nếu không tìm thấy
  3. Update các properties (KHÔNG update Code)
  4. Set `ModifiedDate = DateTime.UtcNow`
  5. Dùng repository `UpdateAsync`
  6. Map sang DTO và return

#### 2.5. DeleteAsync

- **Mục đích:** Xóa record (soft delete)
- **Pattern:** Dùng repository `DeleteAsync` (đã implement soft delete)

#### 2.6. CopyAsync

- **Mục đích:** Tạo bản sao record
- **Pattern:**
  1. Lấy source entity
  2. Throw `KeyNotFoundException` nếu không tìm thấy
  3. Generate new Code (thêm suffix `_{counter}` nếu cần)
  4. Tạo entity mới với Name có suffix " (Copy)"
  5. Set `Status = StatusConstants.Active`
  6. Set `CreatedDate = DateTime.UtcNow`
  7. Dùng repository `AddAsync`
  8. Map sang DTO và return

#### 2.7. ImportExcelAsync

- **Mục đích:** Import dữ liệu từ Excel
- **Pattern:**
  1. Set `ExcelPackage.LicenseContext = LicenseContext.NonCommercial`
  2. Đọc Excel từ `Stream fileStream`
  3. Validate header row (row 1) - hỗ trợ cả tiếng Việt và tiếng Anh
  4. Validate required columns (Code, Name)
  5. Process data rows (từ row 2)
  6. Validate từng row:
     - Code không được trống, tự động ToUpper()
     - Name không được trống
     - Status mặc định "A" nếu không hợp lệ
     - Check Code unique trong database
  7. Nếu có lỗi validation, return `ImportExcelResponse` với `Success = false` và danh sách `Errors`
  8. Nếu không có lỗi, `AddRangeAsync` và `SaveChangesAsync`
  9. Return `ImportExcelResponse` với `Success = true` và `SuccessCount`

**Example:**

```csharp
public async Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName)
{
    var response = new ImportExcelResponse();
    var errors = new List<ImportError>();

    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

    using var package = new ExcelPackage(fileStream);
    var worksheet = package.Workbook.Worksheets[0];

    // Validate header
    var headers = new Dictionary<string, int>();
    // ... read headers

    // Validate required columns
    if (!headers.ContainsKey("mã") && !headers.ContainsKey("code"))
    {
        errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Mã' hoặc 'Code'", Field = "Code" });
    }

    // Process data rows
    var entitiesToAdd = new List<VehicleType>();
    for (int row = 2; row <= rowCount; row++)
    {
        // Validate and add to entitiesToAdd
    }

    // If errors, return early
    if (errors.Any())
    {
        response.Success = false;
        response.Errors = errors;
        return response;
    }

    // Import all valid rows
    if (entitiesToAdd.Any())
    {
        await _context.VehicleTypes.AddRangeAsync(entitiesToAdd);
        await _context.SaveChangesAsync();
        response.SuccessCount = entitiesToAdd.Count;
    }

    response.Success = true;
    return response;
}
```

#### 2.8. ExportExcelAsync

- **Mục đích:** Export dữ liệu ra Excel
- **Pattern:**
  1. Set `ExcelPackage.LicenseContext = LicenseContext.NonCommercial`
  2. Query data: nếu `ids == null || ids.Count == 0` thì export all, ngược lại export selected
  3. Tạo Excel package và worksheet
  4. Write headers (row 1) với style (bold, background color)
  5. Write data rows (từ row 2)
  6. Auto-fit columns
  7. Save vào `MemoryStream` và return (đảm bảo `Position = 0`)

**Example:**

```csharp
public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
{
    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

    List<VehicleType> data;
    if (ids == null || ids.Count == 0)
    {
        data = await _context.VehicleTypes.Where(v => !v.IsDeleted).ToListAsync();
    }
    else
    {
        data = await _context.VehicleTypes.Where(v => !v.IsDeleted && ids.Contains(v.Id)).ToListAsync();
    }

    using var package = new ExcelPackage();
    var worksheet = package.Workbook.Worksheets.Add("Sheet Name");

    // Headers
    worksheet.Cells[1, 1].Value = "Mã";
    // ... more headers

    // Style headers
    using (var range = worksheet.Cells[1, 1, 1, columnCount])
    {
        range.Style.Font.Bold = true;
        range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
        range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
    }

    // Data
    for (int i = 0; i < data.Count; i++)
    {
        var row = i + 2;
        worksheet.Cells[row, 1].Value = data[i].Code;
        // ... more columns
    }

    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

    var memoryStream = new MemoryStream();
    await package.SaveAsAsync(memoryStream);
    memoryStream.Position = 0;
    return memoryStream;
}
```

#### 2.9. DeleteMultipleAsync

- **Mục đích:** Xóa nhiều records (soft delete)
- **Pattern:**
  1. Validate `ids` không rỗng
  2. Query entities với `ids.Contains(v.Id) && !v.IsDeleted`
  3. Set `IsDeleted = true` và `ModifiedDate = DateTime.UtcNow` cho từng entity
  4. `SaveChangesAsync()`
  5. Throw `ArgumentException` nếu ids rỗng
  6. Throw `KeyNotFoundException` nếu một số IDs không tìm thấy

### 3. DTOs (`{EntityName}Dto.cs`)

**Location:** `backend/DriveNow.Business/DTOs/MasterData/{EntityName}Dto.cs`

**Required DTOs:**

- `{EntityName}Dto` - DTO cho read operations
- `Create{EntityName}Request` - DTO cho create (bao gồm Code)
- `Update{EntityName}Request` - DTO cho update (KHÔNG bao gồm Code)

**Pattern:**

```csharp
namespace DriveNow.Business.DTOs.MasterData;

public class {EntityName}Dto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
    // ... other properties
}

public class Create{EntityName}Request
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
    // ... other properties
}

public class Update{EntityName}Request
{
    // KHÔNG có Code
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
    // ... other properties
}
```

### 4. Controller (`{EntityName}sController.cs`)

**Location:** `backend/DriveNow.API/Controllers/{EntityName}sController.cs`

**Attributes:**

- `[ApiController]`
- `[Route("api/[controller]")]` - Sử dụng PascalCase cho controller name
- `[Authorize]` - Tất cả endpoints yêu cầu authentication
- `[Produces("application/json")]`

**Required Endpoints:**

#### 4.1. GET `/api/{EntityName}s`

- **Authorization:** `[Authorize]` - Tất cả user đã đăng nhập
- **Query Parameters:** `PagedRequest` (pageNumber, pageSize, searchTerm, sortBy, sortDescending, filterCode, filterName, filterStatus, ...)
- **Response:** `{ success: true, data: PagedResult<{EntityName}Dto> }`

#### 4.2. GET `/api/{EntityName}s/{id}`

- **Authorization:** `[Authorize]`
- **Response:** `{ success: true, data: {EntityName}Dto }` hoặc `{ success: false, message: "..." }` nếu NotFound

#### 4.3. POST `/api/{EntityName}s`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Body:** `Create{EntityName}Request`
- **Response:** `{ success: true, data: {EntityName}Dto, message: "Tạo mới thành công" }`
- **Error:** `BadRequest` với `InvalidOperationException` (Code đã tồn tại)

#### 4.4. PUT `/api/{EntityName}s/{id}`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Body:** `Update{EntityName}Request`
- **Response:** `{ success: true, data: {EntityName}Dto, message: "Cập nhật thành công" }`
- **Error:** `NotFound` với `KeyNotFoundException`

#### 4.5. DELETE `/api/{EntityName}s/{id}`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Response:** `{ success: true, message: "Xóa thành công" }`

#### 4.6. POST `/api/{EntityName}s/{id}/copy`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Response:** `{ success: true, data: {EntityName}Dto, message: "Tạo bản sao thành công" }`
- **Error:** `NotFound` với `KeyNotFoundException`

#### 4.7. POST `/api/{EntityName}s/import`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Content-Type:** `multipart/form-data`
- **Body:** `IFormFile file`
- **Validation:**
  - File không được rỗng
  - Chỉ chấp nhận `.xlsx`, `.xls`
- **Process:**
  1. Convert `IFormFile` sang `MemoryStream`
  2. Gọi service `ImportExcelAsync(memoryStream, file.FileName)`
  3. Nếu `result.Success == true`: return `Ok` với data
  4. Nếu `result.Success == false`: return `BadRequest` với errors
- **Response Success:** `{ success: true, data: ImportExcelResponse, message: "..." }`
- **Response Error:** `{ success: false, errors: ImportError[], message: "...", totalRows: number }`

#### 4.8. POST `/api/{EntityName}s/export`

- **Authorization:** `[Authorize]` - Tất cả user đã đăng nhập
- **Body:** `ExportExcelRequest { ids: List<int> }` - Empty list = export all
- **Process:**
  1. Gọi service `ExportExcelAsync(request?.Ids)`
  2. Return `File(memoryStream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName)`
- **Filename Format:** `"{entity-name}_Export.xlsx"` (kebab-case)

#### 4.9. POST `/api/{EntityName}s/bulk-delete`

- **Authorization:** `[Authorize(Roles = "Admin")]`
- **Body:** `List<int> ids`
- **Response:** `{ success: true, message: "Đã xóa {count} {entity-name} thành công" }`
- **Error:** `BadRequest` với `ArgumentException` hoặc `KeyNotFoundException`

## Dependencies

### NuGet Packages

- `EPPlus` (Version 7.0.0) - Cho import/export Excel (cần thêm vào `DriveNow.Business.csproj`)

### Project References

- `DriveNow.Data` - Cho entities và repository
- `DriveNow.Common` - Cho extensions và constants

## Notes

1. **Search và Filter:**

   - Search hỗ trợ tìm trong Code, Name, Description (nếu có)
   - Search và filter text phải diacritic-insensitive (hỗ trợ tiếng Việt có dấu/không dấu)
   - Sử dụng `NormalizeForSearch()` và `ContainsIgnoreCaseAndDiacritics()` từ `DriveNow.Common.Extensions`

2. **Code Field:**

   - Code phải unique (check trong CreateAsync)
   - Code không được update trong UpdateAsync
   - Code tự động ToUpper() trong ImportExcelAsync

3. **Status Field:**

   - Mặc định "A" (Active)
   - Hỗ trợ filter trong GetPagedAsync

4. **Soft Delete:**

   - Tất cả queries phải filter `!IsDeleted`
   - Delete operations set `IsDeleted = true` và `ModifiedDate = DateTime.UtcNow`

5. **Import/Export:**

   - Import: Validate tất cả rows trước, nếu có lỗi thì không import gì cả
   - Export: Hỗ trợ export all hoặc export selected
   - Excel headers hỗ trợ cả tiếng Việt và tiếng Anh

6. **Error Handling:**

   - `InvalidOperationException` -> `BadRequest` (thường là Code đã tồn tại)
   - `KeyNotFoundException` -> `NotFound`
   - `ArgumentException` -> `BadRequest`
   - Exception khác -> `StatusCode(500)`

7. **Response Format:**
   - Success: `{ success: true, data: T, message?: string }`
   - Error: `{ success: false, message: string, errors?: ImportError[] }`
